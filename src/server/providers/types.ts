import type { Language, Story, StoryPage } from "@/domain/story";

export interface StoryInput {
  idea: string;
  culturalContext: string;
  educationalObjective: string;
  sourceLanguage: Language;
}
export interface ProviderResult<T> {
  data: T;
  provenance: "mock-fixture" | "openai";
  usage: { estimatedUsd: number; actualUsd: number | null };
}
export interface IllustrationInput { page: StoryPage; characterSheetAssetId: string; sharedStyle: string; culturalContext: string }
export interface StoryProvider {
  readonly mode: "mock" | "real";
  structureStory(input: StoryInput): Promise<ProviderResult<Story>>;
  transcribe(input: { bytes: Uint8Array; language: Language; apiConsent: boolean }): Promise<ProviderResult<string>>;
  translate(story: Story, target: Language): Promise<ProviderResult<string[]>>;
  checkIllustrationPrompt(prompt: string): Promise<ProviderResult<{ status: "needs-review" | "blocked"; reasons: string[] }>>;
  createCharacterSheet(story: Story): Promise<ProviderResult<{ assetId: string }>>;
  illustrate(input: IllustrationInput): Promise<ProviderResult<{ assetId: string }>>;
}
