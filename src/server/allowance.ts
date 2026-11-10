import "server-only";
import type { DatabaseSync } from "node:sqlite";
import { BudgetLedger } from "./budget";
import { AppError } from "./errors";
import type { ProviderAllowanceGuard } from "./providers/boundary";
import type { ProviderOperation, StoryProvider } from "./providers/types";

export function createDollarGuard(db: DatabaseSync, session: string, adapter: StoryProvider, limits = { sessionUsd: 2, developmentUsd: 10, requestsPerMinute: 10 }): ProviderAllowanceGuard {
  const ledger = new BudgetLedger(db, limits);
  return {
    async reserve(operation: ProviderOperation) {
      const estimate = adapter.operationEstimates?.[operation];
      if (!estimate || !Number.isFinite(estimate)) throw new AppError("BUDGET_EXCEEDED", "No approved estimate exists for this operation.", 429);
      return ledger.reserve(session, estimate, operation === "transcribe" ? "transcription" : operation === "illustrate" || operation === "createCharacterSheet" ? "image" : "text");
    },
    async settle(reservation, usage) {
      if (usage.actualUsd === null) return;
      ledger.settle(reservation, usage.actualUsd);
      db.prepare("INSERT OR REPLACE INTO ai_measurements VALUES (?, ?)").run(reservation, JSON.stringify(usage));
    },
    async retainUnknown() { /* Existing pending row retains its conservative reservation. */ },
  };
}

export function accountForAccessChecks(db: DatabaseSync): void {
  // Two creator-authorized probes before M2, measured from 37 input / 13 output
  // tokens each. Carry their published-rate cost forward once, without content.
  db.prepare("INSERT OR IGNORE INTO ai_operations VALUES (?, ?, 'text', 460, 460, 'settled', ?)")
    .run("00000000-0000-4000-8000-000000000002", "00000000-0000-4000-8000-000000000003", Date.now());
}
