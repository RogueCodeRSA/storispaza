import { readConfig } from "@/server/config";
export const runtime = "nodejs";
export function GET() {
  const config = readConfig();
  return Response.json({ status: "ok", milestone: "M2", realOperationsEnabled: config.AI_PROVIDER === "real" && config.ENABLE_LIVE_AI }, { headers: { "Cache-Control": "no-store" } });
}
