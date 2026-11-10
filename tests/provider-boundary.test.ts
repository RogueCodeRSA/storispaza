import { describe, expect, it, vi } from "vitest";
import { demoStory } from "../fixtures/demo-story";
import { protectProvider, type ProviderAllowanceGuard } from "@/server/providers/boundary";
import { createMockProvider } from "@/server/providers/adapters/mock.adapter";
import type { ProviderResult, StoryProvider } from "@/server/providers/types";
import { AppError } from "@/server/errors";
import type { Story } from "@/domain/story";

const input = { idea: "Sensitive test idea", culturalContext: "Creator context", educationalObjective: "Cooperation", sourceLanguage: "en" as const };
function output(): ProviderResult<Story> {
  const story = structuredClone(demoStory);
  story.pages.forEach(page => { page.assetSources.text = { assetId: `generated-text-${page.number}`, providerId: "test-provider", model: "test-model", origin: "generated", editedByCreator: false }; });
  return { data: story, providerId: "test-provider", provenance: "generated", assets: story.pages.map(page => page.assetSources.text), usage: { estimatedUsd: 0, actualUsd: 0, tokens: { input: 10, output: 20 }, allowance: { unit: "compute-units", estimated: 50, actual: 40 } } };
}
function guard(): ProviderAllowanceGuard {
  return { reserve: vi.fn(async () => "reservation-1"), settle: vi.fn(async () => {}), retainUnknown: vi.fn(async () => {}) };
}
function adapter(response = output()): StoryProvider {
  return { ...createMockProvider(0), id: "test-provider", mode: "real", structureStory: vi.fn(async () => response) };
}

describe("vendor-neutral provider safety boundary", () => {
  it("blocks an unguarded live call, including a zero-dollar free call", async () => {
    const raw = adapter();
    await expect(protectProvider(raw).structureStory(input)).rejects.toMatchObject({ code: "BUDGET_EXCEEDED" });
    expect(raw.structureStory).not.toHaveBeenCalled();
  });
  it("reserves before dispatch and settles only usage, not prompt content", async () => {
    const raw = adapter(); const allowance = guard();
    const result = await protectProvider(raw, allowance).structureStory(input);
    expect(allowance.reserve).toHaveBeenCalledWith("structureStory");
    expect(vi.mocked(allowance.reserve).mock.invocationCallOrder[0]).toBeLessThan(vi.mocked(raw.structureStory).mock.invocationCallOrder[0]);
    expect(allowance.settle).toHaveBeenCalledWith("reservation-1", result.usage);
    expect(allowance.retainUnknown).not.toHaveBeenCalled();
  });
  it("stops on allowance denial without calling or falling back", async () => {
    const raw = adapter(); const allowance = guard();
    vi.mocked(allowance.reserve).mockRejectedValue(new AppError("BUDGET_EXCEEDED", "Allowance exhausted", 429));
    await expect(protectProvider(raw, allowance).structureStory(input)).rejects.toMatchObject({ code: "BUDGET_EXCEEDED" });
    expect(raw.structureStory).not.toHaveBeenCalled();
  });
  it("rejects an empty allowance reservation before dispatch", async () => {
    const raw = adapter(); const allowance = guard(); vi.mocked(allowance.reserve).mockResolvedValue("");
    await expect(protectProvider(raw, allowance).structureStory(input)).rejects.toMatchObject({ code: "BUDGET_EXCEEDED" });
    expect(raw.structureStory).not.toHaveBeenCalled();
  });
  it("rejects malformed outputs, missing asset provenance and mismatched producer IDs", async () => {
    for (const corrupt of [
      (value: ProviderResult<Story>) => { value.data.pages.pop(); },
      (value: ProviderResult<Story>) => { value.assets = []; },
      (value: ProviderResult<Story>) => { value.assets[0].providerId = "another-provider"; },
      (value: ProviderResult<Story>) => { value.usage.estimatedUsd = NaN; },
      (value: ProviderResult<Story>) => { value.usage.allowance = null; },
    ]) {
      const response = output(); corrupt(response); const allowance = guard();
      await expect(protectProvider(adapter(response), allowance).structureStory(input)).rejects.toMatchObject({ code: "INVALID_PROVIDER_RESPONSE" });
      expect(allowance.settle).not.toHaveBeenCalled();
      expect(allowance.retainUnknown).toHaveBeenCalledWith("reservation-1");
    }
  });
  it("strips transport-only fields from successful responses", async () => {
    const response = { ...output(), privateTransportDetails: "do-not-forward" };
    const result = await protectProvider(adapter(response), guard()).structureStory(input);
    expect(JSON.stringify(result)).not.toContain("do-not-forward");
  });
  it("retains uncertain usage instead of silently calling it free", async () => {
    const response = output(); response.usage.allowance!.actual = null;
    const allowance = guard(); await protectProvider(adapter(response), allowance).structureStory(input);
    expect(allowance.retainUnknown).toHaveBeenCalledWith("reservation-1");
    expect(allowance.settle).not.toHaveBeenCalled();
  });
  it("redacts SDK exception content and never retries or logs it", async () => {
    const raw = adapter(); const allowance = guard();
    vi.mocked(raw.structureStory).mockRejectedValue(new Error("secret-token private-transcript raw-prompt"));
    const consoleLog = vi.spyOn(console, "log"); const consoleError = vi.spyOn(console, "error");
    try {
      await expect(protectProvider(raw, allowance).structureStory(input)).rejects.toMatchObject({ code: "API_UNAVAILABLE", message: "The provider operation could not complete. No fallback was used." });
      expect(raw.structureStory).toHaveBeenCalledTimes(1);
      expect(consoleLog).not.toHaveBeenCalled(); expect(consoleError).not.toHaveBeenCalled();
    } finally { consoleLog.mockRestore(); consoleError.mockRestore(); }
  });
});
