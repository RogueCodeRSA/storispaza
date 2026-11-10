import "server-only";
import { ZodError } from "zod";

export type ErrorCode = "INVALID_INPUT" | "CONSENT_REQUIRED" | "APPROVAL_REQUIRED" | "NOT_FOUND" | "API_UNAVAILABLE" | "NOT_IMPLEMENTED" | "BUDGET_EXCEEDED" | "RATE_LIMITED" | "INTERNAL";
export class AppError extends Error {
  constructor(public readonly code: ErrorCode, message: string, public readonly status = 400) { super(message); }
}
export function errorResponse(error: unknown): Response {
  if (error instanceof ZodError) return Response.json({ error: { code: "INVALID_INPUT", message: "Check the supplied fields." } }, { status: 400 });
  if (error instanceof AppError) return Response.json({ error: { code: error.code, message: error.message } }, { status: error.status });
  return Response.json({ error: { code: "INTERNAL", message: "Something went wrong. Your existing work has not been replaced." } }, { status: 500 });
}
