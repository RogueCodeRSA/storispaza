import "server-only";
import { AppError } from "../../errors";
import type { StoryProvider } from "../types";

// Registration placeholder only; no credential reads, SDK, prompts or HTTP calls.
export function createDeferredAdapter(id: string): StoryProvider {
  const unavailable = async (): Promise<never> => {
    throw new AppError("NOT_IMPLEMENTED", "This adapter is deferred. No API request was sent.", 503);
  };
  return {
    id, mode: "real", capabilities: { structureStory: "unavailable", transcribe: "unavailable", translate: "unavailable", checkIllustrationPrompt: "unavailable", createCharacterSheet: "unavailable", illustrate: "unavailable" },
    structureStory: unavailable, transcribe: unavailable, translate: unavailable,
    checkIllustrationPrompt: unavailable, createCharacterSheet: unavailable, illustrate: unavailable,
  };
}
