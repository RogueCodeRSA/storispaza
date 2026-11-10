export const runtime = "nodejs";
export function GET() {
  return Response.json({ status: "ok", milestone: "M0", realOperationsEnabled: false }, { headers: { "Cache-Control": "no-store" } });
}
