import pack from "../../fixtures/image-pack.json";
import { assetSourceSchema } from "./provenance";
import { z } from "zod";

const entry = z.object({ page: z.number().int().min(1).max(6), source: assetSourceSchema,
  history: z.array(assetSourceSchema).default([]),
  dataUrl: z.string().regex(/^data:image\/webp;base64,[A-Za-z0-9+/]+=*$/), approved: z.literal(true), redistributionConsent: z.literal(true),
});
export const reviewedImageFixtures = z.array(entry).parse(Object.values(pack.images));
export function reviewedFixtureImage(assetId: string | null): string | null {
  return reviewedImageFixtures.find(image => image.source.assetId === assetId)?.dataUrl ?? null;
}
