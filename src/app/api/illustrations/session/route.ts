import { createIllustrationHandlers } from "@/server/illustration-service";
export const runtime = "nodejs";
export const POST = createIllustrationHandlers().session;
