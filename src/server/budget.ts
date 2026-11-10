import "server-only";
import { randomUUID } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import { z } from "zod";
import { AppError } from "./errors";

const dollars = z.number().finite().positive();
const micros = (value: number) => Math.ceil(dollars.parse(value) * 1_000_000);

export class BudgetLedger {
  constructor(private readonly db: DatabaseSync, private readonly limits = { sessionUsd: 2, developmentUsd: 10, requestsPerMinute: 10 }) {
    z.object({ sessionUsd: dollars.max(2), developmentUsd: dollars.max(10), requestsPerMinute: z.number().int().min(1).max(10) }).parse(limits);
  }
  reserve(sessionId: string, estimatedUsd: number, kind: "text" | "image" | "transcription", now = Date.now()): string {
    z.string().uuid().parse(sessionId);
    const reservation = micros(estimatedUsd);
    this.db.exec("BEGIN IMMEDIATE");
    try {
      const totals = this.db.prepare(`SELECT
        COALESCE(SUM(COALESCE(actual, reserved)), 0) AS total,
        COALESCE(SUM(CASE WHEN session_id = ? THEN COALESCE(actual, reserved) ELSE 0 END), 0) AS session
        FROM ai_operations`).get(sessionId)!;
      if (Number(totals.total) + reservation > micros(this.limits.developmentUsd) || Number(totals.session) + reservation > micros(this.limits.sessionUsd)) {
        throw new AppError("BUDGET_EXCEEDED", "The estimated operation exceeds the remaining API allowance.", 429);
      }
      const count = this.db.prepare("SELECT COUNT(*) AS n FROM ai_operations WHERE session_id = ? AND created_at > ?").get(sessionId, now - 60_000)!;
      if (Number(count.n) >= this.limits.requestsPerMinute) throw new AppError("RATE_LIMITED", "Wait before making another AI request.", 429);
      if (kind === "image" && this.db.prepare("SELECT id FROM ai_operations WHERE kind = 'image' AND state = 'pending'").get()) {
        throw new AppError("RATE_LIMITED", "An image operation is already pending. Resolve it before generating another.", 429);
      }
      const id = randomUUID();
      this.db.prepare("INSERT INTO ai_operations VALUES (?, ?, ?, ?, NULL, 'pending', ?)").run(id, sessionId, kind, reservation, now);
      this.db.exec("COMMIT");
      return id;
    } catch (error) { this.db.exec("ROLLBACK"); throw error; }
  }
  settle(id: string, actualUsd: number): void {
    z.uuid().parse(id);
    z.number().finite().nonnegative().parse(actualUsd);
    const result = this.db.prepare("UPDATE ai_operations SET actual = ?, state = 'settled' WHERE id = ? AND state = 'pending'").run(Math.ceil(actualUsd * 1_000_000), id);
    if (!result.changes) throw new AppError("INVALID_INPUT", "Operation is missing or already settled.");
  }
  // Unknown outcomes stay pending and reserved. Settlement requires known usage;
  // a zero-cost failure may be settled at zero only when non-billing is confirmed.
}
