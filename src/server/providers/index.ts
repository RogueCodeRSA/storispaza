import "server-only";
import { readConfig } from "../config";
import { AppError } from "../errors";
import { adapterFactories } from "./adapters/registry.adapter";
import { protectProvider, type ProviderAllowanceGuard } from "./boundary";
import type { StoryProvider } from "./types";

export function createProvider(config = readConfig(), guard?: ProviderAllowanceGuard | ((adapter: StoryProvider) => ProviderAllowanceGuard)) {
  const id = config.AI_PROVIDER === "mock" ? "mock" : config.AI_ADAPTER;
  if (!id || !Object.hasOwn(adapterFactories, id)) throw new AppError("API_UNAVAILABLE", "Select a registered server-side adapter. No provider fallback was attempted.", 503);
  const adapter = adapterFactories[id]();
  if (adapter.mode !== config.AI_PROVIDER) throw new AppError("API_UNAVAILABLE", "Adapter mode does not match the selected mode.", 503);
  return protectProvider(adapter, typeof guard === "function" ? guard(adapter) : guard);
}
