import "server-only";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { DatabaseSync } from "node:sqlite";
import { recordApprovedCreatorSelections, speechFreezeIssues, speechProjectSchema } from "@/domain/speech";
import { validateCaptureWav } from "@/domain/capture";
import { readerBook } from "@/domain/reader";
import { AppError } from "./errors";

// Local maintenance only, never a browser route. Reads the actual in-app state;
// an environment flag cannot fabricate page/clip approvals or consent.
export function writeReviewedSpeechFixtures(db: DatabaseSync, session: string, directory: string) {
  if (!db.prepare("UPDATE speech_projects SET busy=1 WHERE session_id=? AND busy=0").run(session).changes) throw new AppError("APPROVAL_REQUIRED", "Workspace is busy; no fixtures were written.");
  try {
  const row = db.prepare("SELECT payload FROM speech_projects WHERE session_id=? AND busy=1").get(session);
  if (!row) throw new AppError("APPROVAL_REQUIRED", "No settled review workspace exists.");
  const project = speechProjectSchema.parse(JSON.parse(String(row.payload)));
  if (!project.frozen || !project.redistributionConsent || speechFreezeIssues(project).length) throw new AppError("APPROVAL_REQUIRED", "Every current page/clip and redistribution consent must be explicitly confirmed in the app.");
  recordApprovedCreatorSelections(project);
  if (existsSync(join(directory, "manifest.json"))) throw new AppError("APPROVAL_REQUIRED", "A frozen pack already exists. Review replacement separately; no files were overwritten.");
  const recordings = project.scripts.map(script => {
    const row = db.prepare("SELECT bytes FROM speech_clips WHERE id=? AND session_id=? AND slot=?").get(script.clip!.id, session, script.id);
    if (!row) throw new AppError("INVALID_INPUT", "A reviewed recording is missing.");
    const bytes = new Uint8Array(row.bytes as Uint8Array); const sha256 = createHash("sha256").update(bytes).digest("hex");
    if (sha256 !== script.clip!.sha256 || validateCaptureWav(bytes) > script.maxSeconds) throw new AppError("INVALID_INPUT", "A recording changed since review.");
    return { filename: `${script.id}.wav`, bytes, sha256, scriptVersion: script.version, adultOwnVoice: true, creatorApproved: true };
  });
  mkdirSync(directory, { recursive: true });
  for (const recording of recordings) writeFileSync(join(directory, recording.filename), recording.bytes, { flag: "wx" });
  const manifest = { format: "storispaza-reviewed-speech-v1", approvalMethod: "explicit-in-app", frozenAt: new Date().toISOString(), adultCreatorOnly: true, redistributionConsent: true,
    story: project.story, scripts: project.scripts, recordings: recordings.map(({ bytes, ...metadata }) => ({ ...metadata, byteLength: bytes.length })),
    translationUsage: project.usage, invoiceVerified: false, corrections: [],
    provenanceNotice: "Preserve mixed actual sources: existing Codex-authored English, real-generated images/translations, creator edits and consenting adult recordings. No synthetic Sesotho speech." };
  writeFileSync(join(directory, "manifest.json"), JSON.stringify(manifest, null, 2), { flag: "wx" });
  const book = readerBook(project); book.fixtureReplay = true;
  const tracks = [...book.pages.flatMap(page => [page.text.en, page.text.st]), ...Object.values(book.interaction).flatMap(Object.values), ...Object.values(book.vocabulary).flat()];
  for (const value of tracks) if (value.audio) {
    const script = project.scripts.find(script => script.clip?.id === value.audio!.id)!;
    value.audio.url = `/api/reader?fixtureClip=${script.id}`;
  }
  writeFileSync(join(directory, "reader.json"), JSON.stringify(book), { flag: "wx" });
  return { clips: recordings.length, bytes: recordings.reduce((sum, recording) => sum + recording.bytes.length, 0) };
  } finally { db.prepare("UPDATE speech_projects SET busy=0 WHERE session_id=?").run(session); }
}
