import { expect, it } from "vitest";
import { exampleStories, libraryCopy, readLibrary } from "@/domain/library";
import { newMockDraft } from "@/domain/mock-journey";

it("starts private and refuses local listing without both sharing and inclusion consent", () => {
  const draft = newMockDraft(); const id = "20000000-0000-4000-8000-000000000001";
  expect(() => libraryCopy(draft, true, id)).toThrow();
  draft.story.visibility = "shared"; expect(() => libraryCopy(draft, true, id)).toThrow();
  draft.story.sharingConsent = true; expect(() => libraryCopy(draft, false, id)).toThrow();
  expect(() => libraryCopy(draft, true, id)).toThrow(/readiness/);
  draft.acknowledgements = { text: Array(6).fill(true), images: Array(6).fill(true), translations: Array(6).fill(true) }; draft.culturalAcknowledgement = true;
  const before = JSON.stringify(draft); const saved = libraryCopy(draft, true, id);
  expect(saved.status).toBe("unreviewed"); expect(saved.pages).toHaveLength(6); expect(saved.pages.every(page => page.st === null)).toBe(true);
  expect(JSON.stringify(saved)).not.toMatch(/recording|audio|assetSources|approvals/); expect(JSON.stringify(draft)).toBe(before);
  expect(readLibrary(JSON.stringify([saved]))).toEqual([saved]);
  expect(() => readLibrary(JSON.stringify([{ ...saved, sharingConsent: false }]))).toThrow();
});
it("offers two English-only examples with truthful credit and no fake reviews or media", () => {
  expect(exampleStories).toHaveLength(2);
  for (const story of exampleStories) {
    expect(story.example).toBe(true); expect(story.status).toBe("unreviewed"); expect(story.creator).toContain("example");
    expect(story.pages.every(page => page.st === null)).toBe(true); expect(readLibrary(JSON.stringify([story]))).toEqual([story]);
  }
  expect(readLibrary(null)).toEqual([]); expect(() => readLibrary("broken")).toThrow();
  expect(() => readLibrary("x".repeat(1_000_001))).toThrow();
});
