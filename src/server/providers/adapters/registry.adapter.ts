import "server-only";
import { createMockProvider } from "./mock.adapter";
import { createDeferredAdapter } from "./deferred.adapter";
import type { StoryProvider } from "../types";

// Vendor registration is confined to the adapter directory. Neither deferred
// entry is a live integration. No credentials are read or transmitted here.
export const adapterFactories: Record<string, () => StoryProvider> = {
  mock: () => createMockProvider(),
  cloudflare: () => createDeferredAdapter("cloudflare"),
  openai: () => createDeferredAdapter("openai"),
};
