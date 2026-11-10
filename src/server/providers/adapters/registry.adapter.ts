import "server-only";
import { createMockProvider } from "./mock.adapter";
import { createDeferredAdapter } from "./deferred.adapter";
import type { StoryProvider } from "../types";
import { createOpenAIAdapter } from "./openai.adapter";

// Vendor registration is confined to this directory. Cloudflare remains
// deferred; credentials are loaded lazily only by the selected live adapter.
export const adapterFactories: Record<string, () => StoryProvider> = {
  mock: () => createMockProvider(),
  cloudflare: () => createDeferredAdapter("cloudflare"),
  openai: () => createOpenAIAdapter(),
};
