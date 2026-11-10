import "server-only";
import { readConfig } from "../config";
import { createMockProvider } from "./mock";
import { createRealProvider } from "./real";

export function createProvider(config = readConfig()) {
  return config.AI_PROVIDER === "mock" ? createMockProvider() : createRealProvider(config.OPENAI_API_KEY);
}
