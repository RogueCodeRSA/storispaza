import { demoStory } from "../../fixtures/demo-story";
import { createOpenAIAdapter, type OpenAITransport } from "@/server/providers/adapters/openai.adapter";
import { protectProvider, type ProviderAllowanceGuard } from "@/server/providers/boundary";

export function wireStory() {
  return { title: demoStory.title, culturalAssumptions: demoStory.culturalAssumptions, characters: demoStory.characters, sharedStyle: demoStory.sharedStyle,
    pages: demoStory.pages.map(({ number, title, narrative, illustrationDescription, characterRefs, learningMoment }) => ({ number, title, narrative, illustrationDescription, characterRefs, learningMoment })) };
}
export function fakeTransport(): OpenAITransport {
  return {
    async respond(input) { return { status: "completed", output_text: JSON.stringify(input.max_output_tokens === 512 ? { status: "ready", reasons: [] } : wireStory()), model: "gpt-5.6-terra", usage: { input_tokens: 100, output_tokens: 100, input_tokens_details: { cached_tokens: 0 } } }; },
    async image() { return { data: [{ b64_json: "dGVzdA==" }], usage: { input_tokens: 100, input_tokens_details: { text_tokens: 80, image_tokens: 20 }, output_tokens: 1000 } }; },
    async transcribe() { return { text: "A fictional girl helps her neighbours.", languages: [{ code: "en" }], usage: { type: "duration", seconds: 1 } }; },
  };
}
export function contractGuard(): ProviderAllowanceGuard {
  return { reserve: async () => "test-reservation", settle: async () => {}, retainUnknown: async () => {} };
}
export function offlineLiveProvider() {
  return protectProvider(createOpenAIAdapter({ transport: fakeTransport(), idFactory: () => "00000000-0000-4000-8000-000000000099" }), contractGuard());
}
