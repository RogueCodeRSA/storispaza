import type { Language } from "./story";
import type { SpeechProject, SpeechScript } from "./speech";

export interface ReaderTrack { id: string; url: string; seconds: number; provisional: boolean }
export interface ReaderText { text: string; reviewed: boolean; flags: string[]; audio: ReaderTrack | null }
export interface ReaderPage { number: number; title: string; imageUrl: string; imageReviewed: boolean; text: Record<Language, ReaderText> }
export interface ReaderWord { slot: string; text: string | null; audio: ReaderTrack | null }
export interface ReaderBook {
  mode: "mock" | "real"; revision: number; title: string;
  scriptsApproved: number; clipsApproved: number; pages: ReaderPage[];
  vocabulary: Record<Language, ReaderWord[]>;
  interaction: Record<Language, Record<"opening" | "response" | "continuation", ReaderText>>;
}
export function currentReaderClip(script: SpeechScript): boolean {
  return script.status === "approved" && !!script.text.trim() && !!script.clip?.approved && script.clip.scriptVersion === script.version;
}
// Read-only projection: no correction journal, raw blobs, private session IDs,
// consent mutation or inferred approval is sent to the reader.
export function readerBook(project: SpeechProject): ReaderBook {
  const script = (id: string) => { const value = project.scripts.find(item => item.id === id); if (!value) throw new Error("Missing reader script."); return value; };
  const audio = (value: SpeechScript): ReaderTrack | null => currentReaderClip(value) ? { id: value.clip!.id, url: `/api/reader?clip=${value.clip!.id}`, seconds: value.clip!.seconds, provisional: project.mode === "mock" } : null;
  const text = (value: SpeechScript): ReaderText => ({ text: value.text, reviewed: project.mode === "real" && value.status === "approved", flags: value.flags, audio: audio(value) });
  const vocabulary = (language: Language) => [1, 2, 3].map(number => { const value = script(`${language}-word-0${number}`); return { slot: value.id, text: value.status === "approved" && value.text.trim() ? value.text : null, audio: audio(value) }; });
  const interaction = (language: Language) => ({ opening: text(script(`${language}-opening`)), response: text(script(`${language}-response`)), continuation: text(script(`${language}-continuation`)) });
  return {
    mode: project.mode, revision: project.revision, title: project.story.title,
    scriptsApproved: project.scripts.filter(value => value.status === "approved").length,
    clipsApproved: project.scripts.filter(currentReaderClip).length,
    pages: project.story.pages.map(page => ({ number: page.number, title: page.title, imageUrl: `/api/reader?image=${page.number}`, imageReviewed: project.mode === "real" && page.approvals.illustration,
      text: { en: text(script(`en-page-0${page.number}`)), st: text(script(`st-page-0${page.number}`)) } })),
    vocabulary: { en: vocabulary("en"), st: vocabulary("st") }, interaction: { en: interaction("en"), st: interaction("st") },
  };
}
