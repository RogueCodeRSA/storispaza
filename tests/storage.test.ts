import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { DatabaseSync } from "node:sqlite";
import { demoStory } from "../fixtures/demo-story";
import { openDatabase, StoryRepository } from "@/server/storage";
import { BudgetLedger } from "@/server/budget";

let directory: string;
let db: DatabaseSync;
beforeEach(() => { directory = mkdtempSync(join(tmpdir(), "storispaza-test-")); db = openDatabase(directory); });
afterEach(() => { db.close(); rmSync(directory, { recursive: true, force: true }); });

describe("local persistence", () => {
  it("persists only explicitly confirmed drafts, reloads and deletes them", () => {
    const repo = new StoryRepository(db);
    expect(() => repo.save(demoStory, { confirmed: false, final: false })).toThrow();
    repo.save(demoStory, { confirmed: true, final: false });
    db.close(); db = openDatabase(directory);
    const reopened = new StoryRepository(db);
    expect(reopened.get(demoStory.id)).toEqual(demoStory);
    reopened.delete(demoStory.id);
    expect(reopened.get(demoStory.id)).toBeNull();
  });
  it("blocks final save and shared drafts without content approvals", () => {
    const repo = new StoryRepository(db);
    expect(() => repo.save(demoStory, { confirmed: true, final: true })).toThrow();
    expect(() => repo.save({ ...demoStory, visibility: "shared", sharingConsent: true }, { confirmed: true, final: false })).toThrow();
    expect(() => repo.get("../../private")).toThrow();
  });
  it("refuses newer schemas without downgrading their version", () => {
    db.exec("PRAGMA user_version = 5");
    expect(() => openDatabase(directory)).toThrow("newer StoriSpaza");
    expect(db.prepare("PRAGMA user_version").get()?.user_version).toBe(5);
  });
  it("upgrades v1 while preserving stories and durable spend", () => {
    new StoryRepository(db).save(demoStory, { confirmed: true, final: false });
    const operation = new BudgetLedger(db).reserve(randomUUID(), .1, "text");
    db.exec("DROP TABLE ai_sessions; DROP TABLE ai_measurements; PRAGMA user_version = 1;");
    db.close(); db = openDatabase(directory);
    expect(db.prepare("PRAGMA user_version").get()?.user_version).toBe(4);
    expect(new StoryRepository(db).get(demoStory.id)).toEqual(demoStory);
    expect(db.prepare("SELECT reserved,state FROM ai_operations WHERE id = ?").get(operation)).toMatchObject({ reserved: 100000, state: "pending" });
    expect(db.prepare("SELECT COUNT(*) AS n FROM ai_sessions").get()?.n).toBe(0);
  });
});

describe("persistent cost and rate controls", () => {
  it("reserves before dispatch, reconciles actual cost and retains unknown outcomes", () => {
    const session = randomUUID();
    const ledger = new BudgetLedger(db);
    const operation = ledger.reserve(session, 1.5, "text");
    expect(() => ledger.reserve(session, .6, "text")).toThrow();
    ledger.settle(operation, .1);
    ledger.reserve(session, 1.8, "text");
    expect(() => new BudgetLedger(db).reserve(session, .2, "text")).toThrow();
    expect(() => ledger.settle(operation, 0)).toThrow();
  });
  it("enforces a global development cap across sessions and connections", () => {
    const second = openDatabase(directory);
    try {
      const firstLedger = new BudgetLedger(db);
      for (let i = 0; i < 5; i++) firstLedger.reserve(randomUUID(), 2, "text");
      expect(() => new BudgetLedger(second).reserve(randomUUID(), .01, "text")).toThrow();
    } finally { second.close(); }
  });
  it("limits requests and allows only one unresolved image operation", () => {
    const ledger = new BudgetLedger(db, { sessionUsd: 2, developmentUsd: 10, requestsPerMinute: 2 });
    const session = randomUUID();
    ledger.reserve(session, .01, "text", 100_000);
    ledger.reserve(session, .01, "text", 100_001);
    expect(() => ledger.reserve(session, .01, "text", 100_002)).toThrow();
    const image = ledger.reserve(randomUUID(), .01, "image");
    expect(() => ledger.reserve(randomUUID(), .01, "image")).toThrow();
    ledger.settle(image, .01);
    expect(() => ledger.reserve(randomUUID(), .01, "image")).not.toThrow();
  });
  it("rejects invalid reservations and never rolls back accounting for overspend", () => {
    const ledger = new BudgetLedger(db);
    expect(() => ledger.reserve(randomUUID(), -1, "text")).toThrow();
    expect(() => ledger.reserve(randomUUID(), NaN, "text")).toThrow();
    const session = randomUUID();
    ledger.settle(ledger.reserve(session, .1, "text"), 2.1);
    expect(() => ledger.reserve(session, .01, "text")).toThrow();
  });
});
