import "server-only";
import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
import { finalApprovalIssues, storySchema, type Story } from "@/domain/story";
import { AppError } from "./errors";

export function openDatabase(directory: string): DatabaseSync {
  mkdirSync(directory, { recursive: true });
  const db = new DatabaseSync(join(directory, "storispaza.sqlite"));
  const version = db.prepare("PRAGMA user_version").get();
  if (Number(version?.user_version) > 2) {
    db.close();
    throw new AppError("API_UNAVAILABLE", "This database requires a newer StoriSpaza version.", 503);
  }
  db.exec(`PRAGMA foreign_keys = ON;
    PRAGMA journal_mode = WAL;
    BEGIN IMMEDIATE;
    CREATE TABLE IF NOT EXISTS stories (id TEXT PRIMARY KEY, payload TEXT NOT NULL, updated_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS ai_operations (
      id TEXT PRIMARY KEY, session_id TEXT NOT NULL, kind TEXT NOT NULL,
      reserved INTEGER NOT NULL, actual INTEGER, state TEXT NOT NULL, created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS ai_sessions (id TEXT PRIMARY KEY, expires_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS ai_measurements (operation_id TEXT PRIMARY KEY, usage_json TEXT NOT NULL);
    PRAGMA user_version = 2;
    COMMIT;`);
  return db;
}

export class StoryRepository {
  constructor(private readonly db: DatabaseSync) {}
  save(input: unknown, options: { confirmed: boolean; final: boolean }): Story {
    if (!options.confirmed) throw new AppError("APPROVAL_REQUIRED", "Confirm before saving this draft.");
    const story = storySchema.parse(input);
    if ((options.final || story.visibility === "shared") && finalApprovalIssues(story).length) {
      throw new AppError("APPROVAL_REQUIRED", "Review all content and consent before final save or shared export.");
    }
    this.db.prepare("INSERT INTO stories VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload, updated_at=excluded.updated_at")
      .run(story.id, JSON.stringify(story), new Date().toISOString());
    return story;
  }
  get(id: string): Story | null {
    z.uuid().parse(id);
    const row = this.db.prepare("SELECT payload FROM stories WHERE id = ?").get(id);
    return row ? storySchema.parse(JSON.parse(String(row.payload))) : null;
  }
  delete(id: string): void {
    z.uuid().parse(id);
    this.db.prepare("DELETE FROM stories WHERE id = ?").run(id);
  }
}
