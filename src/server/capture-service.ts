import "server-only";
import { randomUUID } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import { storyInputSchema, MAX_AUDIO_BYTES, validateCaptureWav } from "@/domain/capture";
import { readConfig } from "./config";
import { AppError, errorResponse } from "./errors";
import { openDatabase } from "./storage";
import { createProvider } from "./providers";
import { accountForAccessChecks, createDollarGuard } from "./allowance";

type Config = ReturnType<typeof readConfig>;
const COOKIE = "storispaza-session";
const SESSION_AGE_MS = 2 * 60 * 60 * 1000;

export async function readBoundedBody(request: Request, limit: number): Promise<Uint8Array> {
  const reader = request.body?.getReader();
  if (!reader) throw new AppError("INVALID_INPUT", "A request body is required.");
  const chunks: Uint8Array[] = []; let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      total += value.length;
      if (total > limit) { await reader.cancel(); throw new AppError("INVALID_INPUT", "The request is too large.", 413); }
      chunks.push(value);
    }
    const result = new Uint8Array(total); let offset = 0;
    for (const chunk of chunks) { result.set(chunk, offset); offset += chunk.length; }
    return result;
  } finally { for (const chunk of chunks) chunk.fill(0); reader.releaseLock(); }
}

export function requireLocalOrigin(request: Request): void {
  const url = new URL(request.url);
  // Next can canonicalize request.url to localhost while the browser uses
  // 127.0.0.1. Validate the local Host and exact browser Origin together.
  const browserUrl = new URL(`${url.protocol}//${request.headers.get("host") ?? url.host}`);
  if (![url.hostname, browserUrl.hostname].every(host => ["127.0.0.1", "localhost", "[::1]"].includes(host)) || request.headers.get("origin") !== browserUrl.origin || request.headers.get("sec-fetch-site") === "cross-site") {
    throw new AppError("INVALID_INPUT", "Only same-origin requests to this local app are accepted.", 403);
  }
}
export function sessionId(request: Request, db: DatabaseSync): string | null {
  const value = request.headers.get("cookie")?.split(";").map(part => part.trim()).find(part => part.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1);
  if (!value || !/^[a-f0-9-]{36}$/.test(value)) return null;
  return db.prepare("SELECT id FROM ai_sessions WHERE id = ? AND expires_at > ?").get(value, Date.now()) ? value : null;
}
function enabled(config: Config) {
  if (config.AI_PROVIDER !== "real" || !config.ENABLE_LIVE_AI) throw new AppError("API_UNAVAILABLE", "Live capture is disabled. Enable it explicitly on the server.", 503);
}
function json(value: unknown, status = 200) { return Response.json(value, { status, headers: { "Cache-Control": "no-store" } }); }

export function createCaptureHandlers(dependencies: { config?: () => Config; database?: (config: Config) => DatabaseSync; provider?: typeof createProvider } = {}) {
  const config = dependencies.config ?? readConfig;
  const database = dependencies.database ?? (value => openDatabase(value.DATA_DIR));
  const provider = dependencies.provider ?? createProvider;
  return {
    async session(request: Request): Promise<Response> {
      let db: DatabaseSync | undefined;
      try {
        requireLocalOrigin(request); const settings = config(); enabled(settings); db = database(settings);
        accountForAccessChecks(db);
        const existing = sessionId(request, db); const id = existing ?? randomUUID();
        if (!existing) db.prepare("INSERT INTO ai_sessions VALUES (?, ?)").run(id, Date.now() + SESSION_AGE_MS);
        const response = json({ ready: true, sessionBudgetUsd: settings.SESSION_BUDGET_USD, developmentBudgetUsd: settings.DEVELOPMENT_BUDGET_USD });
        response.headers.set("Set-Cookie", `${COOKIE}=${id}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${SESSION_AGE_MS / 1000}${new URL(request.url).protocol === "https:" ? "; Secure" : ""}`);
        return response;
      } catch (error) { return errorResponse(error); } finally { db?.close(); }
    },
    async generate(request: Request): Promise<Response> {
      let db: DatabaseSync | undefined;
      try {
        requireLocalOrigin(request); const settings = config(); enabled(settings);
        if (request.headers.get("x-ai-consent") !== "true") throw new AppError("CONSENT_REQUIRED", "Confirm sending your idea to the configured AI provider.");
        if (!request.headers.get("content-type")?.startsWith("application/json")) throw new AppError("INVALID_INPUT", "Use a JSON story request.");
        const bytes = await readBoundedBody(request, 32768);
        let raw: unknown;
        try { raw = JSON.parse(new TextDecoder().decode(bytes)); } catch { throw new AppError("INVALID_INPUT", "The story request is not valid JSON."); }
        finally { bytes.fill(0); }
        const input = storyInputSchema.parse(raw);
        db = database(settings); const session = sessionId(request, db);
        if (!session) throw new AppError("CONSENT_REQUIRED", "Start a local capture session first.", 403);
        const result = await provider(settings, adapter => createDollarGuard(db!, session, adapter, { sessionUsd: settings.SESSION_BUDGET_USD, developmentUsd: settings.DEVELOPMENT_BUDGET_USD, requestsPerMinute: settings.AI_REQUESTS_PER_MINUTE })).structureStory(input);
        return json(result);
      } catch (error) { return errorResponse(error); } finally { db?.close(); }
    },
    async transcribe(request: Request): Promise<Response> {
      let db: DatabaseSync | undefined; let bytes: Uint8Array | undefined;
      try {
        requireLocalOrigin(request); const settings = config(); enabled(settings);
        if (request.headers.get("x-audio-consent") !== "true") throw new AppError("CONSENT_REQUIRED", "Explicit audio transmission consent is required.");
        if (request.headers.get("x-audio-language") !== "en") throw new AppError("INVALID_INPUT", "Only English voice capture is enabled.");
        if (request.headers.get("content-type") !== "audio/wav") throw new AppError("INVALID_INPUT", "Use normalized PCM WAV audio.");
        bytes = await readBoundedBody(request, MAX_AUDIO_BYTES);
        try { validateCaptureWav(bytes); } catch { throw new AppError("INVALID_INPUT", "Audio format or duration is invalid."); }
        db = database(settings); const session = sessionId(request, db);
        if (!session) throw new AppError("CONSENT_REQUIRED", "Start a local capture session first.", 403);
        const result = await provider(settings, adapter => createDollarGuard(db!, session, adapter, { sessionUsd: settings.SESSION_BUDGET_USD, developmentUsd: settings.DEVELOPMENT_BUDGET_USD, requestsPerMinute: settings.AI_REQUESTS_PER_MINUTE })).transcribe({ bytes, language: "en", apiConsent: true });
        return json(result);
      } catch (error) { return errorResponse(error); } finally { bytes?.fill(0); db?.close(); }
    },
  };
}
