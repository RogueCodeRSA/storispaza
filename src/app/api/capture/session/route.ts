import { createCaptureHandlers } from "@/server/capture-service";
export const runtime = "nodejs";
export async function POST(request: Request) { return createCaptureHandlers().session(request); }
