import { createOwnershipHandler } from "@/server/ownership-service";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const POST = createOwnershipHandler();
