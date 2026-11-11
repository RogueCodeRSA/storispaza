import "server-only";
import { randomUUID } from "node:crypto";
import { readConfig } from "./config";
import { openDatabase } from "./storage";
import { requireLocalOrigin, sessionId } from "./capture-service";
import { errorResponse } from "./errors";
export async function openReviewSession(request: Request) {
  let db: ReturnType<typeof openDatabase> | undefined;
  try {
    requireLocalOrigin(request); db = openDatabase(readConfig().DATA_DIR);
    const id = sessionId(request, db) ?? randomUUID();
    db.prepare("INSERT INTO ai_sessions VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET expires_at=excluded.expires_at").run(id, Date.now() + 7 * 86400000);
    const response = Response.json({ ready: true }, { headers: { "Cache-Control": "no-store" } });
    response.headers.set("Set-Cookie", `storispaza-session=${id}; HttpOnly; SameSite=Strict; Path=/; Max-Age=604800${new URL(request.url).protocol === "https:" ? "; Secure" : ""}`);
    return response;
  } catch (error) { return errorResponse(error); } finally { db?.close(); }
}
