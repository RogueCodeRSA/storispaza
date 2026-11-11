import { describe, expect, it } from "vitest";
import { demoStory } from "../fixtures/demo-story";
import { replaceIllustration, storySchema } from "@/domain/story";
import { mockExportJson, mockReaderHtml, newMockDraft, normalizeMockDraft, regenerateMockImage } from "@/domain/mock-journey";

describe("per-asset producer identity", () => {
  it("preserves the original producer and history across provider changes", () => {
    const original = demoStory.pages[0];
    const second = replaceIllustration(original, "provider-b-image-1", { assetId: "provider-b-image-1", providerId: "provider-b", model: "model-b", origin: "generated", editedByCreator: false });
    const third = replaceIllustration(second, "provider-c-image-1", { assetId: "provider-c-image-1", providerId: "provider-c", model: "model-c", origin: "generated", editedByCreator: false });
    expect(third.assetSources.illustration?.providerId).toBe("provider-c");
    expect(third.assetHistory.map(asset => asset.providerId)).toEqual(["local-placeholder", "provider-b"]);
    expect(third.assetSources.text.providerId).toBe("codex-authoring");
    expect(third.approvals.illustration).toBe(false);
    expect(original.assetHistory).toEqual([]);
  });
  it("preserves producer metadata during mock replay, restore and exports", () => {
    const initial = newMockDraft();
    const originalImageSource = initial.story.pages[0].assetSources.illustration;
    const draft = regenerateMockImage(initial, 0);
    Object.values(draft.acknowledgements).forEach(flags => flags.fill(true)); draft.culturalAcknowledgement = true;
    const restored = normalizeMockDraft(JSON.parse(JSON.stringify(draft)));
    expect(restored.story.pages[0].assetSources.text.providerId).toBe("codex-authoring");
    expect(restored.story.pages[0].assetSources.illustration).toEqual(originalImageSource);
    expect(restored.story.pages[0].assetHistory).toEqual(initial.story.pages[0].assetHistory);
    const output = JSON.parse(mockExportJson(restored));
    expect(output.story.pages[0].assetSources.illustration).toEqual(originalImageSource);
    expect(mockReaderHtml(restored)).toContain("Sources — text: codex-authoring");
  });
  it("marks old missing sources unknown, never guesses a current provider", () => {
    const old = JSON.parse(JSON.stringify(demoStory));
    old.pages.forEach((page: { assetSources?: unknown; assetHistory?: unknown }) => { delete page.assetSources; delete page.assetHistory; });
    const migrated = storySchema.parse(old);
    expect(migrated.pages[0].assetSources.text.providerId).toBe("unknown");
    expect(migrated.pages[0].assetSources.illustration).toBeNull();
  });
});
