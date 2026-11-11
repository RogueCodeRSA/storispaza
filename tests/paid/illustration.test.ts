import { randomUUID } from "node:crypto";
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { expect, it } from "vitest";
import { demoStory } from "../../fixtures/demo-story";
import brief from "../../docs/M3_CREATIVE_BRIEF.json";
import { readConfig } from "@/server/config";
import { openDatabase } from "@/server/storage";
import { createProvider } from "@/server/providers";
import { createDollarGuard, accountForAccessChecks } from "@/server/allowance";
import { IllustrationWorkspace } from "@/server/illustration-service";

it.skipIf(process.env.RUN_PAID_IMAGE !== "1")("M3 ONE character sheet measurement; stops before pages", async () => {
  if (process.env.CI) throw new Error("Paid image measurement is local opt-in only.");
  const gate = resolve(".tools/m3-sheet-gate.json");
  if (existsSync(gate)) throw new Error("A sheet measurement record already exists. Review it; do not rerun.");
  const config = readConfig({ ...process.env, AI_PROVIDER: "real", ENABLE_LIVE_AI: "1", SESSION_BUDGET_USD: String(Math.min(Number(process.env.SESSION_BUDGET_USD ?? 2), .75)) });
  const db = openDatabase(config.DATA_DIR); const session = randomUUID();
  accountForAccessChecks(db);
  // Any prior image request, including an unresolved one, blocks this one-off
  // probe from being repeated by deleting its local convenience record.
  if (Number(db.prepare("SELECT COUNT(*) AS n FROM ai_operations WHERE kind='image'").get()!.n)) { db.close(); throw new Error("Prior image attempt exists. Stop and review the ledger."); }
  db.prepare("INSERT INTO ai_sessions VALUES (?, ?)").run(session, Date.now() + 7 * 86400000);
  const provider = createProvider(config, adapter => createDollarGuard(db, session, adapter, { sessionUsd: config.SESSION_BUDGET_USD, developmentUsd: config.DEVELOPMENT_BUDGET_USD, requestsPerMinute: 10 }, config.IMAGE_ATTEMPT_LIMIT));
  const workspace = new IllustrationWorkspace(db, session, config, provider);
  mkdirSync(".tools", { recursive: true });
  // Save the recovery pointer BEFORE dispatch: interruption never authorizes a
  // duplicate measurement. Session/content stay ignored and private.
  writeFileSync(gate, JSON.stringify({ session, dataDir: config.DATA_DIR, state: "pending", approved: false }));
  try {
    await workspace.execute({ action: "start", story: demoStory, brief, saveConsent: true });
    await workspace.execute({ action: "sheet", revision: 0 });
    const project = workspace.read()!; const sheet = project.sheet!;
    writeFileSync(".tools/m3-character-sheet.webp", workspace.asset(sheet.assetId));
    writeFileSync(gate, JSON.stringify({ session, dataDir: config.DATA_DIR, projectId: project.id, revision: project.revision, assetId: sheet.assetId, usage: sheet.usage, state: "awaiting-creator-approval", approved: false }, null, 2));
    const rows = db.prepare("SELECT kind, reserved, actual FROM ai_operations WHERE session_id = ?").all(session);
    console.log(JSON.stringify({ paidImageMeasurement: "character-sheet-only", producer: sheet.source.providerId, model: sheet.source.model, usage: sheet.usage, operations: rows, developmentExposureUsd: workspace.status().exposureUsd, attempts: workspace.status().attempts, invoiceVerified: false, pageImagesGenerated: 0, approved: false, frozen: false }));
    expect(Boolean(sheet.usage.tokens && sheet.usage.imageTokens && sheet.usage.actualUsd !== null)).toBe(true);
    expect(project.pages.every(page => page === null)).toBe(true);
    expect(project.sheet!.approved).toBe(false); expect(project.halted).toBe(false);
  } catch (error) {
    console.log(JSON.stringify({ paidImageMeasurement: "stopped", code: error instanceof Error && "code" in error ? error.code : "UNKNOWN", retry: false, pageImagesGenerated: 0 }));
    throw error;
  } finally { db.close(); }
}, 240000);
