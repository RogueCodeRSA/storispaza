import OwnershipStudio from "@/components/OwnershipStudio";
import { readConfig } from "@/server/config";
export const dynamic = "force-dynamic";
export default function OwnPage() { return <OwnershipStudio mode={readConfig().AI_PROVIDER} />; }
