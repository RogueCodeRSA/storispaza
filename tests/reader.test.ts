import { randomUUID, createHash } from "node:crypto";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, expect, it } from "vitest";
import type { DatabaseSync } from "node:sqlite";
import { newMockDraft } from "@/domain/mock-journey";
import { initialSpeechProject } from "@/domain/speech";
import { currentReaderClip, readerBook } from "@/domain/reader";
import { encodeCaptureWav } from "@/domain/capture";
import { createReaderHandler, readerMedia } from "@/server/reader-service";
import { readConfig } from "@/server/config";
import { openDatabase } from "@/server/storage";
import { reviewedPageImage } from "@/domain/image-pack";

let directory: string; let db: DatabaseSync;
beforeEach(() => { directory = mkdtempSync(join(tmpdir(), "storispaza-reader-")); db = openDatabase(directory); });
afterEach(() => { db.close(); rmSync(directory, { recursive: true, force: true }); });
function setup() {
  const session = randomUUID(); const project = initialSpeechProject(newMockDraft().story, randomUUID(), "real");
  const bytes = encodeCaptureWav(Float32Array.from({ length: 16000 }, (_, i) => Math.sin(i / 9) * .1), 16000);
  const page = project.scripts.find(value => value.id === "en-page-01")!;
  page.status = "approved"; page.clip = { id: randomUUID(), scriptVersion: page.version, sha256: createHash("sha256").update(bytes).digest("hex"), seconds: 1, approved: true, adultOwnVoice: true };
  const save = () => db.prepare("INSERT OR REPLACE INTO speech_projects VALUES (?, ?, 0)").run(session, JSON.stringify(project));
  save(); db.prepare("INSERT INTO ai_sessions VALUES (?, ?)").run(session, Date.now() + 60000);
  db.prepare("INSERT INTO speech_clips VALUES (?, ?, ?, ?)").run(page.clip.id, session, page.id, bytes);
  const handle = createReaderHandler(() => readConfig({ AI_PROVIDER: "real", DATA_DIR: directory }), null);
  const request = (query = "", headers = {}) => new Request(`http://127.0.0.1:3000/api/reader${query}`, { headers: { cookie: `storispaza-session=${session}`, ...headers } });
  return { session, project, page, bytes, save, handle, request };
}
it("projects current review independently from missing audio and hides unapproved vocabulary", () => {
  const { project, page } = setup(); const before = JSON.stringify(project);
  const book = readerBook(project);
  expect(book.pages[0].text.en.reviewed).toBe(true); expect(book.pages[0].text.en.audio?.id).toBe(page.clip!.id);
  expect(book.pages[1].text.en.audio).toBeNull(); expect(book.vocabulary.en.every(word => word.text === null && word.audio === null)).toBe(true);
  expect(book.interaction.st.opening.text).toBe(""); expect(book.interaction.st.opening.reviewed).toBe(false);
  expect(JSON.stringify(book)).not.toContain("corrections"); expect(JSON.stringify(project)).toBe(before);
  const word = project.scripts.find(value => value.id === "en-word-01")!; word.status = "approved";
  expect(readerBook(project).vocabulary.en[0]).toMatchObject({ text: "light", audio: null });
  page.version++; expect(currentReaderClip(page)).toBe(false); expect(readerBook(project).pages[0].text.en.audio).toBeNull();
});
it("reads a private project without altering reviews, consent, corrections or spend", async () => {
  const { session, handle, request } = setup();
  const before = db.prepare("SELECT payload FROM speech_projects WHERE session_id=?").get(session)!.payload;
  const result = await handle(request()); expect(result.status).toBe(200); expect(result.headers.get("cache-control")).toBe("no-store");
  const { book } = await result.json(); expect(book.clipsApproved).toBe(1); expect(book.scriptsApproved).toBe(1);
  expect(db.prepare("SELECT payload FROM speech_projects WHERE session_id=?").get(session)!.payload).toBe(before);
  expect(db.prepare("SELECT COUNT(*) AS n FROM ai_operations").get()!.n).toBe(0);
  expect((await (await handle(new Request("http://127.0.0.1:3000/api/reader"))).json()).book.mode).toBe("mock");
});
it("serves only the current approved owner clip, verifies hashes and supports range resume", async () => {
  const { handle, request, page, bytes, project, save } = setup();
  const response = await handle(request(`?clip=${page.clip!.id}`, { range: "bytes=44-63" }));
  expect(response.status).toBe(206); expect(response.headers.get("content-range")).toBe(`bytes 44-63/${bytes.length}`); expect(new Uint8Array(await response.arrayBuffer())).toEqual(bytes.slice(44,64));
  expect((await handle(new Request(`http://127.0.0.1:3000/api/reader?clip=${page.clip!.id}`))).status).toBe(404);
  page.version++; save(); expect((await handle(request(`?clip=${page.clip!.id}`))).status).toBe(404);
  page.version--; page.clip!.sha256 = "0".repeat(64); save(); expect((await handle(request(`?clip=${page.clip!.id}`))).status).toBe(400);
  expect(project.redistributionConsent).toBe(false);
});
it("bounds byte ranges and implements suffix/open ranges without returning unrelated bytes", async () => {
  const bytes = new Uint8Array([1,2,3,4,5]);
  expect(new Uint8Array(await readerMedia(bytes,"audio/wav","bytes=-2").arrayBuffer())).toEqual(new Uint8Array([4,5]));
  expect(new Uint8Array(await readerMedia(bytes,"audio/wav","bytes=3-").arrayBuffer())).toEqual(new Uint8Array([4,5]));
  for (const range of ["bytes=9-10","bytes=3-1","bytes=0-1,3-4","bytes=-0","bytes=-","bytes=0-999999999999999999999999"]) expect(readerMedia(bytes,"audio/wav",range).status).toBe(416);
});
it("mock defaults are clearly provisional, use non-speech signals and never create storage", async () => {
  const missingDirectory = join(directory,"not-created"); const handle = createReaderHandler(() => readConfig({ AI_PROVIDER:"mock", DATA_DIR:missingDirectory }), null);
  const response = await handle(new Request("http://localhost:3000/api/reader")); const { book } = await response.json();
  expect(book.mode).toBe("mock"); expect(book.pages[0].text.en.reviewed).toBe(false); expect(book.pages[0].text.en.audio.provisional).toBe(true);
  expect(book.interaction.st.opening.text).toBe(""); expect(book.vocabulary.en.every((word: {text: string | null}) => word.text === null)).toBe(true);
  const tone = await handle(new Request("http://localhost:3000/api/reader?demoTone=1", { headers:{range:"bytes=0-43"} })); expect(tone.status).toBe(206); expect((await tone.arrayBuffer()).byteLength).toBe(44);
  expect(existsSync(missingDirectory)).toBe(false);
});
it("rejects hostile origins/hosts and cannot serve a mock signal as real narration", async () => {
  const { handle, request } = setup();
  expect((await handle(request("", { "sec-fetch-site":"cross-site" }))).status).toBe(403);
  expect((await handle(request("", { host:"evil.example" }))).status).toBe(403);
  expect((await handle(request("?demoTone=1"))).status).toBe(404);
  expect((await handle(request("?image=1"))).headers.get("content-type")).toBe("image/webp");
});
it("shows all six approved sources for a legacy preview without modifying current approvals", async () => {
  const s = setup(); s.project.story.pages[0].illustrationAssetId = "mock-image-1-r3"; s.save();
  const before = db.prepare("SELECT payload FROM speech_projects WHERE session_id=?").get(s.session)!.payload;
  const book = (await (await s.handle(s.request())).json()).book;
  expect(book.pages[0].imageReviewed).toBe(false);
  for (let page = 1; page <= 6; page++) {
    const response = await s.handle(s.request(`?image=${page}`)); expect(response.status).toBe(200);
    expect(Buffer.from(await response.arrayBuffer())).toEqual(Buffer.from(reviewedPageImage(page).dataUrl.split(",")[1], "base64"));
  }
  expect(db.prepare("SELECT payload FROM speech_projects WHERE session_id=?").get(s.session)!.payload).toBe(before);
});
it("lets a real-mode guest read the disclosed text-only fixed story without creating storage or exposing an owned clip", async () => {
  const missing = join(directory,"guest-reader"); const handle = createReaderHandler(() => readConfig({ AI_PROVIDER:"real", DATA_DIR:missing }), null);
  const response = await handle(new Request("http://localhost:3000/api/reader")); const {book} = await response.json();
  expect(book.mode).toBe("mock"); expect(book.pages).toHaveLength(6); expect(book.pages.every((page: {text:{en:{reviewed:boolean;audio:unknown}}}) => !page.text.en.reviewed && page.text.en.audio === null)).toBe(true);
  expect((await handle(new Request("http://localhost:3000/api/reader?demoTone=1"))).status).toBe(404);
  expect(existsSync(missing)).toBe(false);
});
