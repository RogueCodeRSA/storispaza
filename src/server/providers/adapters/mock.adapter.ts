import "server-only";
import { demoStory } from "../../../../fixtures/demo-story";
import { fixtureSource, type AssetSource } from "@/domain/provenance";
import { AppError } from "../../errors";
import type { ProviderResult, StoryProvider } from "../types";

export function createMockProvider(latencyMs = 250): StoryProvider {
  async function result<T>(data: T, assets: AssetSource[] = []): Promise<ProviderResult<T>> {
    await new Promise(resolve => setTimeout(resolve, latencyMs));
    return { data: structuredClone(data), assets: structuredClone(assets), providerId: "mock", provenance: "mock-fixture", usage: { estimatedUsd: 0, actualUsd: 0, tokens: null, allowance: null } };
  }
  return {
    id: "mock", mode: "mock",
    capabilities: { structureStory: "available", transcribe: "available", translate: "available", checkIllustrationPrompt: "available", createCharacterSheet: "available", illustrate: "available" },
    async structureStory() { return result(demoStory, demoStory.pages.map(page => page.assetSources.text)); }, // Replay preserves the original producer, not the mock transport ID.
    async transcribe(input) {
      if (!input.apiConsent) throw new AppError("CONSENT_REQUIRED", "Confirm simulated transcription before continuing.");
      if (input.language !== "en") throw new AppError("INVALID_INPUT", "Sesotho transcription is manual-only.");
      return result("Fixture transcript: a girl from Soweto uses an imaginary power to help her community.", [fixtureSource("demo-transcript", "local-placeholder")]);
    },
    async translate() { return result(Array.from({ length: 6 }, () => "[Provisional fixture: creator translation pending]"), Array.from({ length: 6 }, (_, i) => fixtureSource(`demo-translation-${i + 1}`, "local-placeholder"))); },
    async checkIllustrationPrompt() { return result({ status: "needs-review" as const, reasons: ["Mock mode cannot certify prompt safety or cultural accuracy."] }); },
    async createCharacterSheet() { return result({ assetId: "provisional-placeholder" }, [fixtureSource("provisional-placeholder", "local-placeholder")]); },
    async illustrate() { return result({ assetId: "provisional-placeholder" }, [fixtureSource("provisional-placeholder", "local-placeholder")]); },
  };
}
