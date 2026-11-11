import { z } from "zod";

export const ownershipSchema = z.object({
  creator: z.string().trim().min(1).max(100),
  visibility: z.enum(["private", "shared"]).default("private"),
  sharingConsent: z.boolean().default(false),
  assumptionsConfirmed: z.boolean().default(false),
});
export type Ownership = z.infer<typeof ownershipSchema>;
export const ownershipExplanation = "You control your contributions and decide who receives this story. AI assistance does not guarantee copyright, originality or exclusive rights. Respect contributors, image licences and community permissions. Shared means a manual file export, never a public URL. Exported copies cannot be remotely recalled. Raw source recordings and private correction history are excluded. Approved adult narration is optional and requires separate voice-export consent.";
