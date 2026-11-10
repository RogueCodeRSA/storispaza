import CaptureStudio from "@/components/CaptureStudio";
import { readConfig } from "@/server/config";
export const dynamic = "force-dynamic";
export default function CreatePage() {
  const config = readConfig();
  return <CaptureStudio enabled={config.AI_PROVIDER === "real" && config.ENABLE_LIVE_AI} />;
}
