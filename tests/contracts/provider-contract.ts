import { describe, expect, it } from "vitest";
import { demoStory } from "../../fixtures/demo-story";
import { storySchema } from "@/domain/story";
import type { ProviderOperation, ProviderResult, StoryProvider } from "@/server/providers/types";
import { encodeCaptureWav } from "@/domain/capture";

export const operations: ProviderOperation[] = ["structureStory", "transcribe", "translate", "checkIllustrationPrompt", "createCharacterSheet", "illustrate"];

export function invokeOperation(provider: StoryProvider, operation: ProviderOperation): Promise<ProviderResult<unknown>> {
  switch (operation) {
    case "structureStory": return provider.structureStory({ idea: "Fictional community story", culturalContext: "Creator context", educationalObjective: "Cooperation", sourceLanguage: "en" });
    case "transcribe": return provider.transcribe({ bytes: encodeCaptureWav(new Float32Array(16000), 16000), language: "en", apiConsent: true });
    case "translate": return provider.translate(structuredClone(demoStory), "st");
    case "checkIllustrationPrompt": return provider.checkIllustrationPrompt("An adult-led classroom activity, awaiting creator review.");
    case "createCharacterSheet": return provider.createCharacterSheet(structuredClone(demoStory), "Creator-confirmed fictional child character sheet, no unsafe electrical actions.");
    case "illustrate": return provider.illustrate({ page: structuredClone(demoStory.pages[0]), characterSheetAssetId: "fixture-sheet", sharedStyle: "picture book", culturalContext: "Creator context", prompt: "Creator-confirmed adult-led safe activity.", referenceImageBase64: "dGVzdA==" });
  }
}

// Every registered adapter supplies an offline test factory. A live adapter must
// inject a deterministic transport: this suite must never use account credentials.
export function defineProviderContract(name: string, create: () => StoryProvider): void {
  describe(`provider contract: ${name}`, () => {
    it("declares an identity, mode and capability for every operation", () => {
      const provider = create();
      expect(provider.id).toBe(name);
      expect(["mock", "real"]).toContain(provider.mode);
      expect(Object.keys(provider.capabilities).sort()).toEqual([...operations].sort());
    });
    for (const operation of operations) {
      it(`${operation}: validates output/provenance/usage or explicitly rejects an unavailable capability`, async () => {
        const provider = create();
        if (provider.capabilities[operation] !== "available") {
          await expect(invokeOperation(provider, operation)).rejects.toMatchObject({ code: "NOT_IMPLEMENTED" });
          return;
        }
        const result = await invokeOperation(provider, operation);
        expect(result.providerId).toBe(provider.id);
        expect(result.provenance).toBe(provider.mode === "mock" ? "mock-fixture" : "generated");
        expect(result.usage.estimatedUsd).toBeGreaterThanOrEqual(0);
        expect(result.usage.actualUsd === null || result.usage.actualUsd >= 0).toBe(true);
        for (const source of result.assets) {
          expect(source.assetId).not.toBe(""); expect(source.providerId).not.toBe("");
          if (provider.mode === "real") expect(source.providerId).toBe(provider.id);
        }
        if (operation === "structureStory") {
          const story = storySchema.parse(result.data);
          expect(story.pages).toHaveLength(6);
          expect(story.visibility).toBe("private");
          expect(story.sharingConsent).toBe(false);
          expect(story.assumptionsConfirmed).toBe(false);
          expect(story.pages.every(page => !Object.values(page.approvals).some(Boolean) && page.translation?.status !== "approved")).toBe(true);
        }
        if (operation === "translate") expect(result.data).toHaveLength(6);
      });
    }
    it("requires transmission consent and rejects disabled speech languages", async () => {
      const provider = create();
      await expect(provider.transcribe({ bytes: new Uint8Array(), language: "en", apiConsent: false })).rejects.toMatchObject({ code: "CONSENT_REQUIRED" });
      await expect(provider.transcribe({ bytes: new Uint8Array(), language: "st", apiConsent: true })).rejects.toMatchObject({ code: "INVALID_INPUT" });
    });
    it("never lets one story edit mutate the next result", async () => {
      const provider = create();
      if (provider.capabilities.structureStory !== "available") return;
      const first = await invokeOperation(provider, "structureStory");
      const original = JSON.stringify(first);
      (first.data as { pages: { narrative: string }[] }).pages[0].narrative = "Changed by creator";
      expect(JSON.stringify(await invokeOperation(provider, "structureStory"))).toBe(original);
    });
  });
}
