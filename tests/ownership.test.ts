import { createHash, randomUUID } from "node:crypto";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, expect, it } from "vitest";
import type { DatabaseSync } from "node:sqlite";
import { newMockDraft } from "@/domain/mock-journey";
import { initialSpeechProject } from "@/domain/speech";
import { ownershipSchema } from "@/domain/ownership";
import { publicationIssues } from "@/domain/publication";
import { encodeCaptureWav } from "@/domain/capture";
import { createOwnershipHandler } from "@/server/ownership-service";
import { readConfig } from "@/server/config";
import { openDatabase } from "@/server/storage";
import { SpeechWorkspace } from "@/server/speech-service";
import { createProvider } from "@/server/providers";

let directory: string; let db: DatabaseSync;
beforeEach(() => { directory = mkdtempSync(join(tmpdir(), "storispaza-own-")); db = openDatabase(directory); });
afterEach(() => { db.close(); rmSync(directory, { recursive: true, force: true }); });
function setup() {
  const session = randomUUID(); const project = initialSpeechProject(newMockDraft().story, randomUUID(), "real");
  // Synthetic approval state only in a temporary test DB; never review evidence or fixture approval.
  project.story.title = '<script>alert("test")</script>'; project.corrections.push({ id: randomUUID(), at: "test", slot: "en-page-01", before: "PRIVATE CORRECTION", after: "PRIVATE CORRECTION" });
  for (const page of project.story.pages) {
    page.provenance = "ai-assisted"; page.approvals.text = true; page.approvals.illustration = true;
    page.translation = { text: `TEST ONLY translation ${page.number}`, status: "approved" };
    for (const language of ["en", "st"]) { const script = project.scripts.find(value => value.id === `${language}-page-0${page.number}`)!; script.text = language === "en" ? page.narrative : page.translation.text; script.status = "approved"; }
  }
  const save = () => db.prepare("INSERT OR REPLACE INTO speech_projects VALUES (?,?,0)").run(session, JSON.stringify(project)); save();
  db.prepare("INSERT INTO ai_sessions VALUES (?,?)").run(session, Date.now() + 60000);
  const handle = createOwnershipHandler(() => readConfig({ AI_PROVIDER: "real", DATA_DIR: directory }));
  const request = (body: object, headers = {}) => new Request("http://127.0.0.1:3000/api/ownership", { method: "POST", headers: { origin: "http://127.0.0.1:3000", cookie: `storispaza-session=${session}`, "content-type": "application/json", ...headers }, body: JSON.stringify(body) });
  const ownership = ownershipSchema.parse({ creator: "TEST CREATOR", assumptionsConfirmed: true });
  const choices = () => handle(request({ action: "settings", revision: project.revision, ownership }));
  const exportRequest = (extra = {}) => request({ action: "export", revision: 1, format: "json", finalConfirmed: true, includeNarration: false, voiceExportConsent: false, ...extra });
  return { session, project, save, handle, request, ownership, choices, exportRequest };
}
it("defaults to private and blocks incomplete/mock or unconfirmed publication", async () => {
  const s = setup(); const result = await (await s.handle(s.request({ action: "status" }))).json();
  expect(result.ownership.visibility).toBe("private"); expect(result.ownership.sharingConsent).toBe(false); expect(result.issues).toContain("Confirm cultural assumptions.");
  expect((await s.handle(s.exportRequest({ revision: 0 }))).status).toBe(400);
  await s.choices(); s.project.revision = 1; s.project.story.pages[0].approvals.text = false; s.save();
  expect((await s.handle(s.exportRequest())).status).toBe(400);
  s.project.story.pages[0].approvals.text = true; s.project.mode = "mock";
  expect(publicationIssues(s.project, s.ownership)).toContain("Mock rehearsals cannot become approved publications.");
  expect((await s.handle(s.exportRequest({ finalConfirmed: false }))).status).toBe(400);
});
it("exports approved text-only JSON plus a standalone escaped offline HTML with provenance", async () => {
  const s = setup(); expect((await s.choices()).status).toBe(200);
  const response = await s.handle(s.exportRequest()); expect(response.status).toBe(200); expect(response.headers.get("cache-control")).toBe("no-store");
  const bundle = await response.json(); expect(bundle.pages).toHaveLength(6); expect(bundle.pages[0].image).toMatch(/^data:image\/webp/); expect(bundle.pages[0].narration).toEqual({ en: null, st: null });
  expect(bundle.pages[0].provenance.sources.text).toEqual(s.project.story.pages[0].assetSources.text);
  expect(JSON.stringify(bundle)).not.toMatch(/PRIVATE CORRECTION|session_id|sha256|data:audio/);
  const html = await (await s.handle(s.exportRequest({ format: "html" }))).text();
  expect(html).toContain("&lt;script&gt;"); expect(html).not.toContain("<script>"); expect(html).toContain("default-src 'none'"); expect(html).not.toMatch(/src=["']https?:|\/api\//); expect(html).toContain('lang="st"'); expect(html).toContain("Text-only");
  mkdirSync(".tools", { recursive: true }); writeFileSync(".tools/m6-test-reader.html", html);
  expect(s.project.frozen).toBe(false); expect(db.prepare("SELECT COUNT(*) AS n FROM ai_operations").get()!.n).toBe(0);
});
it("rejects stale final confirmations, script mismatches, missing images and unconsented sharing", async () => {
  const s = setup(); await s.choices();
  expect((await s.handle(s.exportRequest({ revision: 0 }))).status).toBe(409);
  s.ownership.visibility = "shared";
  expect((await s.handle(s.request({ action: "settings", revision: 1, ownership: s.ownership }))).status).toBe(200);
  expect((await s.handle(s.exportRequest({ revision: 2 }))).status).toBe(400);
  s.project.scripts[0].text = "CHANGED"; expect(publicationIssues(s.project, { ...s.ownership, sharingConsent: true })).toContain("Page 1: review the current en script in StoriSpeak.");
  s.project.story.pages[0].illustrationAssetId = "missing"; expect(publicationIssues(s.project, s.ownership)).toContain("Page 1: exportable reviewed image is missing.");
});
it("requires separate narration consent, checks bytes and deletes recordings without deleting text", async () => {
  const s = setup(); const bytes = encodeCaptureWav(Float32Array.from({ length: 16000 }, (_, i) => Math.sin(i / 9) * .1), 16000);
  const script = s.project.scripts[0]; const id = randomUUID(); script.clip = { id, scriptVersion: script.version, sha256: createHash("sha256").update(bytes).digest("hex"), seconds: 1, approved: true, adultOwnVoice: true }; s.save();
  db.prepare("INSERT INTO speech_clips VALUES (?,?,?,?)").run(id, s.session, script.id, bytes); await s.choices();
  expect((await s.handle(s.exportRequest({ includeNarration: true }))).status).toBe(400);
  const exported = await (await s.handle(s.exportRequest({ includeNarration: true, voiceExportConsent: true }))).json(); expect(exported.pages[0].narration.en).toMatch(/^data:audio\/wav/); expect(exported.pages[0].narration.st).toBeNull();
  db.prepare("UPDATE speech_clips SET bytes=? WHERE id=?").run(new Uint8Array([1, 2]), id);
  expect((await s.handle(s.exportRequest({ includeNarration: true, voiceExportConsent: true }))).status).toBe(400);
  const deleted = await (await s.handle(s.request({ action: "delete-recordings", revision: 1, confirmed: true }))).json(); expect(deleted.recordingCount).toBe(0);
  expect(db.prepare("SELECT COUNT(*) AS n FROM speech_clips").get()!.n).toBe(0);
  const stored = JSON.parse(String(db.prepare("SELECT payload FROM speech_projects WHERE session_id=?").get(s.session)!.payload));
  expect(stored.redistributionConsent).toBe(false); expect(stored.scripts.every((value: {clip: unknown}) => value.clip === null)).toBe(true); expect(stored.story.pages[0].narrative).toBe(s.project.story.pages[0].narrative);
  expect((await s.handle(s.exportRequest())).status).toBe(409);
  expect((await s.handle(s.exportRequest({ revision: 2 }))).status).toBe(200);
});
it("denies cross-origin, foreign sessions, busy/mode-mismatched workspaces and oversized bodies", async () => {
  const s = setup();
  for (const headers of [{ origin: "https://evil.example" }, { host: "evil.example" }, { cookie: "" }, { "sec-fetch-site": "cross-site" }]) expect((await s.handle(s.request({ action: "status" }, headers))).status).toBe(403);
  db.prepare("UPDATE speech_projects SET busy=1 WHERE session_id=?").run(s.session); expect((await s.handle(s.request({ action: "status" }))).status).toBe(409);
  s.project.mode = "mock"; s.save(); expect((await s.handle(s.request({ action: "status" }))).status).toBe(409);
  expect((await s.handle(s.request({ action: "status", extra: "x".repeat(9000) }))).status).toBe(413);
});
it("speech edits invalidate an export snapshot and workspace deletion removes saved ownership", async () => {
  const s = setup(); await s.choices();
  const workspace = new SpeechWorkspace(db, s.session, readConfig({ AI_PROVIDER: "real", DATA_DIR: directory }), createProvider(readConfig({ AI_PROVIDER: "mock" })));
  await workspace.execute({ action: "edit", revision: 1, slot: "en-page-01", text: "TEST ONLY revised narrative" });
  expect((await s.handle(s.exportRequest())).status).toBe(409);
  expect((await s.handle(s.exportRequest({ revision: 2 }))).status).toBe(400);
  await workspace.execute({ action: "delete", revision: 2 });
  expect(db.prepare("SELECT COUNT(*) AS n FROM ownership_settings").get()!.n).toBe(0);
  expect((await s.handle(s.request({ action: "status" }))).status).toBe(404);
});
it("shared files need consent and a replacement project always starts private", async () => {
  const s = setup(); s.ownership.visibility = "shared"; s.ownership.sharingConsent = true;
  await s.choices(); const shared = await (await s.handle(s.exportRequest())).json(); expect(shared.visibility).toBe("shared"); expect(shared.edition.sharingConsent).toBe(true);
  s.project.id = randomUUID(); s.project.revision = 1; s.save();
  const status = await (await s.handle(s.request({ action: "status" }))).json(); expect(status.ownership.visibility).toBe("private"); expect(status.ownership.sharingConsent).toBe(false); expect(status.ownership.assumptionsConfirmed).toBe(false);
});
