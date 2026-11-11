import { randomUUID } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { DatabaseSync } from "node:sqlite";
import { SpeechWorkspace, createSpeechHandlers } from "@/server/speech-service";
import { openDatabase } from "@/server/storage";
import { readConfig } from "@/server/config";
import { createOpenAIAdapter } from "@/server/providers/adapters/openai.adapter";
import { protectProvider } from "@/server/providers/boundary";
import { createDollarGuard } from "@/server/allowance";
import { speechFreezeIssues } from "@/domain/speech";
import { encodeCaptureWav } from "@/domain/capture";
import { fakeTransport } from "./helpers/live-provider";
import { writeReviewedSpeechFixtures } from "@/server/speech-fixtures";
let directory: string; let db: DatabaseSync;
beforeEach(() => { directory = mkdtempSync(join(tmpdir(), "storispaza-speech-")); db = openDatabase(directory); });
afterEach(() => { db.close(); rmSync(directory, { recursive: true, force: true }); });
async function setup() {
  const session = randomUUID(); const config = readConfig({ DATA_DIR: directory, AI_PROVIDER: "real", AI_ADAPTER: "openai", ENABLE_LIVE_AI: "1" });
  const transport = fakeTransport(); const adapter = createOpenAIAdapter({ transport });
  const workspace = new SpeechWorkspace(db, session, config, protectProvider(adapter, createDollarGuard(db, session, adapter)));
  await workspace.execute({ action: "start", storageConsent: true });
  const command = (action: string, extra = {}) => workspace.execute({ action, revision: workspace.read()!.revision, ...extra });
  const script = (id: string) => workspace.read()!.scripts.find(script => script.id === id)!;
  const approve = (id: string) => command("approve-script", { slot: id, version: script(id).version, uncertaintiesReviewed: true, imageMatches: true });
  const wav = encodeCaptureWav(Float32Array.from({ length: 16000 }, (_, i) => Math.sin(i / 9) * .1), 16000);
  return { workspace, command, script, approve, wav, session, transport };
}
it("lists exactly 24 fixed slots, caps each clip and leaves all supplied phrases/Sesotho vocabulary blank", async () => {
  const { workspace } = await setup(); const list = workspace.checklist();
  expect(list.length).toBe(24); expect(new Set(list.map(item => item.filename)).size).toBe(24);
  expect(list.filter(item => item.language === "en" && item.covers.includes("Page")).every(item => item.maxSeconds === 45)).toBe(true);
  expect(list.filter(item => item.language === "st" && item.covers.includes("Page")).every(item => item.maxSeconds === 60)).toBe(true);
  expect(list.every(item => !item.readyToRecord)).toBe(true);
  expect(workspace.read()!.scripts.filter(script => ["opening", "response", "continuation"].includes(script.kind) || script.language === "st" && script.kind === "word").every(script => script.text === "")).toBe(true);
});
it("keeps generated translations unapproved, flags science vocabulary and requires current source approval", async () => {
  const { workspace, command, script, approve } = await setup(); await command("translate", { transmissionConsent: true });
  expect(script("st-page-01").status).toBe("machine-translated"); expect(script("st-page-01").flags.join(" ")).toContain("circuit");
  expect(workspace.read()!.story.pages.every(page => page.translation?.status !== "approved")).toBe(true);
  await expect(approve("st-page-01")).rejects.toMatchObject({ code: "APPROVAL_REQUIRED" });
  await approve("en-page-01"); await approve("st-page-01"); expect(script("st-page-01").status).toBe("approved");
  await expect(command("translate", { transmissionConsent: true })).rejects.toMatchObject({ code: "APPROVAL_REQUIRED" });
});
it("stores actual before/after corrections privately and invalidates only the affected reviews/recordings", async () => {
  const { workspace, command, script, approve, wav } = await setup(); await command("translate", { transmissionConsent: true }); await approve("en-page-01"); await approve("st-page-01");
  await workspace.upload("st-page-01", workspace.read()!.revision, script("st-page-01").version, wav, true, true);
  await command("approve-clip", { slot: "st-page-01", clipId: script("st-page-01").clip!.id, listenedAndMatchesScript: true, adultOwnVoice: true });
  const old = script("st-page-01").text; const other = script("st-page-02");
  await command("edit", { slot: "st-page-01", text: "Creator test correction; not claimed Sesotho" });
  expect(workspace.read()!.corrections.at(-1)).toMatchObject({ before: old, after: "Creator test correction; not claimed Sesotho", slot: "st-page-01" });
  expect(script("st-page-01").clip!.approved).toBe(false); expect(script("st-page-01").status).toBe("edited"); expect(script("st-page-02")).toEqual(other);
  await command("edit", { slot: "en-page-01", text: "Creator source change" });
  expect(script("st-page-01").version).toBeGreaterThan(script("st-page-01").clip!.scriptVersion);
  expect(workspace.read()!.story.pages[0].approvals.text).toBe(false); expect(workspace.read()!.story.pages[0].approvals.illustration).toBe(false);
});
it("requires adult/storage consent and current scripts, validates actual WAV duration and isolates/deletes bytes", async () => {
  const { workspace, command, script, approve, wav, session } = await setup();
  await expect(workspace.upload("en-page-01", 0, 0, wav, true, true)).rejects.toMatchObject({ code: "APPROVAL_REQUIRED" });
  await approve("en-page-01");
  await expect(workspace.upload("en-page-01", workspace.read()!.revision, 0, wav, false, true)).rejects.toMatchObject({ code: "CONSENT_REQUIRED" });
  await expect(workspace.upload("en-page-01", workspace.read()!.revision, 0, new Uint8Array([1, 2]), true, true)).rejects.toMatchObject({ code: "INVALID_INPUT" });
  await workspace.upload("en-page-01", workspace.read()!.revision, 0, wav, true, true); const id = script("en-page-01").clip!.id;
  expect(workspace.clip(id)).toEqual(wav);
  const other = new SpeechWorkspace(db, randomUUID(), readConfig(), {} as never); expect(() => other.clip(id)).toThrow("not found");
  await workspace.upload("en-page-01", workspace.read()!.revision, 0, wav, true, true);
  expect(script("en-page-01").recordingHistory).toContainEqual(expect.objectContaining({ assetId: `recording-${id}`, providerId: "creator" }));
  expect(() => workspace.clip(id)).toThrow("not found");
  await command("delete-clip", { slot: "en-page-01" }); expect(() => workspace.clip(id)).toThrow("not found");
  expect(script("en-page-01").recordingHistory.length).toBe(0);
  expect(db.prepare("SELECT COUNT(*) AS n FROM speech_clips WHERE session_id=?").get(session)!.n).toBe(0);
  await approve("en-word-01");
  const long = encodeCaptureWav(Float32Array.from({ length: 16000 * 6 }, (_, i) => Math.sin(i / 9) * .1), 16000);
  await expect(workspace.upload("en-word-01", workspace.read()!.revision, 0, long, true, true)).rejects.toMatchObject({ code: "INVALID_INPUT" });
  const silent = encodeCaptureWav(new Float32Array(16000), 16000);
  await expect(workspace.upload("en-word-01", workspace.read()!.revision, 0, silent, true, true)).rejects.toMatchObject({ code: "INVALID_INPUT" });
});
it("never freezes or exports incomplete packs, and an ambiguous translation is not automatically repeated", async () => {
  const { workspace, command, transport, session } = await setup();
  expect(speechFreezeIssues(workspace.read()!).length).toBeGreaterThan(24);
  await expect(command("freeze", { everyPageAndClipConfirmed: true, adultOwnVoice: true, redistributionConsent: true, includeCorrections: false })).rejects.toMatchObject({ code: "APPROVAL_REQUIRED" });
  expect(() => workspace.fixtureExport()).toThrow();
  expect(() => writeReviewedSpeechFixtures(db, session, join(directory, "never-created"))).toThrow();
  expect(db.prepare("SELECT busy FROM speech_projects WHERE session_id=?").get(session)!.busy).toBe(0);
  const send = vi.spyOn(transport, "respond").mockRejectedValue({ status: 429, message: "secret-prompt" });
  await expect(command("translate", { transmissionConsent: true })).rejects.toMatchObject({ code: "RATE_LIMITED" });
  await expect(command("translate", { transmissionConsent: true })).rejects.toMatchObject({ code: "APPROVAL_REQUIRED" }); expect(send).toHaveBeenCalledTimes(1);
  expect(db.prepare("SELECT state FROM ai_operations").get()!.state).toBe("pending");
});
it("freezes only a fully reviewed 24-clip pack and clears export consent after replacement", async () => {
  const { workspace, command, script, approve, wav, session } = await setup(); await command("translate", { transmissionConsent: true });
  for (const current of workspace.read()!.scripts) {
    if (!current.text) await command("edit", { slot: current.id, text: "Creator supplied test wording, not a traditional phrase" });
    await approve(current.id);
    await workspace.upload(current.id, workspace.read()!.revision, script(current.id).version, wav, true, true);
    await command("approve-clip", { slot: current.id, clipId: script(current.id).clip!.id, listenedAndMatchesScript: true, adultOwnVoice: true });
  }
  await command("freeze", { everyPageAndClipConfirmed: true, adultOwnVoice: true, redistributionConsent: true, includeCorrections: false });
  const pack = workspace.fixtureExport(); expect(pack.recordings.length).toBe(24); expect(pack.corrections.length).toBe(0);
  expect(writeReviewedSpeechFixtures(db, session, join(directory, "test-only-not-committed"))).toMatchObject({ clips: 24 });
  expect(db.prepare("SELECT busy FROM speech_projects WHERE session_id=?").get(session)!.busy).toBe(0);
  await command("edit", { slot: "en-word-01", text: "Changed word" }); expect(workspace.read()!.frozen).toBe(false); expect(() => workspace.fixtureExport()).toThrow();
// This temporary-DB integration checks all 24 durable clips and fixture output; allow cold-disk latency.
}, 20_000);
it("keeps existing review available with live AI disabled and rejects cross-origin/consentless uploads before dispatch", async () => {
  const { session, transport } = await setup();
  db.prepare("INSERT INTO ai_sessions VALUES (?, ?)").run(session, Date.now() + 60000);
  const send = vi.spyOn(transport, "respond");
  const handlers = createSpeechHandlers({ config: () => readConfig({ DATA_DIR: directory, AI_PROVIDER: "real", AI_ADAPTER: "openai", ENABLE_LIVE_AI: "0" }), provider: (_config, guard) => { const adapter = createOpenAIAdapter({ transport }); return protectProvider(adapter, typeof guard === "function" ? guard(adapter) : guard); } });
  const headers = { cookie: `storispaza-session=${session}`, origin: "http://127.0.0.1:3000", "content-type": "application/json" };
  expect((await handlers.handle(new Request("http://127.0.0.1:3000/api/speech", { headers }))).status).toBe(200);
  const translated = await handlers.handle(new Request("http://127.0.0.1:3000/api/speech", { method: "POST", headers, body: JSON.stringify({ action: "translate", revision: 0, transmissionConsent: true }) }));
  expect(translated.status).toBe(503); expect(send).not.toHaveBeenCalled();
  const hostile = await handlers.handle(new Request("http://127.0.0.1:3000/api/speech", { method: "POST", headers: { ...headers, origin: "https://evil.example" }, body: "{}" })); expect(hostile.status).toBe(403);
  const noConsent = await handlers.handle(new Request("http://127.0.0.1:3000/api/speech?slot=en-page-01", { method: "POST", headers, body: "not read as audio" }));
  expect((await noConsent.json()).error.code).toBe("CONSENT_REQUIRED");
});
