import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import manifest from "../fixtures/approved-images/manifest.json";
import { reviewedImageFixtures, reviewedFixtureImage } from "@/domain/image-pack";
import { newMockDraft, regenerateMockImage, mockReaderHtml } from "@/domain/mock-journey";

it("ships exactly six consented, approved source fixtures with identical offline and standalone bytes", () => {
  expect(manifest.redistributionConsent).toBe(true);
  expect(manifest.images.length).toBe(7);
  expect(reviewedImageFixtures.map(image => image.page).sort()).toEqual([1, 2, 3, 4, 5, 6]);
  const hash = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex");
  for (const image of reviewedImageFixtures) {
    const item = manifest.images.find(item => item.file === `page-${image.page}.webp`)!;
    expect(item.approved && item.frozen).toBe(true);
    expect(image.source).toEqual(item.source);
    expect(image.history).toEqual(manifest.history.find(item => item.page === image.page)!.sources);
    expect(hash(Buffer.from(image.dataUrl.split(",")[1], "base64"))).toBe(hash(readFileSync(`fixtures/approved-images/${item.file}`)));
    expect(hash(readFileSync(`fixtures/approved-images/${item.file}`))).toBe(item.sha256);
  }
  const draft = newMockDraft();
  expect(reviewedFixtureImage(draft.story.pages[0].illustrationAssetId)).toMatch(/^data:image\/webp;base64,/);
  const replaced = regenerateMockImage(draft, 0);
  expect(reviewedFixtureImage(replaced.story.pages[0].illustrationAssetId)).toBeNull();
  expect(replaced.story.pages[1].assetSources).toEqual(draft.story.pages[1].assetSources);
  Object.values(draft.acknowledgements).forEach(flags => flags.fill(true)); draft.culturalAcknowledgement = true;
  expect(mockReaderHtml(draft).includes("data:image/webp;base64,")).toBe(true);
  expect(draft.story.pages.every(page => !page.approvals.illustration)).toBe(true);
  draft.story.pages[0].assetSources.illustration!.providerId = "creator-test-edit";
  expect(newMockDraft().story.pages[0].assetSources.illustration).toEqual(manifest.images.find(image => image.file === "page-1.webp")!.source);
});
