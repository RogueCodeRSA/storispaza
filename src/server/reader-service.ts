import "server-only";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { reviewedSpeechPack } from "../../scripts/reviewed-speech.mjs";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { z } from "zod";
import { encodeCaptureWav } from "@/domain/capture";
import { reviewedFixtureImage, reviewedPageImage } from "@/domain/image-pack";
import { newMockDraft } from "@/domain/mock-journey";
import { currentReaderClip, readerBook } from "@/domain/reader";
import { initialSpeechProject, speechProjectSchema } from "@/domain/speech";
import { ownershipSchema } from "@/domain/ownership";
import { sessionId } from "./capture-service";
import { readConfig } from "./config";
import { AppError, errorResponse } from "./errors";

const privateHeaders = { "Cache-Control": "no-store", "Vary": "Cookie", "X-Content-Type-Options": "nosniff", "Cross-Origin-Resource-Policy": "same-origin" };
// Byte ranges let browsers seek/resume without downloading the full WAV again.
export function readerMedia(bytes: Uint8Array, mime: string, range: string | null): Response {
  const headers = { ...privateHeaders, "Content-Type": mime, "Accept-Ranges": "bytes" };
  let start = 0; let end = bytes.length - 1; let partial = false;
  if (range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range);
    if (!match || (!match[1] && !match[2]) || [match[1], match[2]].some(value => value && !Number.isSafeInteger(Number(value)))) return new Response(null, { status: 416, headers: { ...headers, "Content-Range": `bytes */${bytes.length}` } });
    start = match[1] ? Number(match[1]) : Math.max(0, bytes.length - Number(match[2]));
    end = match[1] && match[2] ? Math.min(Number(match[2]), end) : end;
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start > end || start >= bytes.length) return new Response(null, { status: 416, headers: { ...headers, "Content-Range": `bytes */${bytes.length}` } });
    partial = true;
  }
  // Buffer.slice is a view; copy to an exact-sized ArrayBuffer so range replies
  // cannot leak the rest of a recording or unrelated pooled buffer bytes.
  const body = new Uint8Array(bytes.subarray(start, end + 1));
  return new Response(body.buffer as ArrayBuffer, { status: partial ? 206 : 200, headers: { ...headers, "Content-Length": String(body.length), ...(partial ? { "Content-Range": `bytes ${start}-${end}/${bytes.length}` } : {}) } });
}
export function createReaderHandler(config: typeof readConfig = readConfig, fixtureDirectory: string | null = "fixtures/approved-speech") {
  return async (request: Request) => {
    let db: DatabaseSync | undefined;
    try {
      const url = new URL(request.url); const host = new URL(`${url.protocol}//${request.headers.get("host") ?? url.host}`);
      if (request.method !== "GET" || ![url.hostname, host.hostname].every(value => ["localhost", "127.0.0.1", "[::1]"].includes(value)) || request.headers.get("sec-fetch-site") === "cross-site") throw new AppError("INVALID_INPUT", "Local private reader only.", 403);
      const settings = config(); const path = join(settings.DATA_DIR, "storispaza.sqlite");
      if (existsSync(path)) db = new DatabaseSync(path, { readOnly: true });
      const session = db ? sessionId(request, db) : null;
      const hasTable = db?.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='speech_projects'").get();
      const row = session && hasTable ? db!.prepare("SELECT payload FROM speech_projects WHERE session_id=?").get(session) : null;
      let project = row ? speechProjectSchema.parse(JSON.parse(String(row.payload))) : null;
      if (project && project.mode !== settings.AI_PROVIDER) throw new AppError("INVALID_INPUT", "Reader mode differs from this workspace; restore in the matching app mode.", 409);
      const demo = !project;
      const demoSignal = demo && settings.AI_PROVIDER === "mock";
      const needsFixture = url.searchParams.has("fixtureClip") || demo && !["demoTone", "clip", "image"].some(key => url.searchParams.has(key));
      const pack = needsFixture && fixtureDirectory && existsSync(join(fixtureDirectory, "manifest.json")) ? reviewedSpeechPack(path => readFileSync(join(fixtureDirectory, path.replace("fixtures/approved-speech/", "")))) : null;
      if (url.searchParams.has("fixtureClip")) {
        const id = url.searchParams.get("fixtureClip");
        const bytes = pack?.files.get(`fixtures/approved-speech/${id}.wav`);
        if (!bytes) throw new AppError("NOT_FOUND", "No approved fixture recording.", 404);
        return readerMedia(bytes, "audio/wav", request.headers.get("range"));
      }
      if (demo && pack && !["demoTone", "clip", "image"].some(key => url.searchParams.has(key))) return Response.json({ book: pack.book }, { headers: privateHeaders });
      if (demo) project = initialSpeechProject(newMockDraft().story, "00000000-0000-4000-8000-000000000005", "mock");
      if (url.searchParams.has("demoTone")) {
        if (!demoSignal) throw new AppError("NOT_FOUND", "No demo signal is available in this private workspace.", 404);
        const signal = encodeCaptureWav(Float32Array.from({ length: 16000 * 6 }, (_, i) => Math.sin(i * 2 * Math.PI * 330 / 16000) * .035), 16000);
        return readerMedia(signal, "audio/wav", request.headers.get("range"));
      }
      if (url.searchParams.has("clip")) {
        const id = z.uuid().parse(url.searchParams.get("clip"));
        const script = project?.scripts.find(value => value.clip?.id === id && currentReaderClip(value));
        const recording = script && db && session ? db.prepare("SELECT bytes FROM speech_clips WHERE id=? AND session_id=? AND slot=?").get(id, session, script.id) : null;
        if (!recording) throw new AppError("NOT_FOUND", "No current reviewed recording; continue with text.", 404);
        const bytes = new Uint8Array(recording.bytes as Uint8Array);
        if (createHash("sha256").update(bytes).digest("hex") !== script!.clip!.sha256) throw new AppError("INVALID_INPUT", "Recording changed since review; use text and review it again.");
        return readerMedia(bytes, "audio/wav", request.headers.get("range"));
      }
      if (url.searchParams.has("image")) {
        const page = z.coerce.number().int().min(1).max(6).parse(url.searchParams.get("image"));
        // The private demo reader can show the approved source while its current
        // association awaits review. This read-only display never upgrades IDs/approvals.
        const image = project ? reviewedFixtureImage(project.story.pages[page - 1].illustrationAssetId) ?? reviewedPageImage(page).dataUrl : null;
        if (!image) throw new AppError("NOT_FOUND", "No illustration is available for this page.", 404);
        return readerMedia(new Uint8Array(Buffer.from(image.split(",")[1], "base64")), "image/webp", null);
      }
      const book = project ? readerBook(project) : null;
      const hasOwnership = db?.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='ownership_settings'").get();
      const attribution = hasOwnership && session && project ? db!.prepare("SELECT payload FROM ownership_settings WHERE session_id=? AND project_id=?").get(session, project.id) : null;
      if (book && attribution) book.creator = ownershipSchema.parse(JSON.parse(String(attribution.payload))).creator;
      if (book && project) book.pages.forEach((page, index) => { if (!reviewedFixtureImage(project.story.pages[index].illustrationAssetId)) page.imageReviewed = false; });
      if (book && demoSignal) for (const page of book.pages) for (const language of ["en", "st"] as const) page.text[language].audio = { id: `demo-${language}-${page.number}`, url: "/api/reader?demoTone=1", seconds: 6, provisional: true };
      return Response.json({ book }, { headers: privateHeaders });
    } catch (error) { return errorResponse(error); } finally { db?.close(); }
  };
}
