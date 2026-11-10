import "server-only";
import { z } from "zod";

const envSchema = z.object({
  AI_PROVIDER: z.enum(["mock", "real"]).default("mock"),
  OPENAI_API_KEY: z.string().optional(),
  DATA_DIR: z.string().min(1).default("./data"),
  SESSION_BUDGET_USD: z.coerce.number().positive().max(2).default(2),
  DEVELOPMENT_BUDGET_USD: z.coerce.number().positive().max(10).default(10),
  AI_REQUESTS_PER_MINUTE: z.coerce.number().int().positive().max(10).default(10),
});
export function readConfig(env: Record<string, string | undefined> = process.env) { return envSchema.parse(env); }
