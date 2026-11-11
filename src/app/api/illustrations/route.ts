import { createIllustrationHandlers } from "@/server/illustration-service";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const handlers = createIllustrationHandlers();
export const GET = handlers.handle;
export const POST = handlers.handle;
