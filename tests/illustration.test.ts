import { randomUUID } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { DatabaseSync } from "node:sqlite";
import { demoStory } from "../fixtures/demo-story";
import brief from "../docs/M3_CREATIVE_BRIEF.json";
import { openDatabase } from "@/server/storage";
import { BudgetLedger } from "@/server/budget";
import { readConfig } from "@/server/config";
import { createDollarGuard } from "@/server/allowance";
import { IllustrationWorkspace, createIllustrationHandlers } from "@/server/illustration-service";
import { protectProvider } from "@/server/providers/boundary";
import { createOpenAIAdapter } from "@/server/providers/adapters/openai.adapter";
import { fakeTransport } from "./helpers/live-provider";

let directory: string; let db: DatabaseSync;
beforeEach(() => { directory = mkdtempSync(join(tmpdir(), "storispaza-images-")); db = openDatabase(directory); });
afterEach(() => { db.close(); rmSync(directory, { recursive: true, force: true }); });
async function setup(overrides: Record<string, string> = {}) {
  const config = readConfig({ AI_PROVIDER: "real", AI_ADAPTER: "openai", ENABLE_LIVE_AI: "1", DATA_DIR: directory, ...overrides });
  const transport = fakeTransport();
  const bytes = await sharp({ create: { width: 64, height: 64, channels: 3, background: "#e1ad4e" } }).webp().toBuffer();
  transport.image = vi.fn(async () => ({ data: [{ b64_json: bytes.toString("base64") }], usage: { input_tokens: 100, input_tokens_details: { text_tokens: 80, image_tokens: 20 }, output_tokens: 1000 } }));
  const adapter = createOpenAIAdapter({ transport }); const session = randomUUID();
  const provider = protectProvider(adapter, createDollarGuard(db, session, adapter, { sessionUsd: config.SESSION_BUDGET_USD, developmentUsd: config.DEVELOPMENT_BUDGET_USD, requestsPerMinute: 10 }, config.IMAGE_ATTEMPT_LIMIT));
  const workspace = new IllustrationWorkspace(db, session, config, provider);
  const start = () => workspace.execute({ action: "start", story: demoStory, brief, saveConsent: true });
  const command = (action: string, extras = {}) => workspace.execute({ action, revision: workspace.read()!.revision, ...extras });
  return { workspace, transport, session, config, start, command, bytes };
}
it("persists one unapproved sheet, reports modality tokens/cost and blocks all pages until explicit current-sheet approval", async () => {
  const { workspace, start, command, transport } = await setup(); await start();
  await expect(command("page", { page: 1, prompt: "Safe scene", sceneConfirmed: true })).rejects.toMatchObject({ code: "APPROVAL_REQUIRED" });
  await command("sheet");
  const sheet = workspace.read()!.sheet!;
  expect(sheet.approved).toBe(false); expect(sheet.frozen).toBe(false);
  expect(sheet.usage).toMatchObject({ actualUsd: .03056, imageTokens: { textInput: 80, imageInput: 20, imageOutput: 1000 } });
  expect(workspace.status().attempts).toBe(1);
  await expect(command("sheet")).rejects.toMatchObject({ code: "APPROVAL_REQUIRED" });
  await expect(command("page", { page: 1, prompt: "Safe scene", sceneConfirmed: true })).rejects.toMatchObject({ code: "APPROVAL_REQUIRED" });
  await expect(command("approve-sheet", { assetId: randomUUID(), acceptMeasuredCost: true })).rejects.toMatchObject({ code: "APPROVAL_REQUIRED" });
  expect(transport.image).toHaveBeenCalledTimes(1);
  await command("approve-sheet", { assetId: sheet.assetId, acceptMeasuredCost: true });
  expect(workspace.read()!.costAccepted).toBe(true);
});
it("screens every regeneration's complete prompt, sends actual reference bytes and preserves other pages/history", async () => {
  const { workspace, start, command, transport, bytes } = await setup(); await start(); await command("sheet");
  await command("approve-sheet", { assetId: workspace.read()!.sheet!.assetId, acceptMeasuredCost: true });
  const respond = vi.spyOn(transport, "respond");
  for (let page = 1; page <= 2; page++) await command("page", { page, prompt: "Creator-confirmed safe fictional gathering", sceneConfirmed: true });
  const original = workspace.read()!;
  await command("approve-page", { page: 1, assetId: original.pages[0]!.assetId });
  await command("page", { page: 1, prompt: "Golden fantasy ribbons far from infrastructure", sceneConfirmed: true });
  const updated = workspace.read()!;
  expect(updated.pages[1]).toEqual(original.pages[1]);
  expect(updated.pages[0]!.approved).toBe(false); expect(updated.pages[0]!.frozen).toBe(false);
  expect(updated.story.pages[0].assetHistory).toContainEqual(original.pages[0]!.source);
  expect(respond).toHaveBeenCalledTimes(3);
  expect(String(respond.mock.calls[2][0].input)).toContain("Golden fantasy ribbons");
  expect(String(respond.mock.calls[2][0].input)).toContain("No child touching mains");
  expect(transport.image).toHaveBeenLastCalledWith(expect.stringContaining("Golden fantasy ribbons"), bytes.toString("base64"));
});
it("blocks dangerous or uncertain prompts before image dispatch, including regeneration instructions", async () => {
  const { workspace, start, command, transport } = await setup(); await start();
  transport.respond = vi.fn(async () => ({ status: "completed", output_text: JSON.stringify({ status: "blocked", reasons: ["unsafe action"] }), usage: { input_tokens: 10, output_tokens: 10 } }));
  await expect(command("sheet")).rejects.toMatchObject({ code: "APPROVAL_REQUIRED" });
  expect(transport.image).not.toHaveBeenCalled(); expect(workspace.status().attempts).toBe(0);
});
it("stops on unknown image usage and on ambiguous failures, retaining the global image reservation", async () => {
  const { workspace, start, command, transport, bytes } = await setup(); await start();
  transport.image = vi.fn(async () => ({ data: [{ b64_json: bytes.toString("base64") }] }));
  await command("sheet"); expect(workspace.read()!.halted).toBe(true);
  expect(db.prepare("SELECT state FROM ai_operations WHERE kind='image'").get()!.state).toBe("pending");
  await expect(command("approve-sheet", { assetId: workspace.read()!.sheet!.assetId, acceptMeasuredCost: true })).rejects.toMatchObject({ code: "BUDGET_EXCEEDED" });
  expect(transport.image).toHaveBeenCalledTimes(1);
});
it("counts failed attempts across sessions/restarts and enforces the cap atomically", () => {
  const ledger = new BudgetLedger(db, { sessionUsd: 2, developmentUsd: 10, requestsPerMinute: 10 }, 2);
  ledger.settle(ledger.reserve(randomUUID(), .1, "image"), .01);
  ledger.settle(ledger.reserve(randomUUID(), .1, "image"), .01);
  db.close(); db = openDatabase(directory);
  expect(() => new BudgetLedger(db, undefined, 2).reserve(randomUUID(), .1, "image")).toThrow("cap reached");
  expect(() => new BudgetLedger(db, undefined, 21)).toThrow();
});
it("freezes only after six current approvals and preserves private ownership of bytes", async () => {
  const { workspace, start, command, session, config } = await setup(); await start(); await command("sheet");
  await command("approve-sheet", { assetId: workspace.read()!.sheet!.assetId, acceptMeasuredCost: true });
  await expect(command("freeze", { redistributionConsent: true })).rejects.toMatchObject({ code: "APPROVAL_REQUIRED" });
  // Exercise six real-shaped images without rate-window interference.
  for (let page = 1; page <= 6; page++) {
    db.prepare("UPDATE ai_operations SET created_at = 0").run();
    await command("page", { page, prompt: "Creator-confirmed safe fictional gathering", sceneConfirmed: true });
    await command("approve-page", { page, assetId: workspace.read()!.pages[page - 1]!.assetId });
  }
  await command("freeze", { redistributionConsent: true });
  expect(workspace.read()!.pages.every(page => page?.frozen)).toBe(true);
  expect(workspace.read()!.redistributionConsent).toBe(true);
  const other = new IllustrationWorkspace(db, randomUUID(), config, {} as never);
  expect(() => other.asset(workspace.read()!.sheet!.assetId)).toThrow("not found");
  expect(db.prepare("SELECT COUNT(*) AS n FROM illustration_assets WHERE session_id = ? AND frozen_bytes IS NOT NULL").get(session)!.n).toBe(7);
});
it("rejects stale revisions and durable busy leases before dispatch", async () => {
  const { workspace, start, command, transport, session } = await setup(); await start();
  await expect(workspace.execute({ action: "sheet", revision: 99 })).rejects.toMatchObject({ status: 409 });
  db.prepare("UPDATE illustration_projects SET busy = 1 WHERE session_id = ?").run(session);
  await expect(command("sheet")).rejects.toMatchObject({ code: "RATE_LIMITED" });
  expect(transport.image).not.toHaveBeenCalled();
});
it("rejects hostile origins, absent consent/sessions and cross-session image reads at the API boundary", async () => {
  const handlers = createIllustrationHandlers({ config: () => readConfig({ DATA_DIR: directory }) });
  const bad = await handlers.handle(new Request("http://127.0.0.1:3000/api/illustrations", { method: "POST", headers: { origin: "https://evil.example" } }));
  expect(bad.status).toBe(403);
  const absent = await handlers.handle(new Request("http://127.0.0.1:3000/api/illustrations")); expect(absent.status).toBe(403);
});
