import SpeechStudio from "@/components/SpeechStudio";
import { readConfig } from "@/server/config";
export const dynamic = "force-dynamic";
export default function SpeakPage() { return <SpeechStudio mode={readConfig().AI_PROVIDER} />; }
