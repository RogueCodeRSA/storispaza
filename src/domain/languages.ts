import type { Language } from "./story";

export interface LanguagePack {
  code: Language;
  label: string;
  translationReview: "required";
  transcription: "experimental-english" | "manual-only";
  narration: "creator-recorded";
  callAndResponse: null; // Creator supplies and approves phrases during M4.
}
export const languagePacks: Record<Language, LanguagePack> = {
  en: { code: "en", label: "English", translationReview: "required", transcription: "experimental-english", narration: "creator-recorded", callAndResponse: null },
  st: { code: "st", label: "Sesotho", translationReview: "required", transcription: "manual-only", narration: "creator-recorded", callAndResponse: null },
};
