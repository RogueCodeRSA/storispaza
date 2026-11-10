import type { Language, Story, StoryPage } from "@/domain/story";
import type { AssetSource } from "@/domain/provenance";

export interface StoryInput {
  idea: string;
  culturalContext: string;
  educationalObjective: string;
  sourceLanguage: Language;
  title?: string;
}
export interface ProviderResult<T> {
  data: T;
  provenance: "mock-fixture" | "generated";
  providerId: string;
  assets: AssetSource[];
  usage: {
    estimatedUsd: number; actualUsd: number | null;
    tokens: { input: number; output: number } | null;
    allowance: { unit: string; estimated: number; actual: number | null } | null;
  };
}
export interface IllustrationInput { page: StoryPage; characterSheetAssetId: string; sharedStyle: string; culturalContext: string }
export interface StoryProvider {
  readonly id: string;
  readonly mode: "mock" | "real";
  readonly capabilities: Record<ProviderOperation, "available" | "unavailable" | "unsupported">;
  readonly operationEstimates?: Partial<Record<ProviderOperation, number>>;
  structureStory(input: StoryInput): Promise<ProviderResult<Story>>;
  transcribe(input: { bytes: Uint8Array; language: Language; apiConsent: boolean }): Promise<ProviderResult<string>>;
  translate(story: Story, target: Language): Promise<ProviderResult<string[]>>;
  checkIllustrationPrompt(prompt: string): Promise<ProviderResult<{ status: "needs-review" | "blocked"; reasons: string[] }>>;
  createCharacterSheet(story: Story): Promise<ProviderResult<{ assetId: string }>>;
  illustrate(input: IllustrationInput): Promise<ProviderResult<{ assetId: string }>>;
}
export type ProviderOperation = "structureStory" | "transcribe" | "translate" | "checkIllustrationPrompt" | "createCharacterSheet" | "illustrate";
