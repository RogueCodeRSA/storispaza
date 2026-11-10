import { createProvider } from "@/server/providers";
import { AppError, errorResponse } from "@/server/errors";
import { readConfig } from "@/server/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    // This read-only fixture endpoint must never become a paid generation route.
    if (readConfig().AI_PROVIDER !== "mock") throw new AppError("API_UNAVAILABLE", "The fixture endpoint is available only in mock mode.", 503);
    const result = await createProvider().structureStory({
      idea: "The Girl Who Spoke to Electricity", sourceLanguage: "en", culturalContext: "Soweto; creator review pending", educationalObjective: "Electrical safety and community cooperation",
    });
    return Response.json({ ...result, fixtureStatus: "provisional", humanReviewed: false }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return errorResponse(error); }
}
