import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import env from "@next/env";
import { expect, it } from "vitest";
import { createOpenAIAdapter } from "@/server/providers/adapters/openai.adapter";
import { protectProvider } from "@/server/providers/boundary";
import { openDatabase } from "@/server/storage";
import { accountForAccessChecks, createDollarGuard } from "@/server/allowance";
import { validateCaptureWav } from "@/domain/capture";

// A single sequential test: if text access fails, audio is never attempted.
// This opt-in report contains usage/producer metadata only, never content.
it.skipIf(process.env.RUN_PAID_TESTS !== "1")("paid M2 text and synthetic English audio smoke", async () => {
  env.loadEnvConfig(process.cwd(), true, { info() {}, error() {} });
  if (process.env.CI) throw new Error("Paid tests must not run in hosted CI.");
  if (!process.env.PAID_TEST_AUDIO_PATH) throw new Error("Set an explicit synthetic English WAV path before opting in.");
  if (!process.env.OPENAI_API_KEY?.trim()) throw new Error("Local credential was not loaded; no paid request was sent.");
  const bytes = new Uint8Array(readFileSync(resolve(process.env.PAID_TEST_AUDIO_PATH)));
  validateCaptureWav(bytes);
  const db = openDatabase(process.env.DATA_DIR || "./data");
  const adapter = createOpenAIAdapter();
  accountForAccessChecks(db);
  const provider = protectProvider(adapter, createDollarGuard(db, randomUUID(), adapter, { sessionUsd: .25, developmentUsd: 10, requestsPerMinute: 2 }));
  try {
    const story = await provider.structureStory({ idea: "A fictional child helps a teacher share books with a classroom. Emphasize cooperation and curiosity.", culturalContext: "Fictional South African classroom; no traditional practices asserted", educationalObjective: "Cooperation and reading", sourceLanguage: "en" });
    console.log(JSON.stringify({ paidSmoke: "structureStory", producer: story.providerId, model: story.assets[0].model, usage: story.usage, invoiceVerified: false }));
    expect(story.data.pages).toHaveLength(6); expect(story.usage.tokens).not.toBeNull(); expect(story.usage.actualUsd).not.toBeNull();
    const audio = await provider.transcribe({ bytes, language: "en", apiConsent: true });
    console.log(JSON.stringify({ paidSmoke: "transcribe", producer: audio.providerId, model: audio.assets[0].model, usage: audio.usage, invoiceVerified: false }));
    expect(audio.data.length).toBeGreaterThan(3);
    // Assert only a boolean: failure output must never print the transcript.
    expect(/child|book|teacher|class/i.test(audio.data)).toBe(true);
  } catch (error) {
    const safe = error as { code?: string; status?: number };
    console.log(JSON.stringify({ paidSmoke: "stopped", code: safe.code ?? "UNKNOWN", status: safe.status ?? null, retry: false }));
    throw error;
  } finally { bytes.fill(0); db.close(); }
}, 120_000);
