import "server-only";
import { AppError } from "../errors";
import type { StoryProvider } from "./types";

// M0 boundary only. Do not send paid requests until the respective milestone
// adds validated prompts, safety checks, reservations and opt-in integration tests.
export function createRealProvider(apiKey?: string): StoryProvider {
  if (!apiKey?.trim()) throw new AppError("API_UNAVAILABLE", "Real mode requires a server-side API key. Mock mode needs no key.", 503);
  const unavailable = async (): Promise<never> => {
    throw new AppError("NOT_IMPLEMENTED", "Real provider operations are not enabled in M0. No API request was sent.", 503);
  };
  return {
    mode: "real", structureStory: unavailable, transcribe: unavailable, translate: unavailable,
    checkIllustrationPrompt: unavailable, createCharacterSheet: unavailable, illustrate: unavailable,
  };
}
