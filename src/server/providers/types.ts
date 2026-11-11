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
    imageTokens?: { textInput: number; imageInput: number; imageOutput: number };
    allowance: { unit: string; estimated: number; actual: number | null } | null;
  };
}
export interface ImageAsset { assetId: string; imageBase64?: string; mimeType?: "image/webp" }
export interface IllustrationInput { page: StoryPage; characterSheetAssetId: string; sharedStyle: string; culturalContext: string; prompt?: string; referenceImageBase64?: string }
export interface StoryProvider {
  readonly id: string;
  readonly mode: "mock" | "real";
  readonly capabilities: Record<ProviderOperation, "available" | "unavailable" | "unsupported">;
  readonly operationEstimates?: Partial<Record<ProviderOperation, number>>;
  structureStory(input: StoryInput): Promise<ProviderResult<Story>>;
  transcribe(input: { bytes: Uint8Array; language: Language; apiConsent: boolean }): Promise<ProviderResult<string>>;
  translate(story: Story, target: Language): Promise<ProviderResult<string[]>>;
  checkIllustrationPrompt(prompt: string): Promise<ProviderResult<{ status: "ready" | "needs-review" | "blocked"; reasons: string[] }>>;
  createCharacterSheet(story: Story, prompt?: string): Promise<ProviderResult<ImageAsset>>;
  illustrate(input: IllustrationInput): Promise<ProviderResult<ImageAsset>>;
}
export type ProviderOperation = "structureStory" | "transcribe" | "translate" | "checkIllustrationPrompt" | "createCharacterSheet" | "illustrate";
