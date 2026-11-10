import { expect, it } from "vitest";
import { defineProviderContract } from "./contracts/provider-contract";
import { adapterFactories } from "@/server/providers/adapters/registry.adapter";
import { createMockProvider } from "@/server/providers/adapters/mock.adapter";
import { createProvider } from "@/server/providers";
import { protectProvider } from "@/server/providers/boundary";
import { readConfig } from "@/server/config";
import { offlineLiveProvider } from "./helpers/live-provider";

const cases = {
  mock: () => protectProvider(createMockProvider(0)),
  cloudflare: () => createProvider(readConfig({ AI_PROVIDER: "real", AI_ADAPTER: "cloudflare" })),
  openai: offlineLiveProvider,
};
it("requires a contract-test factory for every registered adapter", () => {
  expect(Object.keys(cases).sort()).toEqual(Object.keys(adapterFactories).sort());
});
for (const [id, create] of Object.entries(cases)) defineProviderContract(id, create);
