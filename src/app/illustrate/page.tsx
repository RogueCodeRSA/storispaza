import IllustrationStudio from "@/components/IllustrationStudio";
import { readConfig } from "@/server/config";
export const dynamic = "force-dynamic";
export default function IllustratePage() { return <IllustrationStudio mode={readConfig().AI_PROVIDER} />; }
