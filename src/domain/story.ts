import { z } from "zod";

export const languageSchema = z.enum(["en", "st"]);
export type Language = z.infer<typeof languageSchema>;
const assetId = z.string().regex(/^[a-zA-Z0-9_-]+$/).max(100);
export const translationSchema = z.object({
  text: z.string().max(5000),
  status: z.enum(["machine-translated", "edited", "approved"]),
});
export const pageSchema = z.object({
  number: z.number().int().min(1).max(6),
  title: z.string().min(1).max(200),
  narrative: z.string().min(1).max(5000),
  illustrationDescription: z.string().min(1).max(3000),
  characterRefs: z.array(z.string().min(1).max(100)).min(1).max(10),
  learningMoment: z.string().min(1).max(1000),
  translation: translationSchema.nullable(),
  illustrationAssetId: assetId.nullable(),
  narrationAssetIds: z.object({ en: assetId.nullable(), st: assetId.nullable() }),
  approvals: z.object({ text: z.boolean(), illustration: z.boolean(), audio: z.boolean() }),
  provenance: z.enum(["provisional-fixture", "ai-assisted", "creator"]),
});
export const storySchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200),
  creator: z.string().min(1).max(100),
  ageGroup: z.literal("Grade R–3"),
  sourceLanguage: languageSchema,
  culturalContext: z.string().min(1).max(3000),
  culturalAssumptions: z.array(z.string().max(1000)).max(20),
  assumptionsConfirmed: z.boolean(),
  educationalObjective: z.string().min(1).max(1000),
  characters: z.array(z.object({ id: z.string().min(1).max(100), description: z.string().min(1).max(2000) })).min(1).max(10),
  sharedStyle: z.string().min(1).max(2000),
  pages: z.array(pageSchema).length(6),
  visibility: z.enum(["private", "shared"]),
  sharingConsent: z.boolean(),
}).superRefine((story, ctx) => {
  story.pages.forEach((page, index) => {
    if (page.number !== index + 1) ctx.addIssue({ code: "custom", path: ["pages", index, "number"], message: "Pages must be ordered 1 through 6." });
    if (page.characterRefs.some(ref => !story.characters.some(character => character.id === ref))) {
      ctx.addIssue({ code: "custom", path: ["pages", index, "characterRefs"], message: "Unknown character reference." });
    }
    if (page.translation?.status === "approved" && !page.translation.text.trim()) {
      ctx.addIssue({ code: "custom", path: ["pages", index, "translation"], message: "An empty translation cannot be approved." });
    }
  });
});
export type Story = z.infer<typeof storySchema>;
export type StoryPage = z.infer<typeof pageSchema>;

export function finalApprovalIssues(story: Story): string[] {
  const issues: string[] = [];
  if (!story.assumptionsConfirmed) issues.push("Confirm cultural assumptions.");
  for (const page of story.pages) {
    if (page.provenance === "provisional-fixture") issues.push(`Page ${page.number}: replace provisional fixture content before final approval.`);
    if (!page.approvals.text) issues.push(`Page ${page.number}: approve text.`);
    if (!page.illustrationAssetId || !page.approvals.illustration) issues.push(`Page ${page.number}: approve illustration.`);
    if (page.translation?.status !== "approved" || !page.translation.text.trim()) issues.push(`Page ${page.number}: approve translation.`);
    if (!page.narrationAssetIds.en || !page.narrationAssetIds.st || !page.approvals.audio) issues.push(`Page ${page.number}: review bilingual narration.`);
  }
  if (story.visibility === "shared" && !story.sharingConsent) issues.push("Consent is required for shared export.");
  return issues;
}

export function editNarrative(page: StoryPage, narrative: string): StoryPage {
  return pageSchema.parse({ ...page, narrative,
    translation: page.translation ? { ...page.translation, status: "machine-translated" } : null,
    approvals: { ...page.approvals, text: false, illustration: false, audio: false },
  });
}

export function replaceIllustration(page: StoryPage, illustrationAssetId: string): StoryPage {
  return pageSchema.parse({ ...page, illustrationAssetId, approvals: { ...page.approvals, illustration: false } });
}
