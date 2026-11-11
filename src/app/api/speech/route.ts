import { createSpeechHandlers } from "@/server/speech-service";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const handlers = createSpeechHandlers();
export const GET = handlers.handle;
export const POST = handlers.handle;
