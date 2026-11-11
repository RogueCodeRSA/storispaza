import { z } from "zod";
import { assetSourceSchema } from "./provenance";
import { storySchema, type Story } from "./story";

export const clipIdSchema = z.string().regex(/^(en|st)-(page-0[1-6]|word-0[1-3]|opening|response|continuation)$/);
const source = assetSourceSchema.nullable();
export const scriptSchema = z.object({ id: clipIdSchema, language: z.enum(["en", "st"]), kind: z.enum(["page", "word", "opening", "response", "continuation"]), page: z.number().int().min(1).max(6).nullable(),
  maxSeconds: z.number().positive().max(60), text: z.string().max(5000), version: z.number().int().nonnegative(), status: z.enum(["unreviewed", "machine-translated", "edited", "approved"]), source, history: z.array(assetSourceSchema), flags: z.array(z.string().max(1500)).max(30),
  recordingHistory: z.array(assetSourceSchema).default([]),
  clip: z.object({ id: z.uuid(), scriptVersion: z.number().int(), sha256: z.string().length(64), seconds: z.number().positive().max(60), approved: z.boolean(), adultOwnVoice: z.literal(true) }).nullable(),
});
export const speechProjectSchema = z.object({ id: z.uuid(), revision: z.number().int().nonnegative(), mode: z.enum(["mock", "real"]), story: storySchema,
  scripts: z.array(scriptSchema).length(24), corrections: z.array(z.object({ id: z.uuid(), at: z.string(), slot: clipIdSchema, before: z.string().max(5000), after: z.string().max(5000) })),
  translated: z.boolean(), translationAttempted: z.boolean().default(false), frozen: z.boolean(), redistributionConsent: z.boolean(), includeCorrections: z.boolean(), usage: z.object({ actualUsd: z.number().nullable(), tokens: z.object({ input: z.number(), output: z.number() }).nullable() }).nullable(),
});
export type SpeechProject = z.infer<typeof speechProjectSchema>;
export type SpeechScript = z.infer<typeof scriptSchema>;
export function recordApprovedCreatorSelections(project: SpeechProject): void {
  for (const script of project.scripts) if (script.kind !== "page" && script.status === "approved" && !script.source) {
    script.source = { assetId: `creator-selection-${project.id}-${script.id}-v${script.version}`, providerId: "creator", model: null, origin: "creator", editedByCreator: false };
  }
}
export const scienceReviewTopics = ["Power interruption/load-shedding, imagined glow, fiction versus real life", "Battery learning kit, wall socket/mains, loose wire", "Switch, complete circuit, electric current", "Imaginary adventure, safe rechargeable lamps", "Charged lamps, families reading together, imagined glow", "Curiosity, neighbours, cooperation"];

export function initialSpeechProject(story: Story, id: string, mode: "mock" | "real"): SpeechProject {
  const scripts: SpeechScript[] = [];
  for (const language of ["en", "st"] as const) {
    for (let index = 0; index < 6; index++) scripts.push({ id: `${language}-page-0${index + 1}`, language, kind: "page", page: index + 1, maxSeconds: language === "en" ? 45 : 60,
      text: language === "en" ? story.pages[index].narrative : "", version: 0, status: "unreviewed", source: language === "en" ? story.pages[index].assetSources.text : null, history: [], recordingHistory: [], flags: [scienceReviewTopics[index]], clip: null });
    for (let index = 0; index < 3; index++) scripts.push({ id: `${language}-word-0${index + 1}`, language, kind: "word", page: null, maxSeconds: 5,
      text: language === "en" ? ["light", "story", "electricity"][index] : "", version: 0, status: "unreviewed", source: null, history: [], recordingHistory: [], flags: ["Creator-selected concept; confirm exact wording and pronunciation."], clip: null });
    for (const kind of ["opening", "response", "continuation"] as const) scripts.push({ id: `${language}-${kind}`, language, kind, page: null, maxSeconds: kind === "continuation" ? 10 : 8,
      text: "", version: 0, status: "unreviewed", source: null, history: [], recordingHistory: [], flags: ["Creator must supply this exact phrase. No traditional wording is inferred."], clip: null });
  }
  return speechProjectSchema.parse({ id, revision: 0, mode, story: { ...story, visibility: "private", sharingConsent: false, pages: story.pages.map(page => ({ ...page, translation: null, narrationAssetIds: { en: null, st: null }, approvals: { text: false, illustration: false, audio: false } })) }, scripts, corrections: [], translated: false, frozen: false, redistributionConsent: false, includeCorrections: false, usage: null });
}
export function speechFreezeIssues(project: SpeechProject): string[] {
  const issues: string[] = [];
  if (project.mode !== "real") issues.push("Mock rehearsals cannot freeze genuine fixture approvals.");
  if (!project.translated) issues.push("Generate real draft translations before freezing.");
  for (const script of project.scripts) {
    if (!script.text.trim() || script.status !== "approved") issues.push(`${script.id}: approve current script.`);
    if (!script.clip?.approved || script.clip.scriptVersion !== script.version) issues.push(`${script.id}: record, listen and approve the current clip.`);
  }
  for (const page of project.story.pages) if (!page.approvals.text || !page.approvals.illustration || page.translation?.status !== "approved") issues.push(`Page ${page.number}: review English, image association and Sesotho.`);
  return issues;
}
