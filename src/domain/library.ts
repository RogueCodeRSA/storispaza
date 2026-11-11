import { z } from "zod";
import { demoExportIssues, type MockDraft } from "./mock-journey";

export const LIBRARY_KEY = "storispaza-local-library-v1";
export const libraryStorySchema = z.object({
  id: z.uuid(), title: z.string().trim().min(1).max(200), creator: z.string().trim().min(1).max(100),
  sharingConsent: z.literal(true), status: z.literal("unreviewed"), example: z.boolean(),
  pages: z.array(z.object({ title: z.string().max(200), en: z.string().min(1).max(5000), st: z.string().max(5000).nullable() })).min(1).max(6),
});
export type LibraryStory = z.infer<typeof libraryStorySchema>;
export function readLibrary(value: string | null): LibraryStory[] {
  if (!value) return [];
  if (value.length > 1_000_000) throw new Error("Library storage is too large.");
  return z.array(libraryStorySchema).max(10).parse(JSON.parse(value));
}
export function libraryCopy(draft: MockDraft, inclusionConsent: boolean, id: string): LibraryStory {
  if (draft.story.visibility !== "shared" || !draft.story.sharingConsent || !inclusionConsent) throw new Error("Choose shared visibility and explicitly consent before adding a local library card.");
  if (demoExportIssues(draft).length) throw new Error("Complete the existing provisional-copy readiness checklist before adding this story.");
  // Text-only projection: no recording bytes, media URLs, private journals or
  // inherited human approvals cross into the provisional local library.
  return libraryStorySchema.parse({ id, title: draft.story.title, creator: draft.story.creator,
    sharingConsent: true, status: "unreviewed", example: false,
    pages: draft.story.pages.map(page => ({ title: page.title, en: page.narrative,
      st: page.translation?.text.trim() && !/placeholder|pending/i.test(page.translation.text) ? page.translation.text : null })),
  });
}
export const exampleStories: LibraryStory[] = [
  { id: "10000000-0000-4000-8000-000000000001", title: "The Rain Jar", creator: "StoriSpaza · Codex-assisted example", sharingConsent: true, status: "unreviewed", example: true,
    pages: [{ title: "A rainy morning", en: "Mia watched rain tap on the window. She drew a jar on a sheet of paper and counted ten drops in her picture.", st: null }, { title: "One more drop", en: "Her brother drew one more drop. Together they counted eleven. Their paper jar had room for many more.", st: null }, { title: "Pictures to share", en: "When the rain stopped, they showed their drawings to each other. Every jar looked different. Every jar told a little story.", st: null }] },
  { id: "10000000-0000-4000-8000-000000000002", title: "The Paper Bridge", creator: "StoriSpaza · Codex-assisted example", sharingConsent: true, status: "unreviewed", example: true,
    pages: [{ title: "A tiny river", en: "Sam drew a blue river on the table's paper mat. A toy rabbit waited on one side and a toy bear waited on the other.", st: null }, { title: "Fold and try", en: "Sam folded a strip of paper into a bridge. The first bridge bent. A second fold made it stand more firmly.", st: null }, { title: "Across together", en: "The little toys met in the middle. Sam smiled. Trying again had helped a small idea become a bridge.", st: null }] },
];
