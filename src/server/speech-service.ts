import "server-only";
import { createHash, randomUUID } from "node:crypto";
import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import type { DatabaseSync } from "node:sqlite";
import { z } from "zod";
import { newMockDraft } from "@/domain/mock-journey";
import { assetSourceSchema } from "@/domain/provenance";
import { editNarrative, type Story } from "@/domain/story";
import { clipIdSchema, initialSpeechProject, recordApprovedCreatorSelections, speechFreezeIssues, speechProjectSchema, type SpeechProject, type SpeechScript } from "@/domain/speech";
import { MAX_AUDIO_BYTES, validateCaptureWav } from "@/domain/capture";
import { readConfig } from "./config";
import { requireLocalOrigin, readBoundedBody, sessionId } from "./capture-service";
import { openDatabase } from "./storage";
import { AppError, errorResponse } from "./errors";
import { accountForAccessChecks, createDollarGuard } from "./allowance";
import { createProvider } from "./providers";
import type { ProviderResult, StoryProvider } from "./providers/types";

type Config = ReturnType<typeof readConfig>;
export const narrativeDigest = (story: Story) => createHash("sha256").update(JSON.stringify(story.pages.map(page => page.narrative))).digest("hex");
export const translationSeedSchema = z.object({ sourceDigest: z.string().length(64), result: z.object({ data: z.array(z.string().min(1).max(5000)).length(6), provenance: z.literal("generated"), providerId: z.string(), assets: z.array(assetSourceSchema).length(6), reviewNotes: z.array(z.object({ page: z.number().int().min(1).max(6), term: z.string().max(300), reason: z.string().max(1000) })).max(60).optional(), usage: z.object({ actualUsd: z.number().nonnegative().nullable(), tokens: z.object({ input: z.number().int().nonnegative(), output: z.number().int().nonnegative() }).nullable() }) }) });
const commandSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("start"), storageConsent: z.literal(true) }),
  z.object({ action: z.literal("translate"), revision: z.number().int(), transmissionConsent: z.literal(true) }),
  z.object({ action: z.literal("edit"), revision: z.number().int(), slot: clipIdSchema, text: z.string().max(5000) }),
  z.object({ action: z.literal("approve-script"), revision: z.number().int(), slot: clipIdSchema, version: z.number().int(), uncertaintiesReviewed: z.literal(true), imageMatches: z.boolean().optional() }),
  z.object({ action: z.literal("approve-clip"), revision: z.number().int(), slot: clipIdSchema, clipId: z.uuid(), listenedAndMatchesScript: z.literal(true), adultOwnVoice: z.literal(true) }),
  z.object({ action: z.literal("delete-clip"), revision: z.number().int(), slot: clipIdSchema }),
  z.object({ action: z.literal("freeze"), revision: z.number().int(), everyPageAndClipConfirmed: z.literal(true), adultOwnVoice: z.literal(true), redistributionConsent: z.literal(true), includeCorrections: z.boolean() }),
  z.object({ action: z.literal("delete"), revision: z.number().int() }),
]);

export class SpeechWorkspace {
  constructor(private db: DatabaseSync, private session: string, private config: Config, private provider: StoryProvider) {}
  read(): SpeechProject | null { const row = this.db.prepare("SELECT payload FROM speech_projects WHERE session_id=?").get(this.session); return row ? speechProjectSchema.parse(JSON.parse(String(row.payload))) : null; }
  status() { const project = this.read(); return { project, freezeIssues: project ? speechFreezeIssues(project) : [] }; }
  clip(id: string): Uint8Array {
    z.uuid().parse(id); const row = this.db.prepare("SELECT bytes FROM speech_clips WHERE id=? AND session_id=?").get(id, this.session);
    if (!row) throw new AppError("NOT_FOUND", "Private recording not found.", 404);
    return new Uint8Array(row.bytes as Uint8Array);
  }
  checklist() { const project = this.read(); if (!project) throw new AppError("NOT_FOUND", "Start a review workspace first.", 404); return project.scripts.map(script => ({ filename: `${script.id}.wav`, language: script.language, covers: script.kind === "page" ? `Page ${script.page} narrative only` : script.kind, exactText: script.text, maxSeconds: script.maxSeconds, scriptVersion: script.version, status: script.status, readyToRecord: script.status === "approved" })); }
  async execute(raw: unknown) {
    const command = commandSchema.parse(raw);
    if (command.action === "start") {
      if (this.read()) throw new AppError("INVALID_INPUT", "A workspace exists; restore it to preserve corrections.");
      const project = initialSpeechProject(newMockDraft().story, randomUUID(), this.config.AI_PROVIDER);
      const seedPath = join(this.config.DATA_DIR, "m4-translation-draft.json");
      if (project.mode === "real" && existsSync(seedPath) && statSync(seedPath).size <= 150000) {
        const seed = translationSeedSchema.parse(JSON.parse(readFileSync(seedPath, "utf8")));
        if (seed.sourceDigest === narrativeDigest(project.story)) this.applyTranslation(project, seed.result);
      }
      this.db.prepare("INSERT INTO speech_projects VALUES (?, ?, 0)").run(this.session, JSON.stringify(project)); return this.status();
    }
    return this.mutate(command.revision, async project => {
      if (command.action === "delete") {
        this.db.prepare("DELETE FROM speech_clips WHERE session_id=?").run(this.session);
        this.db.prepare("DELETE FROM speech_projects WHERE session_id=?").run(this.session); return false;
      }
      if (command.action === "translate") {
        if (project.mode === "real" && !this.config.ENABLE_LIVE_AI) throw new AppError("API_UNAVAILABLE", "Live translation is disabled. Existing scripts and recordings remain editable.", 503);
        if (project.translated || project.translationAttempted) throw new AppError("APPROVAL_REQUIRED", "A translation attempt already exists. Preserve corrections and investigate uncertain usage; no retry was sent.");
        project.translationAttempted = true;
        this.db.prepare("UPDATE speech_projects SET payload=? WHERE session_id=?").run(JSON.stringify(project), this.session);
        const result = await this.provider.translate(project.story, "st"); this.applyTranslation(project, result);
      } else if (command.action === "edit") {
        const script = this.script(project, command.slot); if (script.text === command.text) return;
        project.corrections.push({ id: randomUUID(), at: new Date().toISOString(), slot: script.id, before: script.text, after: command.text });
        script.text = command.text; script.version++; script.status = "edited";
        if (script.source) script.source.editedByCreator = true;
        else script.source = { assetId: `creator-${randomUUID()}`, providerId: "creator", model: null, origin: "creator", editedByCreator: true };
        this.invalidateClip(project, script);
        if (script.kind === "page") {
          const page = project.story.pages[script.page! - 1];
          if (script.language === "en") {
            project.story.pages[script.page! - 1] = editNarrative(page, script.text);
            const translated = this.script(project, `st-page-0${script.page}`); translated.status = translated.text ? "edited" : "unreviewed"; translated.version++;
            if (!translated.flags.includes("English source changed: recheck this translation against the current English before approving.")) translated.flags.push("English source changed: recheck this translation against the current English before approving.");
            this.invalidateClip(project, translated);
          } else { page.translation = { text: script.text, status: "edited" }; page.assetSources.translation = script.source; }
        }
      } else if (command.action === "approve-script") {
        const script = this.script(project, command.slot);
        if (script.version !== command.version || !script.text.trim()) throw new AppError("APPROVAL_REQUIRED", "Review the current nonempty script before approving.");
        if (script.kind === "page") {
          const page = project.story.pages[script.page! - 1];
          if (script.language === "en") {
            if (!command.imageMatches) throw new AppError("APPROVAL_REQUIRED", "Confirm the existing image matches the reviewed English narrative.");
            page.approvals.text = project.mode === "real"; page.approvals.illustration = project.mode === "real";
            if (project.mode === "real") page.provenance = "ai-assisted";
          } else {
            if (this.script(project, `en-page-0${script.page}`).status !== "approved") throw new AppError("APPROVAL_REQUIRED", "Review the English source before approving its translation.");
            page.translation = { text: script.text, status: project.mode === "real" ? "approved" : "edited" };
          }
        }
        script.status = "approved";
        recordApprovedCreatorSelections(project);
      } else if (command.action === "approve-clip") {
        const script = this.script(project, command.slot);
        if (!script.clip || script.clip.id !== command.clipId || script.clip.scriptVersion !== script.version || script.status !== "approved") throw new AppError("APPROVAL_REQUIRED", "Record and review the clip against its current approved script.");
        script.clip.approved = true;
        if (script.kind === "page") {
          const page = project.story.pages[script.page! - 1]; page.narrationAssetIds[script.language] = `recording-${script.clip.id}`;
          page.assetSources.narration[script.language] = { assetId: `recording-${script.clip.id}`, providerId: "creator", model: null, origin: "creator", editedByCreator: false };
          page.approvals.audio = project.mode === "real" && ["en", "st"].every(language => this.script(project, `${language}-page-0${script.page}`).clip?.approved);
        }
      } else if (command.action === "delete-clip") {
        const script = this.script(project, command.slot); this.invalidateClip(project, script);
        this.db.prepare("DELETE FROM speech_clips WHERE session_id=? AND slot=?").run(this.session, script.id); script.clip = null; script.recordingHistory = [];
      } else if (command.action === "freeze") {
        const issues = speechFreezeIssues(project); if (issues.length) throw new AppError("APPROVAL_REQUIRED", "All current pages, scripts and 24 adult recordings require explicit in-app approval before freezing.");
        for (const script of project.scripts) if (createHash("sha256").update(this.clip(script.clip!.id)).digest("hex") !== script.clip!.sha256) throw new AppError("INVALID_INPUT", "Recording bytes changed; review again.");
        project.frozen = true; project.redistributionConsent = true; project.includeCorrections = command.includeCorrections;
      }
    }, command.action === "translate");
  }
  async upload(slot: string, revision: number, version: number, bytes: Uint8Array, adultOwnVoice: boolean, storageConsent: boolean) {
    if (!adultOwnVoice || !storageConsent) throw new AppError("CONSENT_REQUIRED", "Only your own consenting adult voice may be stored. No child voices.");
    return this.mutate(revision, project => {
      const script = this.script(project, clipIdSchema.parse(slot));
      if (script.status !== "approved" || script.version !== version) throw new AppError("APPROVAL_REQUIRED", "Approve the exact current script before recording/uploading.");
      let seconds: number;
      try { seconds = validateCaptureWav(bytes); } catch { throw new AppError("INVALID_INPUT", "Use normalized 16 kHz mono PCM WAV."); }
      if (seconds > script.maxSeconds || seconds < .2) throw new AppError("INVALID_INPUT", `This clip must be between 0.2 and ${script.maxSeconds} seconds.`);
      let nonSilent = false; const samples = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
      for (let offset = 44; offset + 1 < bytes.length; offset += 2) if (Math.abs(samples.getInt16(offset, true)) > 10) { nonSilent = true; break; }
      if (!nonSilent) throw new AppError("INVALID_INPUT", "The recording appears silent. Record your own adult voice; never use a fixture tone.");
      const id = randomUUID();
      if (script.clip) script.recordingHistory.push({ assetId: `recording-${script.clip.id}`, providerId: "creator", model: null, origin: "creator", editedByCreator: false });
      this.invalidateClip(project, script);
      this.db.prepare("DELETE FROM speech_clips WHERE session_id=? AND slot=?").run(this.session, script.id);
      this.db.prepare("INSERT INTO speech_clips VALUES (?, ?, ?, ?)").run(id, this.session, script.id, bytes);
      script.clip = { id, scriptVersion: version, sha256: createHash("sha256").update(bytes).digest("hex"), seconds, approved: false, adultOwnVoice: true };
    });
  }
  fixtureExport() {
    const project = this.read();
    if (!project || !project.frozen || !project.redistributionConsent || speechFreezeIssues(project).length) throw new AppError("APPROVAL_REQUIRED", "Confirm all current pages and clips, then freeze with redistribution consent first.");
    recordApprovedCreatorSelections(project);
    const recordings = project.scripts.map(script => { const bytes = this.clip(script.clip!.id); if (createHash("sha256").update(bytes).digest("hex") !== script.clip!.sha256) throw new AppError("INVALID_INPUT", "Recording bytes changed since approval."); return { filename: `${script.id}.wav`, sha256: script.clip!.sha256, dataUrl: `data:audio/wav;base64,${Buffer.from(bytes).toString("base64")}` }; });
    return { format: "storispaza-reviewed-speech-v1", approvedInApp: true, adultCreatorOnly: true, redistributionConsent: true, sourceProvenanceNotice: "Mixed-source pack: preserve actual image/text/translation/creator-recording provenance; no paid-English-generation or synthetic speech claim.",
      story: project.story, scripts: project.scripts, corrections: project.includeCorrections ? project.corrections : [], translationUsage: project.usage,
      recordings };
  }
  private async mutate(revision: number, change: (project: SpeechProject) => void | boolean | Promise<void | boolean>, network = false) {
    if (!this.db.prepare("UPDATE speech_projects SET busy=1 WHERE session_id=? AND busy=0").run(this.session).changes) throw new AppError("RATE_LIMITED", "Workspace is busy or interrupted. Restore and investigate; no duplicate request was sent.", 429);
    let transaction = false;
    try {
      const project = this.read(); if (!project || project.revision !== revision || project.mode !== this.config.AI_PROVIDER) throw new AppError("INVALID_INPUT", "Restore the current workspace before changing it.", 409);
      if (!network) { this.db.exec("BEGIN IMMEDIATE"); transaction = true; }
      const before = JSON.stringify(project.scripts.map(script => [script.id, script.text, script.version, script.status, script.clip]));
      const keep = await change(project);
      if (keep !== false) {
        if (before !== JSON.stringify(project.scripts.map(script => [script.id, script.text, script.version, script.status, script.clip]))) { project.frozen = false; project.redistributionConsent = false; }
        project.revision++; this.db.prepare("UPDATE speech_projects SET payload=? WHERE session_id=?").run(JSON.stringify(speechProjectSchema.parse(project)), this.session);
      }
      if (transaction) { this.db.exec("COMMIT"); transaction = false; }
      return this.status();
    } catch (error) { if (transaction) this.db.exec("ROLLBACK"); throw error;
    } finally { this.db.prepare("UPDATE speech_projects SET busy=0 WHERE session_id=?").run(this.session); }
  }
  private script(project: SpeechProject, id: string) { const script = project.scripts.find(script => script.id === id); if (!script) throw new AppError("INVALID_INPUT", "Unknown recording slot."); return script; }
  private invalidateClip(project: SpeechProject, script: SpeechScript) {
    if (script.clip) script.clip.approved = false;
    project.frozen = false; project.redistributionConsent = false;
    if (script.kind === "page") { const page = project.story.pages[script.page! - 1]; page.approvals.audio = false; page.narrationAssetIds[script.language] = null; page.assetSources.narration[script.language] = null; }
  }
  private applyTranslation(project: SpeechProject, result: Pick<ProviderResult<string[]>, "data" | "assets" | "usage" | "reviewNotes" | "providerId" | "provenance"> | z.infer<typeof translationSeedSchema>["result"]) {
    if (result.data.length !== 6 || result.assets.length !== 6) throw new AppError("INVALID_PROVIDER_RESPONSE", "Six translated pages and sources are required.", 502);
    if (project.mode === "real" && (result.provenance !== "generated" || new Set(result.assets.map(source => source.assetId)).size !== 6 || result.assets.some(source => source.origin !== "generated" || source.providerId !== result.providerId))) throw new AppError("INVALID_PROVIDER_RESPONSE", "Translation provenance is invalid.", 502);
    for (let index = 0; index < 6; index++) {
      const script = this.script(project, `st-page-0${index + 1}`); script.text = result.data[index]; script.status = "machine-translated"; script.version++;
      if (script.source) script.history.push(script.source); script.source = result.assets[index];
      script.flags = [script.flags[0], ...(result.reviewNotes ?? []).filter(note => note.page === index + 1).map(note => `${note.term}: ${note.reason}`)];
      project.story.pages[index].translation = { text: script.text, status: "machine-translated" }; project.story.pages[index].assetSources.translation = script.source;
    }
    project.translated = true; project.translationAttempted = true; project.usage = result.usage;
  }
}

export function createSpeechHandlers(dependencies: { config?: () => Config; provider?: typeof createProvider } = {}) {
  return { async handle(request: Request) {
    let db: DatabaseSync | undefined; let bytes: Uint8Array | undefined;
    try {
      const settings = (dependencies.config ?? readConfig)();
      if (request.method === "POST") requireLocalOrigin(request);
      else if (!["127.0.0.1", "localhost", "[::1]"].includes(new URL(request.url).hostname) || request.headers.get("sec-fetch-site") === "cross-site") throw new AppError("INVALID_INPUT", "Local private access only.", 403);
      db = openDatabase(settings.DATA_DIR); const session = sessionId(request, db);
      if (!session) throw new AppError("CONSENT_REQUIRED", "Open a local review session first.", 403);
      if (settings.AI_PROVIDER === "real") accountForAccessChecks(db);
      const provider = (dependencies.provider ?? createProvider)(settings, settings.AI_PROVIDER === "real" ? adapter => createDollarGuard(db!, session, adapter, { sessionUsd: settings.SESSION_BUDGET_USD, developmentUsd: settings.DEVELOPMENT_BUDGET_USD, requestsPerMinute: settings.AI_REQUESTS_PER_MINUTE }, settings.IMAGE_ATTEMPT_LIMIT) : undefined);
      const workspace = new SpeechWorkspace(db, session, settings, provider); const url = new URL(request.url);
      if (request.method === "GET") {
        if (url.searchParams.has("clip")) return new Response(workspace.clip(url.searchParams.get("clip")!).slice().buffer as ArrayBuffer, { headers: { "Content-Type": "audio/wav", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", "Cross-Origin-Resource-Policy": "same-origin" } });
        if (url.searchParams.has("checklist")) return Response.json(workspace.checklist(), { headers: { "Cache-Control": "no-store" } });
        if (url.searchParams.has("corrections")) return Response.json(workspace.read()?.corrections ?? [], { headers: { "Cache-Control": "no-store" } });
        if (url.searchParams.has("fixture")) return Response.json(workspace.fixtureExport(), { headers: { "Cache-Control": "no-store" } });
        return Response.json(workspace.status(), { headers: { "Cache-Control": "no-store" } });
      }
      if (url.searchParams.has("slot")) {
        if (request.headers.get("x-adult-own-voice") !== "true" || request.headers.get("x-storage-consent") !== "true") throw new AppError("CONSENT_REQUIRED", "Confirm your own adult voice and local storage before upload.");
        if (request.headers.get("content-type") !== "audio/wav") throw new AppError("INVALID_INPUT", "Use normalized WAV.");
        bytes = await readBoundedBody(request, MAX_AUDIO_BYTES);
        return Response.json(await workspace.upload(url.searchParams.get("slot")!, z.coerce.number().int().nonnegative().parse(url.searchParams.get("revision")), z.coerce.number().int().nonnegative().parse(url.searchParams.get("version")), bytes, request.headers.get("x-adult-own-voice") === "true", request.headers.get("x-storage-consent") === "true"), { headers: { "Cache-Control": "no-store" } });
      }
      if (request.headers.get("content-type") !== "application/json") throw new AppError("INVALID_INPUT", "Use JSON.");
      bytes = await readBoundedBody(request, 50000); let raw: unknown;
      try { raw = JSON.parse(new TextDecoder().decode(bytes)); } catch { throw new AppError("INVALID_INPUT", "Invalid JSON."); }
      return Response.json(await workspace.execute(raw), { headers: { "Cache-Control": "no-store" } });
    } catch (error) { return errorResponse(error); } finally { bytes?.fill(0); db?.close(); }
  } };
}
