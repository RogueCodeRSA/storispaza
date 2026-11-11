import { z } from "zod";
import { demoStory } from "../../fixtures/demo-story";
import { storySchema, type Story, type StoryPage } from "./story";
import { fixtureSource, sourceLabel } from "./provenance";
import { reviewedImageFixtures, reviewedFixtureImage, reviewedPageImage } from "./image-pack";

const sixFlags = z.array(z.boolean()).length(6);
export const mockDraftSchema = z.object({
  format: z.literal("storispaza-mock-draft-v1"),
  idea: z.string().max(3000),
  story: storySchema,
  acknowledgements: z.object({ text: sixFlags, images: sixFlags, translations: sixFlags }),
  imageRevisions: z.array(z.number().int().min(0).max(1000)).length(6),
  culturalAcknowledgement: z.boolean().default(false),
  recordingCopy: z.boolean(),
});
export type MockDraft = z.infer<typeof mockDraftSchema>;
export type Acknowledgement = keyof MockDraft["acknowledgements"];
export type PageField = "title" | "narrative" | "illustrationDescription" | "learningMoment";
export const DRAFT_KEY = "storispaza-mock-draft-v1";
export const PROVISIONAL = "Provisional / unreviewed";

export function newMockDraft(): MockDraft {
  const story = structuredClone(demoStory);
  story.pages.forEach(page => {
    const image = reviewedImageFixtures.find(image => image.page === page.number);
    if (image) { page.illustrationAssetId = image.source.assetId; page.assetSources.illustration = structuredClone(image.source); page.assetHistory = structuredClone(image.history); }
    page.translation = { text: `[Sesotho placeholder for page ${page.number}. Creator translation pending.]`, status: "machine-translated" };
    page.assetSources.translation = fixtureSource(`demo-translation-${page.number}`, "local-placeholder");
    page.assetSources.narration = { en: fixtureSource("demo-tone-en", "local-placeholder"), st: fixtureSource("demo-tone-st", "local-placeholder") };
  });
  return {
    format: "storispaza-mock-draft-v1", idea: "A girl from Soweto uses an imaginary power to help her community.", story,
    acknowledgements: { text: Array(6).fill(false), images: Array(6).fill(false), translations: Array(6).fill(false) },
    imageRevisions: Array(6).fill(0), culturalAcknowledgement: false, recordingCopy: false,
  };
}

export function updateMockPage(draft: MockDraft, index: number, field: PageField, value: string): MockDraft {
  const next = structuredClone(draft);
  const page = next.story.pages[index];
  if (!page) throw new Error("Choose a page from 1 to 6.");
  next.story.pages[index] = { ...page, [field]: value, approvals: { text: false, illustration: false, audio: false },
    assetSources: { ...page.assetSources, text: { ...page.assetSources.text, editedByCreator: field !== "illustrationDescription" || page.assetSources.text.editedByCreator } },
    translation: field === "narrative" && page.translation ? { ...page.translation, status: "machine-translated" } : page.translation };
  if (field !== "illustrationDescription") next.acknowledgements.text[index] = false;
  next.acknowledgements.images[index] = false;
  if (field === "narrative") next.acknowledgements.translations[index] = false;
  return next;
}

export function updateMockTranslation(draft: MockDraft, index: number, text: string): MockDraft {
  const next = structuredClone(draft);
  if (!next.story.pages[index]) throw new Error("Choose a page from 1 to 6.");
  next.story.pages[index].translation = { text, status: "edited" };
  const previousSource = next.story.pages[index].assetSources.translation;
  next.story.pages[index].assetSources.translation = previousSource
    ? { ...previousSource, editedByCreator: true }
    : { assetId: `creator-translation-${index + 1}`, providerId: "creator", model: null, origin: "creator", editedByCreator: true };
  next.story.pages[index].approvals.audio = false;
  next.acknowledgements.translations[index] = false;
  return next;
}

export function regenerateMockImage(draft: MockDraft, index: number): MockDraft {
  const next = structuredClone(draft);
  if (!next.story.pages[index]) throw new Error("Choose a page from 1 to 6.");
  next.imageRevisions[index] = (next.imageRevisions[index] + 1) % 1001;
  // A simulated request creates no pixels. Keep the actual approved source rather
  // than replacing its identity with an icon; current draft review still resets.
  next.story.pages[index].approvals.illustration = false;
  next.acknowledgements.images[index] = false;
  return next;
}

// Editing remains permissive; persistence validates the finished form and never
// upgrades fixture provenance or content-review status.
export function normalizeMockDraft(input: unknown): MockDraft {
  const draft = mockDraftSchema.parse(input);
  draft.story.assumptionsConfirmed = false;
  draft.story.pages.forEach(page => {
    page.provenance = "provisional-fixture";
    page.approvals = { text: false, illustration: false, audio: false };
    page.narrationAssetIds = { en: null, st: null };
    if (page.translation?.status === "approved") page.translation.status = "edited";
    if (page.illustrationAssetId === "provisional-placeholder" || /^mock-image-\d-r\d+$/.test(page.illustrationAssetId ?? "")) {
      if (page.assetSources.illustration) page.assetHistory.push(page.assetSources.illustration);
      const image = reviewedPageImage(page.number);
      page.illustrationAssetId = image.source.assetId; page.assetSources.illustration = structuredClone(image.source);
      draft.acknowledgements.images[page.number - 1] = false;
    }
  });
  return draft;
}

export function demoExportIssues(draft: MockDraft): string[] {
  const issues: string[] = [];
  if (!mockDraftSchema.safeParse(draft).success) issues.push("Complete all six page fields before saving or exporting.");
  if (Object.values(draft.acknowledgements).some(flags => flags.some(flag => !flag))) issues.push("Acknowledge the text, image and translation placeholders on all six pages.");
  if (!draft.culturalAcknowledgement) issues.push("Confirm that you understand the cultural details still need review.");
  if (draft.story.visibility === "shared" && !draft.story.sharingConsent) issues.push("Consent to distributing this provisional demo export.");
  return issues;
}

export function mockExportJson(draft: MockDraft): string {
  if (demoExportIssues(draft).length) throw new Error(demoExportIssues(draft).join(" "));
  return JSON.stringify({ ...normalizeMockDraft(draft), reviewStatus: "provisional-unreviewed", attribution: "Offline fixture replay; original asset source metadata identifies real-generated image fixtures where present. Codex-assisted English draft, Sesotho slots and non-speech tones remain provisional. No live generation during replay or verified Sesotho.", recordingCopy: false }, null, 2);
}

export function mockReaderHtml(draft: MockDraft): string {
  if (demoExportIssues(draft).length) throw new Error(demoExportIssues(draft).join(" "));
  const story = normalizeMockDraft(draft).story;
  const escape = (value: string) => value.replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);
  return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:"><title>${escape(story.title)}</title><style>body{max-width:48rem;margin:auto;padding:1.5rem;font:1.15rem/1.7 system-ui;background:#faf5e9;color:#203e35}article{border-top:2px solid;padding-block:1.5rem}img{max-width:100%;height:auto}p{white-space:pre-wrap}.badge{font-weight:bold;color:#92351f}h1,h2{line-height:1.2}</style><h1>${escape(story.title)}</h1><details><summary>Review status <span class="badge">Language review pending</span></summary><p>PROVISIONAL / UNREVIEWED — mock demo, not an approved publication.</p><p>Codex-assisted draft. Original image fixtures may be creator-reviewed; this edited draft, Sesotho text and narration still require review. No audio or recording copies included.</p></details>${story.pages.map(page => `<article><h2>Page ${page.number}: ${escape(page.title)}</h2>${reviewedFixtureImage(page.illustrationAssetId) ? `<img alt="Page ${page.number} reviewed image source; draft unreviewed" src="${reviewedFixtureImage(page.illustrationAssetId)}">` : ""}<p>${escape(page.narrative)}</p><h3>Sesotho</h3><p lang="st">${escape(page.translation?.text ?? "Creator translation pending")}</p><p><strong>Learning moment:</strong> ${escape(page.learningMoment)}</p><p>Illustration description: ${escape(page.illustrationDescription)}</p><p>Sources — text: ${escape(sourceLabel(page.assetSources.text))}; image: ${escape(sourceLabel(page.assetSources.illustration))}; translation: ${escape(sourceLabel(page.assetSources.translation))}.</p><p>Earlier asset sources: ${escape(page.assetHistory.map(sourceLabel).join("; ") || "None recorded")}.</p></article>`).join("")}</html>`;
}

export function setMockMetadata(draft: MockDraft, field: "title" | "culturalContext" | "educationalObjective", value: string): MockDraft {
  const story: Story = { ...draft.story, [field]: value, assumptionsConfirmed: field === "culturalContext" ? false : draft.story.assumptionsConfirmed };
  return { ...draft, story, culturalAcknowledgement: false, acknowledgements: { text: Array(6).fill(false), images: Array(6).fill(false), translations: Array(6).fill(false) } };
}

export function pageText(page: StoryPage, language: "en" | "st"): string {
  return language === "en" ? page.narrative : page.translation?.text || "[Sesotho text pending — provisional / unreviewed]";
}
