import "server-only";
import { demoStory } from "../../../fixtures/demo-story";
import { AppError } from "../errors";
import type { ProviderResult, StoryProvider } from "./types";

export function createMockProvider(latencyMs = 250): StoryProvider {
  async function result<T>(data: T): Promise<ProviderResult<T>> {
    await new Promise(resolve => setTimeout(resolve, latencyMs));
    return { data: structuredClone(data), provenance: "mock-fixture", usage: { estimatedUsd: 0, actualUsd: 0 } };
  }
  return {
    mode: "mock",
    async structureStory() { return result(demoStory); }, // Explicit fixture playback; not input-dependent generation.
    async transcribe(input) {
      if (!input.apiConsent) throw new AppError("CONSENT_REQUIRED", "Confirm simulated transcription before continuing.");
      if (input.language !== "en") throw new AppError("INVALID_INPUT", "Sesotho transcription is manual-only.");
      return result("Fixture transcript: a girl from Soweto uses an imaginary power to help her community.");
    },
    async translate() { return result(Array.from({ length: 6 }, () => "[Provisional fixture: creator translation pending]")); },
    async checkIllustrationPrompt() { return result({ status: "needs-review" as const, reasons: ["Mock mode cannot certify prompt safety or cultural accuracy."] }); },
    async createCharacterSheet() { return result({ assetId: "provisional-placeholder" }); },
    async illustrate() { return result({ assetId: "provisional-placeholder" }); },
  };
}
