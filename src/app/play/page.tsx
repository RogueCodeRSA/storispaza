import StoryPlayer from "@/components/StoryPlayer";
import { readConfig } from "@/server/config";
export const dynamic = "force-dynamic";
export default function PlayPage() { return <StoryPlayer mode={readConfig().AI_PROVIDER} />; }
