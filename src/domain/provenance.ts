import { z } from "zod";

// Provider IDs are data, not a vendor enum. Adding an adapter never changes this schema.
export const assetSourceSchema = z.object({
  assetId: z.string().min(1).max(160),
  providerId: z.string().regex(/^[a-z0-9][a-z0-9-]*$/).max(80),
  model: z.string().max(200).nullable(),
  origin: z.enum(["generated", "fixture", "creator", "unknown"]),
  editedByCreator: z.boolean().default(false),
});
export type AssetSource = z.infer<typeof assetSourceSchema>;
export const assetSourcesSchema = z.object({
  text: assetSourceSchema,
  illustration: assetSourceSchema.nullable(),
  translation: assetSourceSchema.nullable(),
  narration: z.object({ en: assetSourceSchema.nullable(), st: assetSourceSchema.nullable() }),
});
export type AssetSources = z.infer<typeof assetSourcesSchema>;

export function unknownAssetSources(): AssetSources {
  return { text: { assetId: "legacy-text-unknown", providerId: "unknown", model: null, origin: "unknown", editedByCreator: false }, illustration: null, translation: null, narration: { en: null, st: null } };
}

export function fixtureSource(assetId: string, providerId: string): AssetSource {
  return assetSourceSchema.parse({ assetId, providerId, model: null, origin: "fixture", editedByCreator: false });
}

export function sourceLabel(source: AssetSource | null): string {
  if (!source) return "Source not recorded";
  return `${source.providerId}${source.model ? ` / ${source.model}` : ""}${source.editedByCreator ? " · creator-edited" : ""}`;
}
