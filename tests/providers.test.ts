import { describe, expect, it, vi, afterEach } from "vitest";
import { storySchema } from "@/domain/story";
import { createMockProvider } from "@/server/providers/adapters/mock.adapter";
import { createProvider } from "@/server/providers";
import { readConfig } from "@/server/config";
import { errorResponse } from "@/server/errors";
import { GET as demoGET } from "@/app/api/demo/story/route";
import { GET as healthGET } from "@/app/api/health/route";

const input = { idea: "A community story", culturalContext: "Creator context", educationalObjective: "Cooperation", sourceLanguage: "en" as const };
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe("providers and API boundaries", () => {
  it("replays labelled, cloned fixtures with no network or key", async () => {
    const network = vi.fn(() => { throw new Error("External network forbidden"); });
    vi.stubGlobal("fetch", network);
    const provider = createMockProvider(1);
    const first = await provider.structureStory(input);
    expect(storySchema.safeParse(first.data).success).toBe(true);
    first.data.pages[0].narrative = "Edited locally";
    const second = await provider.structureStory(input);
    expect(second.data.pages[0].narrative).not.toBe("Edited locally");
    expect(second.provenance).toBe("mock-fixture");
    expect(second.usage.actualUsd).toBe(0);
    expect(network).not.toHaveBeenCalled();
  });
  it("does not approve mock safety or invent a Sesotho translation", async () => {
    const provider = createMockProvider(0);
    const story = (await provider.structureStory(input)).data;
    expect((await provider.checkIllustrationPrompt("A scene")).data.status).toBe("needs-review");
    expect((await provider.translate(story, "st")).data).toHaveLength(6);
    expect(story.pages.every(p => p.translation === null && !p.approvals.text)).toBe(true);
    await expect(provider.transcribe({ bytes: new Uint8Array(), language: "st", apiConsent: true })).rejects.toMatchObject({ code: "INVALID_INPUT" });
    await expect(provider.transcribe({ bytes: new Uint8Array(), language: "en", apiConsent: false })).rejects.toMatchObject({ code: "CONSENT_REQUIRED" });
  });
  it("requires explicit mode and fails closed for unavailable real operations", async () => {
    expect(createProvider(readConfig({})).mode).toBe("mock");
    expect(() => readConfig({ AI_PROVIDER: "typo" })).toThrow();
    expect(() => createProvider(readConfig({ AI_PROVIDER: "real" }))).toThrow();
    expect(() => createProvider(readConfig({ AI_PROVIDER: "real", AI_ADAPTER: "not-registered" }))).toThrow();
    expect(() => createProvider(readConfig({ AI_PROVIDER: "real", AI_ADAPTER: "mock" }))).toThrow();
  });
  it("serves mock API metadata and redacts unexpected errors", async () => {
    vi.stubEnv("AI_PROVIDER", "mock");
    const response = await demoGET();
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toMatchObject({ provenance: "mock-fixture", fixtureStatus: "provisional", humanReviewed: false });
    expect(await healthGET().json()).toMatchObject({ milestone: "M2", realOperationsEnabled: false });
    const error = errorResponse(new Error("private key or transcript"));
    expect(error.status).toBe(500);
    expect(JSON.stringify(await error.json())).not.toContain("private key");
  });
  it("never falls back silently from real mode", async () => {
    vi.stubEnv("AI_PROVIDER", "real");
    vi.stubEnv("OPENAI_API_KEY", "");
    const response = await demoGET();
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ error: { code: "API_UNAVAILABLE" } });
    vi.stubEnv("OPENAI_API_KEY", "not-a-real-key");
    expect((await demoGET()).status).toBe(503);
  });
});
