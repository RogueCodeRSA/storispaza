import { createReaderHandler } from "@/server/reader-service";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const GET = createReaderHandler();
