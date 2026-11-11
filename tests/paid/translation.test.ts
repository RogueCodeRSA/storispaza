import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { expect, it } from "vitest";
import { newMockDraft } from "@/domain/mock-journey";
import { readConfig } from "@/server/config";
import { openDatabase } from "@/server/storage";
import { accountForAccessChecks, createDollarGuard } from "@/server/allowance";
import { createProvider } from "@/server/providers";
import { narrativeDigest } from "@/server/speech-service";
it.skipIf(process.env.RUN_PAID_TRANSLATION !== "1")("one bounded real six-page Sesotho draft, no approvals or speech", async () => {
  if (process.env.CI) throw new Error("Local opt-in only.");
  const config = readConfig({ ...process.env, AI_PROVIDER: "real", ENABLE_LIVE_AI: "1", SESSION_BUDGET_USD: String(Math.min(.25, Number(process.env.SESSION_BUDGET_USD ?? 2))) });
  const seed = join(config.DATA_DIR, "m4-translation-draft.json"); const marker = ".tools/m4-translation-attempt.json";
  if (existsSync(seed) || existsSync(marker)) throw new Error("A translation attempt exists; review it instead of repeating it.");
  const db = openDatabase(config.DATA_DIR); const session = randomUUID(); accountForAccessChecks(db);
  mkdirSync(".tools", { recursive: true }); writeFileSync(marker, JSON.stringify({ session, state: "pending", approved: false }));
  try {
    const provider = createProvider(config, adapter => createDollarGuard(db, session, adapter, { sessionUsd: config.SESSION_BUDGET_USD, developmentUsd: config.DEVELOPMENT_BUDGET_USD, requestsPerMinute: config.AI_REQUESTS_PER_MINUTE }, config.IMAGE_ATTEMPT_LIMIT));
    const story = newMockDraft().story; const result = await provider.translate(story, "st");
    writeFileSync(seed, JSON.stringify({ sourceDigest: narrativeDigest(story), result }, null, 2));
    writeFileSync(marker, JSON.stringify({ session, state: "draft-ready-unreviewed", approved: false, usage: result.usage, notes: result.reviewNotes?.length ?? 0 }, null, 2));
    console.log(JSON.stringify({ operation: "translate", usage: result.usage, producer: result.providerId, model: result.assets[0].model, approval: false, syntheticSpeech: false, invoiceVerified: false }));
    expect(Boolean(result.usage.tokens && result.usage.actualUsd !== null && result.reviewNotes?.length)).toBe(true);
  } finally { db.close(); }
}, 90000);
