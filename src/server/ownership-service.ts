import "server-only";
import { createHash } from "node:crypto";
import { z } from "zod";
import { speechProjectSchema, type SpeechProject } from "@/domain/speech";
import { ownershipSchema } from "@/domain/ownership";
import { publicationIssues } from "@/domain/publication";
import { currentReaderClip } from "@/domain/reader";
import { openDatabase } from "./storage";
import { readConfig } from "./config";
import { requireLocalOrigin, readBoundedBody, sessionId } from "./capture-service";
import { AppError, errorResponse } from "./errors";
import { publicationBundle, publicationHtml } from "./ownership-export";

const commandSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("status") }),
  z.object({ action: z.literal("settings"), revision: z.number().int(), ownership: ownershipSchema }),
  z.object({ action: z.literal("delete-recordings"), revision: z.number().int(), confirmed: z.literal(true) }),
  z.object({ action: z.literal("export"), revision: z.number().int(), format: z.enum(["json", "html"]), finalConfirmed: z.literal(true), includeNarration: z.boolean(), voiceExportConsent: z.boolean() }),
]);
const headers = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", "Cross-Origin-Resource-Policy": "same-origin" };
export function createOwnershipHandler(config = readConfig) {
  return async (request: Request) => {
    let db: ReturnType<typeof openDatabase> | undefined;
    let transaction = false;
    try {
      requireLocalOrigin(request);
      if (request.method !== "POST" || request.headers.get("content-type") !== "application/json") throw new AppError("INVALID_INPUT", "Use a JSON POST.");
      const bytes = await readBoundedBody(request, 8192);
      let command: z.infer<typeof commandSchema>;
      try { command = commandSchema.parse(JSON.parse(new TextDecoder().decode(bytes))); } finally { bytes.fill(0); }
      const settings = config(); db = openDatabase(settings.DATA_DIR);
      const session = sessionId(request, db);
      if (!session) throw new AppError("CONSENT_REQUIRED", "Open your private StoriSpeak session first.", 403);
      // A single write transaction serializes approval snapshots, export bytes and deletion against speech edits.
      db.exec("BEGIN IMMEDIATE"); transaction = true;
      const row = db.prepare("SELECT payload,busy FROM speech_projects WHERE session_id=?").get(session);
      if (!row) throw new AppError("NOT_FOUND", "Restore a StoriSpeak workspace first.", 404);
      if (row.busy) throw new AppError("RATE_LIMITED", "Workspace is busy. Try again after the current operation.", 409);
      const project = speechProjectSchema.parse(JSON.parse(String(row.payload)));
      if (project.mode !== settings.AI_PROVIDER) throw new AppError("INVALID_INPUT", "Restore in the matching app mode.", 409);
      db.exec("CREATE TABLE IF NOT EXISTS ownership_settings (session_id TEXT PRIMARY KEY, project_id TEXT NOT NULL, payload TEXT NOT NULL)");
      const saved = db.prepare("SELECT project_id,payload FROM ownership_settings WHERE session_id=?").get(session);
      let ownership = saved?.project_id === project.id ? ownershipSchema.parse(JSON.parse(String(saved.payload))) : ownershipSchema.parse({ creator: project.story.creator });
      if (command.action !== "status" && command.revision !== project.revision) throw new AppError("APPROVAL_REQUIRED", "Content changed. Refresh and review the current edition.", 409);
      if (command.action === "settings") {
        ownership = command.ownership;
        db.prepare("INSERT OR REPLACE INTO ownership_settings VALUES (?,?,?)").run(session, project.id, JSON.stringify(ownership));
        project.revision++; save(project);
      }
      if (command.action === "delete-recordings") {
        db.prepare("DELETE FROM speech_clips WHERE session_id=?").run(session);
        for (const script of project.scripts) { script.clip = null; script.recordingHistory = []; }
        for (const page of project.story.pages) { page.narrationAssetIds = { en: null, st: null }; page.assetSources.narration = { en: null, st: null }; page.approvals.audio = false; }
        project.frozen = false; project.redistributionConsent = false; project.revision++; save(project);
      }
      let response: Response;
      if (command.action === "export") {
        if (publicationIssues(project, ownership).length) throw new AppError("APPROVAL_REQUIRED", "Export blocked: review all current text, translations, images, cultural assumptions and sharing consent.");
        if (command.includeNarration && !command.voiceExportConsent) throw new AppError("CONSENT_REQUIRED", "Separate adult voice-export consent is required.");
        const audio: Record<string, string> = {};
        if (command.includeNarration) for (const script of project.scripts.filter(value => value.kind === "page" && currentReaderClip(value))) {
          const clip = db.prepare("SELECT bytes FROM speech_clips WHERE session_id=? AND id=? AND slot=?").get(session, script.clip!.id, script.id);
          if (!clip || createHash("sha256").update(clip.bytes as Uint8Array).digest("hex") !== script.clip!.sha256) throw new AppError("APPROVAL_REQUIRED", "Recording missing or changed. Review again or export text only.");
          audio[script.id] = `data:audio/wav;base64,${Buffer.from(clip.bytes as Uint8Array).toString("base64")}`;
        }
        const bundle = publicationBundle(project, ownership, audio);
        response = new Response(command.format === "json" ? JSON.stringify(bundle, null, 2) : publicationHtml(bundle), { headers: { ...headers, "Content-Type": command.format === "json" ? "application/json" : "text/html; charset=utf-8", "Content-Disposition": `attachment; filename="storispaza-story.${command.format}"` } });
      } else response = Response.json({ revision: project.revision, ownership, title: project.story.title, culturalContext: project.story.culturalContext, culturalAssumptions: project.story.culturalAssumptions, educationalObjective: project.story.educationalObjective, issues: publicationIssues(project, ownership), recordingCount: project.scripts.filter(value => value.clip).length,
        pages: project.story.pages.map(page => ({ number: page.number, title: page.title, narrative: page.narrative, translatedText: page.translation?.text ?? "", learningMoment: page.learningMoment, approvals: page.approvals, translation: page.translation?.status ?? "missing", provenance: page.assetSources })) }, { headers });
      db.exec("COMMIT"); transaction = false; return response;
      function save(value: SpeechProject) { db!.prepare("UPDATE speech_projects SET payload=? WHERE session_id=?").run(JSON.stringify(speechProjectSchema.parse(value)), session!); }
    } catch (error) { if (transaction) db?.exec("ROLLBACK"); const response = errorResponse(error); for (const [key, value] of Object.entries(headers)) response.headers.set(key, value); return response; }
    finally { db?.close(); }
  };
}
