import { z } from "zod";

export const recordingConsentSchema = z.object({
  storage: z.literal(true, { error: "Consent is required before storing a recording." }),
  apiTransmission: z.boolean(),
  redistribution: z.boolean().default(false),
  retainedByCreator: z.boolean().default(false),
});
export type RecordingConsent = z.infer<typeof recordingConsentSchema>;
