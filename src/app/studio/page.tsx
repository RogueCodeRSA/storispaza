import MockJourney from "@/components/MockJourney";
import { readConfig } from "@/server/config";

export const dynamic = "force-dynamic";
export default function StudioPage() {
  if (readConfig().AI_PROVIDER !== "mock") return <main id="main"><h1>Offline demo unavailable in real mode</h1><p>Set AI_PROVIDER=mock to use the fixture journey. No real operation has been called.</p></main>;
  return <MockJourney />;
}
