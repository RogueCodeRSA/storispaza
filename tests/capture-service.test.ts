import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createCaptureHandlers } from "@/server/capture-service";
import { readConfig } from "@/server/config";
import { openDatabase } from "@/server/storage";
import { createOpenAIAdapter } from "@/server/providers/adapters/openai.adapter";
import { protectProvider } from "@/server/providers/boundary";
import { encodeCaptureWav } from "@/domain/capture";
import { fakeTransport } from "./helpers/live-provider";

let directory: string;
beforeEach(() => { directory = mkdtempSync(join(tmpdir(), "storispaza-capture-")); });
afterEach(() => { rmSync(directory, { recursive: true, force: true }); });
function request(path: string, body?: string | Uint8Array, headers: Record<string, string> = {}) {
  return new Request(`http://127.0.0.1:3000/api/capture/${path}`, { method: "POST", headers: { origin: "http://127.0.0.1:3000", ...headers }, body: typeof body === "string" ? body : body?.buffer as ArrayBuffer | undefined });
}
function setup(overrides: Record<string, string> = {}) {
  const transport = fakeTransport(); const respond = vi.spyOn(transport, "respond"); const transcribe = vi.spyOn(transport, "transcribe");
  const handlers = createCaptureHandlers({ config: () => readConfig({ AI_PROVIDER: "real", AI_ADAPTER: "openai", ENABLE_LIVE_AI: "1", DATA_DIR: directory, ...overrides }), provider: (_config, guard) => {
    const adapter = createOpenAIAdapter({ transport }); return protectProvider(adapter, typeof guard === "function" ? guard(adapter) : guard);
  } });
  return { handlers, respond, transcribe };
}
const idea = JSON.stringify({ idea: "A fictional community story", culturalContext: "Creator context", educationalObjective: "Cooperation", sourceLanguage: "en" });
describe("local capture API, real transports injected offline", () => {
  it("blocks disabled operation and hostile origins before calling any provider", async () => {
    const { handlers, respond } = setup({ ENABLE_LIVE_AI: "0" });
    expect((await handlers.session(request("session"))).status).toBe(503);
    expect((await handlers.generate(request("story", idea, { origin: "https://evil.example" }))).status).toBe(403);
    expect(respond).not.toHaveBeenCalled();
  });
  it("issues/reuses a private server session and persists usage without story content", async () => {
    const { handlers } = setup();
    const first = await handlers.session(request("session")); const cookie = first.headers.get("set-cookie")!.split(";")[0];
    expect(first.headers.get("set-cookie")).toContain("HttpOnly; SameSite=Strict");
    const second = await handlers.session(request("session", undefined, { cookie }));
    expect(second.headers.get("set-cookie")!.split(";")[0]).toBe(cookie);
    const response = await handlers.generate(request("story", idea, { cookie, "content-type": "application/json", "x-ai-consent": "true" }));
    expect(response.status).toBe(200); expect((await response.json()).data.pages).toHaveLength(6);
    const db = openDatabase(directory);
    try { const rows = db.prepare("SELECT usage_json FROM ai_measurements").all(); expect(rows).toHaveLength(1); expect(JSON.stringify(rows)).not.toContain("fictional community"); }
    finally { db.close(); }
  });
  it("rejects missing consent/session and invalid inputs before dispatch", async () => {
    const { handlers, respond } = setup();
    expect((await handlers.generate(request("story", idea, { "content-type": "application/json" }))).status).toBe(400);
    expect((await handlers.generate(request("story", idea, { "content-type": "application/json", "x-ai-consent": "true" }))).status).toBe(403);
    expect((await handlers.generate(request("story", "bad", { "content-type": "application/json", "x-ai-consent": "true" }))).status).toBe(400);
    expect((await handlers.generate(request("story", "x".repeat(33000), { "content-type": "application/json", "x-ai-consent": "true" }))).status).toBe(413);
    expect(respond).not.toHaveBeenCalled();
  });
  it("enforces audio consent, real duration/format and English-only policy", async () => {
    const { handlers, transcribe } = setup();
    const cookie = (await handlers.session(request("session"))).headers.get("set-cookie")!.split(";")[0];
    const bytes = encodeCaptureWav(new Float32Array(16000), 16000);
    const headers = { cookie, "content-type": "audio/wav", "x-audio-consent": "true", "x-audio-language": "en" };
    expect((await handlers.transcribe(request("transcribe", bytes, { ...headers, "x-audio-consent": "false" }))).status).toBe(400);
    expect((await handlers.transcribe(request("transcribe", bytes, { ...headers, "x-audio-language": "st" }))).status).toBe(400);
    expect((await handlers.transcribe(request("transcribe", new Uint8Array([0, 1]), headers))).status).toBe(400);
    const result = await handlers.transcribe(request("transcribe", bytes, headers)); expect(result.status).toBe(200); expect(transcribe).toHaveBeenCalledTimes(1);
  });
  it("denies a reservation over the session cap without calling or mocking around it", async () => {
    const { handlers, respond } = setup({ SESSION_BUDGET_USD: ".01" });
    const cookie = (await handlers.session(request("session"))).headers.get("set-cookie")!.split(";")[0];
    const result = await handlers.generate(request("story", idea, { cookie, "content-type": "application/json", "x-ai-consent": "true" }));
    expect(result.status).toBe(429); expect(respond).not.toHaveBeenCalled();
  });
});
