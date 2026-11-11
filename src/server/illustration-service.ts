import "server-only";
import { randomUUID } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import sharp from "sharp";
import { z } from "zod";
import { buildImagePrompt, creativeBriefSchema, illustrationProjectSchema, type IllustrationProject } from "@/domain/illustration";
import { replaceIllustration, storySchema } from "@/domain/story";
import { fixtureSource } from "@/domain/provenance";
import { readConfig } from "./config";
import { requireLocalOrigin, readBoundedBody, sessionId } from "./capture-service";
import { AppError, errorResponse } from "./errors";
import { openDatabase } from "./storage";
import { accountForAccessChecks, createDollarGuard } from "./allowance";
import { createProvider } from "./providers";
import type { ProviderResult, ImageAsset, StoryProvider } from "./providers/types";

type Config = ReturnType<typeof readConfig>;
const commandSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("start"), story: storySchema, brief: creativeBriefSchema, saveConsent: z.literal(true) }),
  z.object({ action: z.literal("sheet"), revision: z.number().int() }),
  z.object({ action: z.literal("approve-sheet"), revision: z.number().int(), assetId: z.uuid(), acceptMeasuredCost: z.literal(true) }),
  z.object({ action: z.literal("page"), revision: z.number().int(), page: z.number().int().min(1).max(6), prompt: z.string().trim().min(1).max(3000), sceneConfirmed: z.literal(true) }),
  z.object({ action: z.literal("approve-page"), revision: z.number().int(), page: z.number().int().min(1).max(6), assetId: z.uuid() }),
  z.object({ action: z.literal("freeze"), revision: z.number().int(), redistributionConsent: z.literal(true) }),
  z.object({ action: z.literal("delete"), revision: z.number().int() }),
]);
const json = (value: unknown) => Response.json(value, { headers: { "Cache-Control": "no-store" } });

export class IllustrationWorkspace {
  constructor(private db: DatabaseSync, private session: string, private config: Config, private provider: StoryProvider) {}
  read(): IllustrationProject | null {
    const row = this.db.prepare("SELECT payload FROM illustration_projects WHERE session_id = ?").get(this.session);
    return row ? illustrationProjectSchema.parse(JSON.parse(String(row.payload))) : null;
  }
  status() {
    const usage = this.db.prepare("SELECT COUNT(CASE WHEN kind = 'image' THEN 1 END) AS attempts, COALESCE(SUM(COALESCE(actual,reserved)),0) AS exposure FROM ai_operations").get()!;
    return { project: this.read(), attempts: Number(usage.attempts), attemptLimit: this.config.IMAGE_ATTEMPT_LIMIT, exposureUsd: Number(usage.exposure) / 1_000_000, sessionBudgetUsd: this.config.SESSION_BUDGET_USD, developmentBudgetUsd: this.config.DEVELOPMENT_BUDGET_USD };
  }
  asset(id: string): Uint8Array {
    z.uuid().parse(id);
    const row = this.db.prepare("SELECT bytes, frozen_bytes FROM illustration_assets WHERE id = ? AND session_id = ?").get(id, this.session);
    if (!row) throw new AppError("NOT_FOUND", "Private image not found.", 404);
    return new Uint8Array((row.frozen_bytes ?? row.bytes) as Uint8Array);
  }
  async execute(raw: unknown) {
    const command = commandSchema.parse(raw);
    if (command.action === "start") {
      if (this.read()) throw new AppError("INVALID_INPUT", "A workspace already exists. Preserve it and review its character sheet.");
      const project: IllustrationProject = { id: randomUUID(), revision: 0, mode: this.config.AI_PROVIDER, brief: command.brief,
        story: { ...command.story, visibility: "private", sharingConsent: false, pages: command.story.pages.map(page => ({ ...page, approvals: { text: false, illustration: false, audio: false }, translation: page.translation?.status === "approved" ? { ...page.translation, status: "edited" as const } : page.translation })) },
        sheet: null, pages: Array(6).fill(null), pagePrompts: command.story.pages.map(page => page.illustrationDescription), costAccepted: false, halted: false, redistributionConsent: false };
      this.db.prepare("INSERT INTO illustration_projects VALUES (?, ?, 0)").run(this.session, JSON.stringify(illustrationProjectSchema.parse(project)));
      return this.status();
    }
    // A durable lease prevents edits/approvals racing a paid call. A crashed process
    // leaves the lease set for explicit operator investigation, never auto-retry.
    const lease = this.db.prepare("UPDATE illustration_projects SET busy = 1 WHERE session_id = ? AND busy = 0").run(this.session);
    if (!lease.changes) throw new AppError("RATE_LIMITED", "Workspace is busy or needs investigation after an interrupted operation.", 429);
    let project: IllustrationProject | null = null;
    try {
      project = this.read();
      if (!project || project.revision !== command.revision || project.mode !== this.config.AI_PROVIDER) throw new AppError("INVALID_INPUT", "Reload the current workspace before changing it.", 409);
      if (command.action === "delete") {
        this.db.exec("BEGIN IMMEDIATE");
        try {
          this.db.prepare("DELETE FROM illustration_assets WHERE session_id = ?").run(this.session);
          this.db.prepare("DELETE FROM illustration_projects WHERE session_id = ?").run(this.session);
          this.db.exec("COMMIT");
        } catch (error) { this.db.exec("ROLLBACK"); throw error; }
        return this.status();
      }
      if (project.halted) throw new AppError("BUDGET_EXCEEDED", "Image work stopped. Review usage and the failed operation before continuing.", 429);
      if ((command.action === "sheet" || command.action === "page") && project.mode === "real") {
        const attempts = Number(this.db.prepare("SELECT COUNT(*) AS n FROM ai_operations WHERE kind = 'image'").get()!.n);
        if (attempts >= this.config.IMAGE_ATTEMPT_LIMIT) throw new AppError("BUDGET_EXCEEDED", "Image attempt cap reached. Stop and report before further paid work.", 429);
        if (this.db.prepare("SELECT id FROM ai_operations WHERE kind = 'image' AND state = 'pending'").get()) throw new AppError("BUDGET_EXCEEDED", "An image outcome is unresolved. Stop and investigate; no further paid work was sent.", 429);
      }
      if (command.action === "sheet") {
        if (project.sheet) throw new AppError("APPROVAL_REQUIRED", "One character sheet has already been generated. Review it before any further image work.");
        const result = await this.provider.createCharacterSheet(project.story, buildImagePrompt(project.brief));
        project.sheet = await this.storeImage(result);
        if (project.mode === "real" && (result.usage.actualUsd === null || !result.usage.tokens || !result.usage.imageTokens)) project.halted = true;
      } else if (command.action === "approve-sheet") {
        if (!project.sheet || project.sheet.assetId !== command.assetId) throw new AppError("APPROVAL_REQUIRED", "Review the current character sheet first.");
        if (project.mode === "real" && (project.sheet.usage.actualUsd === null || !project.sheet.usage.tokens)) throw new AppError("BUDGET_EXCEEDED", "Real image measurements are missing; pages remain blocked.", 429);
        project.sheet.approved = true; project.costAccepted = true;
      } else if (command.action === "page") {
        if (!project.sheet?.approved || !project.costAccepted) throw new AppError("APPROVAL_REQUIRED", "Approve the character sheet and measured cost before generating any page images.");
        const index = command.page - 1;
        const result = await this.provider.illustrate({ page: project.story.pages[index], characterSheetAssetId: project.sheet.source.assetId,
          sharedStyle: project.brief.style, culturalContext: project.brief.setting, prompt: buildImagePrompt(project.brief, command.prompt), referenceImageBase64: Buffer.from(this.asset(project.sheet.assetId)).toString("base64") });
        const image = await this.storeImage(result);
        project.pages[index] = image; project.pagePrompts[index] = command.prompt;
        project.redistributionConsent = false;
        project.story.pages[index] = replaceIllustration(project.story.pages[index], image.source.assetId, image.source);
        project.story.pages[index].illustrationDescription = command.prompt;
        if (project.mode === "real" && result.usage.actualUsd === null) project.halted = true;
      } else if (command.action === "approve-page") {
        const image = project.pages[command.page - 1];
        if (!image || image.assetId !== command.assetId) throw new AppError("APPROVAL_REQUIRED", "Review the current page image first.");
        image.approved = true;
        // Mock acknowledgements never promote story assets to genuine approval.
        project.story.pages[command.page - 1].approvals.illustration = project.mode === "real";
      } else if (command.action === "freeze") {
        if (!project.sheet?.approved || project.pages.some(page => !page?.approved)) throw new AppError("APPROVAL_REQUIRED", "Approve the sheet and all six current images before freezing.");
        // Optimize privately only after explicit approval; never publish/commit here.
        for (const image of [project.sheet, ...project.pages]) {
          if (!image) continue;
          const bytes = await sharp(this.asset(image.assetId), { limitInputPixels: 4_194_304 }).rotate().resize({ width: 1024, height: 1024, fit: "inside", withoutEnlargement: true }).webp({ quality: 80 }).toBuffer();
          this.db.prepare("UPDATE illustration_assets SET frozen_bytes = ? WHERE id = ? AND session_id = ?").run(bytes, image.assetId, this.session);
          image.frozen = true;
        }
        project.redistributionConsent = true;
      }
      const totals = this.db.prepare("SELECT COALESCE(SUM(COALESCE(actual,reserved)),0) AS total, COALESCE(SUM(CASE WHEN session_id = ? THEN COALESCE(actual,reserved) ELSE 0 END),0) AS session FROM ai_operations").get(this.session)!;
      if (Number(totals.total) > this.config.DEVELOPMENT_BUDGET_USD * 1e6 || Number(totals.session) > this.config.SESSION_BUDGET_USD * 1e6) project.halted = true;
      project.revision++;
      this.persist(project);
      return this.status();
    } catch (error) {
      // Safety rejection does not dispatch an image. Paid/ambiguous failures stop
      // the project, retaining any guard reservation and prior approved assets.
      if (project && error instanceof AppError && ["BUDGET_EXCEEDED", "API_UNAVAILABLE", "INVALID_PROVIDER_RESPONSE", "RATE_LIMITED"].includes(error.code)) {
        project.halted = true; project.revision++; this.persist(project);
      }
      throw error;
    } finally { this.db.prepare("UPDATE illustration_projects SET busy = 0 WHERE session_id = ?").run(this.session); }
  }
  private persist(project: IllustrationProject) { this.db.prepare("UPDATE illustration_projects SET payload = ? WHERE session_id = ?").run(JSON.stringify(illustrationProjectSchema.parse(project)), this.session); }
  private async storeImage(result: ProviderResult<ImageAsset>) {
    const assetId = randomUUID();
    const bytes = this.config.AI_PROVIDER === "mock" ? await sharp({ create: { width: 256, height: 256, channels: 3, background: "#e1ad4e" } }).webp().toBuffer() : Buffer.from(result.data.imageBase64 ?? "", "base64");
    if (!bytes.length || bytes.length > 12_000_000) throw new AppError("INVALID_PROVIDER_RESPONSE", "Image bytes missing or too large.", 502);
    let metadata;
    try { metadata = await sharp(bytes, { limitInputPixels: 4_194_304 }).metadata(); }
    catch { throw new AppError("INVALID_PROVIDER_RESPONSE", "Image bytes could not be decoded safely.", 502); }
    if (metadata.format !== "webp" || metadata.pages && metadata.pages !== 1) throw new AppError("INVALID_PROVIDER_RESPONSE", "Expected a still WebP image.", 502);
    this.db.prepare("INSERT INTO illustration_assets VALUES (?, ?, ?, NULL)").run(assetId, this.session, bytes);
    return { assetId, source: this.config.AI_PROVIDER === "mock" ? fixtureSource(`mock-${assetId}`, "local-placeholder") : result.assets[0], approved: false, frozen: false, usage: result.usage };
  }
}

export function createIllustrationHandlers(dependencies: { config?: () => Config; provider?: typeof createProvider } = {}) {
  const config = dependencies.config ?? readConfig;
  return {
    async session(request: Request) {
      let db: DatabaseSync | undefined;
      try {
        requireLocalOrigin(request); const settings = config(); db = openDatabase(settings.DATA_DIR);
        if (settings.AI_PROVIDER === "real" && !settings.ENABLE_LIVE_AI) throw new AppError("API_UNAVAILABLE", "Live image work is disabled.", 503);
        const existing = sessionId(request, db); const id = existing ?? randomUUID();
        // A stable private-workspace session allows review across restarts. It does
        // not reset shared development accounting or grant accounts/hosting.
        db.prepare("INSERT INTO ai_sessions VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET expires_at = excluded.expires_at").run(id, Date.now() + 7 * 86400000);
        const response = json({ ready: true });
        response.headers.set("Set-Cookie", `storispaza-session=${id}; HttpOnly; SameSite=Strict; Path=/; Max-Age=604800`);
        return response;
      } catch (error) { return errorResponse(error); } finally { db?.close(); }
    },
    async handle(request: Request) {
      let db: DatabaseSync | undefined;
      try {
        if (request.method === "POST") requireLocalOrigin(request);
        else if (!["127.0.0.1", "localhost", "[::1]"].includes(new URL(request.url).hostname) || request.headers.get("sec-fetch-site") === "cross-site") throw new AppError("INVALID_INPUT", "Local private access required.", 403);
        const settings = config();
        if (settings.AI_PROVIDER === "real" && !settings.ENABLE_LIVE_AI) throw new AppError("API_UNAVAILABLE", "Live image work is disabled.", 503);
        db = openDatabase(settings.DATA_DIR);
        const session = sessionId(request, db);
        if (!session) throw new AppError("CONSENT_REQUIRED", "Open a local illustration session first.", 403);
        if (settings.AI_PROVIDER === "real") accountForAccessChecks(db);
        const provider = (dependencies.provider ?? createProvider)(settings, settings.AI_PROVIDER === "real" ? adapter => createDollarGuard(db!, session, adapter, { sessionUsd: settings.SESSION_BUDGET_USD, developmentUsd: settings.DEVELOPMENT_BUDGET_USD, requestsPerMinute: settings.AI_REQUESTS_PER_MINUTE }, settings.IMAGE_ATTEMPT_LIMIT) : undefined);
        const workspace = new IllustrationWorkspace(db, session, settings, provider);
        if (request.method === "GET") {
          const asset = new URL(request.url).searchParams.get("asset");
          if (asset) return new Response(workspace.asset(asset).slice().buffer as ArrayBuffer, { headers: { "Content-Type": "image/webp", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", "Cross-Origin-Resource-Policy": "same-origin" } });
          return json(workspace.status());
        }
        if (request.headers.get("x-ai-consent") !== "true") throw new AppError("CONSENT_REQUIRED", "Confirm image prompt transmission and private local draft storage.");
        if (!request.headers.get("content-type")?.startsWith("application/json")) throw new AppError("INVALID_INPUT", "Use JSON.");
        const bytes = await readBoundedBody(request, 150000);
        let raw: unknown;
        try { raw = JSON.parse(new TextDecoder().decode(bytes)); } catch { throw new AppError("INVALID_INPUT", "Invalid JSON."); } finally { bytes.fill(0); }
        return json(await workspace.execute(raw));
      } catch (error) { return errorResponse(error); } finally { db?.close(); }
    },
  };
}
