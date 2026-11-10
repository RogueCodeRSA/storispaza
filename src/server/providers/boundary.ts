import "server-only";
import { z } from "zod";
import { assetSourceSchema } from "@/domain/provenance";
import { storySchema, type Language } from "@/domain/story";
import { AppError } from "../errors";
import type { ProviderOperation, ProviderResult, StoryProvider } from "./types";

export interface ProviderAllowanceGuard {
  reserve(operation: ProviderOperation): Promise<string>;
  settle(reservation: string, usage: ProviderResult<unknown>["usage"]): Promise<void>;
  retainUnknown(reservation: string): Promise<void>;
}

const nonnegative = z.number().finite().nonnegative();
const envelopeSchema = z.object({
  providerId: z.string().min(1), provenance: z.enum(["mock-fixture", "generated"]),
  assets: z.array(assetSourceSchema),
  usage: z.object({ estimatedUsd: nonnegative, actualUsd: nonnegative.nullable(),
    tokens: z.object({ input: nonnegative.int(), output: nonnegative.int() }).nullable(),
    allowance: z.object({ unit: z.string().min(1).max(80), estimated: nonnegative, actual: nonnegative.nullable() }).nullable(),
  }),
});
const dataSchemas = {
  structureStory: storySchema,
  transcribe: z.string().min(1).max(20_000),
  translate: z.array(z.string().min(1).max(5000)).length(6),
  checkIllustrationPrompt: z.object({ status: z.enum(["needs-review", "blocked"]), reasons: z.array(z.string()) }),
  createCharacterSheet: z.object({ assetId: z.string().regex(/^[a-zA-Z0-9_-]+$/) }),
  illustrate: z.object({ assetId: z.string().regex(/^[a-zA-Z0-9_-]+$/) }),
};

export function protectProvider(adapter: StoryProvider, guard?: ProviderAllowanceGuard): StoryProvider {
  async function call<T>(operation: ProviderOperation, invoke: () => Promise<ProviderResult<T>>): Promise<ProviderResult<T>> {
    if (adapter.capabilities[operation] !== "available") throw new AppError("NOT_IMPLEMENTED", "This adapter capability is unavailable. No request was sent.", 503);
    if (adapter.mode === "real" && !guard) throw new AppError("BUDGET_EXCEEDED", "A live operation requires an explicit budget/allowance guard.", 429);
    const reservation = guard ? await guard.reserve(operation) : null;
    if (guard && (!reservation || !reservation.trim())) throw new AppError("BUDGET_EXCEEDED", "The allowance guard did not issue a valid reservation.", 429);
    try {
      const result = await invoke();
      const envelope = envelopeSchema.safeParse(result);
      if (!envelope.success) throw new AppError("INVALID_PROVIDER_RESPONSE", "Invalid provider envelope.", 502);
      const data = dataSchemas[operation].safeParse(result.data);
      if (!data.success) throw new AppError("INVALID_PROVIDER_RESPONSE", "Invalid provider data.", 502);
      const validated: ProviderResult<T> = { ...envelope.data, data: data.data as T };
      const expectedAssets = operation === "checkIllustrationPrompt" ? 0 : operation === "structureStory" || operation === "translate" ? 6 : 1;
      if (validated.providerId !== adapter.id ||
        validated.assets.length !== expectedAssets || new Set(validated.assets.map(asset => asset.assetId)).size !== expectedAssets ||
        (adapter.mode === "real" && (validated.provenance !== "generated" || validated.assets.some(asset => asset.providerId !== adapter.id || asset.origin !== "generated"))) ||
        (adapter.mode === "mock" && validated.provenance !== "mock-fixture") ||
        (adapter.mode === "real" && validated.usage.estimatedUsd === 0 && validated.usage.actualUsd === 0 && !validated.usage.allowance)) {
        throw new AppError("INVALID_PROVIDER_RESPONSE", "The provider response did not satisfy the shared contract.", 502);
      }
      if (operation === "structureStory") {
        const story = storySchema.parse(validated.data);
        if (story.pages.some(page => !validated.assets.some(asset => JSON.stringify(asset) === JSON.stringify(page.assetSources.text)))) throw new AppError("INVALID_PROVIDER_RESPONSE", "Story text sources do not match operation provenance.", 502);
      }
      if (operation === "illustrate" || operation === "createCharacterSheet") {
        const asset = dataSchemas.illustrate.parse(validated.data);
        if (validated.assets[0].assetId !== asset.assetId) throw new AppError("INVALID_PROVIDER_RESPONSE", "Asset ID does not match its source.", 502);
      }
      if (reservation && guard) {
        if (validated.usage.actualUsd === null || validated.usage.allowance?.actual === null) await guard.retainUnknown(reservation);
        else await guard.settle(reservation, validated.usage);
      }
      return structuredClone(validated);
    } catch (error) {
      if (reservation && guard) await guard.retainUnknown(reservation);
      // Never forward SDK errors, raw response bodies, prompts, keys or transcripts.
      const code = error instanceof AppError ? error.code : "API_UNAVAILABLE";
      const status = error instanceof AppError ? error.status : 503;
      throw new AppError(code, "The provider operation could not complete. No fallback was used.", status);
    }
  }
  function checkTranscription(language: Language, consent: boolean) {
    if (!consent) throw new AppError("CONSENT_REQUIRED", "Explicit API transmission consent is required.");
    if (language !== "en") throw new AppError("INVALID_INPUT", "Only English transcription is enabled by the product language policy.");
  }
  return {
    id: adapter.id, mode: adapter.mode, capabilities: { ...adapter.capabilities },
    structureStory: input => call("structureStory", () => adapter.structureStory(input)),
    transcribe: async input => { checkTranscription(input.language, input.apiConsent); return call("transcribe", () => adapter.transcribe(input)); },
    translate: (story, target) => call("translate", () => adapter.translate(story, target)),
    checkIllustrationPrompt: prompt => call("checkIllustrationPrompt", () => adapter.checkIllustrationPrompt(prompt)),
    createCharacterSheet: story => call("createCharacterSheet", () => adapter.createCharacterSheet(story)),
    illustrate: input => call("illustrate", () => adapter.illustrate(input)),
  };
}
