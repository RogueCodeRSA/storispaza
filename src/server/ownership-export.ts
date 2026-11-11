import "server-only";
import type { SpeechProject } from "@/domain/speech";
import type { Ownership } from "@/domain/ownership";
import { ownershipExplanation } from "@/domain/ownership";
import { reviewedFixtureImage } from "@/domain/image-pack";
import { currentReaderClip } from "@/domain/reader";

export function publicationBundle(project: SpeechProject, ownership: Ownership, audio: Record<string, string>) {
  return {
    format: "storispaza-story-v1", exportedAt: new Date().toISOString(),
    id: project.story.id, title: project.story.title, creator: ownership.creator, visibility: ownership.visibility,
    edition: { sourceRevision: project.revision, finalApproved: true, sharingConsent: ownership.sharingConsent, assumptionsConfirmed: ownership.assumptionsConfirmed },
    ageGroup: project.story.ageGroup, sourceLanguage: project.story.sourceLanguage, characters: project.story.characters, sharedStyle: project.story.sharedStyle,
    ownership: ownershipExplanation, rawSourceRecordingsIncluded: false,
    culturalContext: project.story.culturalContext, culturalAssumptions: project.story.culturalAssumptions, educationalObjective: project.story.educationalObjective,
    attribution: "AI-assisted story. Human review is recorded for this edition; it is not a guarantee of cultural, language or scientific accuracy. Per-asset sources and history are preserved below.",
    pages: project.story.pages.map(page => ({ number: page.number, title: page.title, narrative: page.narrative,
      translation: page.translation, learningMoment: page.learningMoment, illustrationDescription: page.illustrationDescription, characterRefs: page.characterRefs,
      image: reviewedFixtureImage(page.illustrationAssetId),
      narration: Object.fromEntries((["en", "st"] as const).map(language => {
        const script = project.scripts.find(value => value.id === `${language}-page-0${page.number}`)!;
        return [language, currentReaderClip(script) ? audio[script.id] ?? null : null];
      })),
      provenance: { classification: page.provenance, sources: page.assetSources, history: page.assetHistory,
        scripts: project.scripts.filter(script => script.page === page.number).map(script => ({ language: script.language, source: script.source, history: script.history, recordingHistory: script.recordingHistory })) },
      approvals: { text: page.approvals.text, illustration: page.approvals.illustration, translation: page.translation?.status === "approved" },
    })),
  };
}
export type PublicationBundle = ReturnType<typeof publicationBundle>;
const escape = (value: string) => value.replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!);
export function publicationHtml(bundle: PublicationBundle): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; media-src data:; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'"><title>${escape(bundle.title)}</title><style>body{font:1.2rem/1.7 system-ui,sans-serif;color:#222;background:#fff9ec;margin:auto;padding:1rem;max-width:60rem}img{width:100%;max-width:36rem;height:auto}article{border-top:2px solid #8b4428;margin-top:2rem;padding-top:1rem}nav{display:flex;gap:1rem;flex-wrap:wrap}a{color:#743219;padding:.7rem}p{white-space:pre-wrap;overflow-wrap:anywhere}audio{max-width:100%}summary{cursor:pointer;padding:.8rem}pre{white-space:pre-wrap;overflow-wrap:anywhere;font-size:.85rem}</style></head><body><header><p>StoriSpaza · ${escape(bundle.visibility)} manual export</p><h1>${escape(bundle.title)}</h1><p>By ${escape(bundle.creator)}</p><p>${escape(bundle.attribution)}</p><details><summary>Your story and ownership</summary><p>${escape(bundle.ownership)}</p></details></header><nav aria-label="Story pages">${bundle.pages.map(page => `<a href="#page-${page.number}">Page ${page.number}</a>`).join("")}</nav><main>${bundle.pages.map(page => `<article id="page-${page.number}"><h2>${page.number}. ${escape(page.title)}</h2><img src="${page.image}" alt="${escape(`Story illustration: ${page.title}`)}"><h3>English</h3><p lang="en">${escape(page.narrative)}</p>${page.narration.en ? `<audio controls preload="none" aria-label="English page ${page.number}" src="${page.narration.en}"></audio>` : "<p>Text-only · narration not included.</p>"}<h3>Sesotho</h3><p lang="st">${escape(page.translation!.text)}</p>${page.narration.st ? `<audio controls preload="none" aria-label="Sesotho page ${page.number}" src="${page.narration.st}"></audio>` : "<p>Text-only · narration not included.</p>"}<p>Learning moment: ${escape(page.learningMoment)}</p><details><summary>Page attribution and provenance</summary><pre>${escape(JSON.stringify(page.provenance, null, 2))}</pre></details></article>`).join("")}</main><footer><p>Private by default. No public URL or gallery. Raw source recordings excluded.</p></footer></body></html>`;
}
