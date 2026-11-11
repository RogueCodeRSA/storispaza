import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { reviewedSpeechPack } from "../scripts/reviewed-speech.mjs";
import { createReaderHandler } from "@/server/reader-service";
import { readConfig } from "@/server/config";
import { newMockDraft } from "@/domain/mock-journey";

it("validates all 24 actual consented recordings against current reviewed scripts and excludes corrections", () => {
  const pack = reviewedSpeechPack(readFileSync);
  expect(pack.files.size).toBe(24); expect(pack.book.scriptsApproved).toBe(24); expect(pack.book.clipsApproved).toBe(24);
  expect(pack.manifest.corrections).toEqual([]);
  const copied = newMockDraft(pack.manifest.story);
  expect(copied.story.pages.every(page => !page.approvals.text && !page.approvals.audio && page.translation?.status === "edited")).toBe(true);
  expect(copied.story.visibility).toBe("private"); expect(copied.story.sharingConsent).toBe(false);
});

it.each(["consent", "approval", "stale-version", "bytes", "reader-text"])("fails closed for changed %s without approving anything", change => {
  const read = (path: string): Buffer => {
    const bytes = readFileSync(path);
    if (change === "bytes" && path.endsWith("en-page-01.wav")) { const altered = Buffer.from(bytes); altered[44] ^= 1; return altered; }
    if (path.endsWith("manifest.json") && ["consent", "approval", "stale-version"].includes(change)) {
      const value = JSON.parse(bytes.toString());
      if (change === "consent") value.redistributionConsent = false;
      if (change === "approval") value.scripts[0].status = "edited";
      if (change === "stale-version") value.scripts[0].version++;
      return Buffer.from(JSON.stringify(value));
    }
    if (change === "reader-text" && path.endsWith("reader.json")) { const value = JSON.parse(bytes.toString()); value.pages[0].text.en.text += " edited"; return Buffer.from(JSON.stringify(value)); }
    return bytes;
  };
  expect(() => reviewedSpeechPack(read)).toThrow();
});

it("serves consented public fixtures without storage while private UUID recordings stay inaccessible", async () => {
  const handle = createReaderHandler(() => readConfig({ AI_PROVIDER: "mock", DATA_DIR: "data/unused-fixture-guest" }));
  const request = (query = "") => new Request(`http://localhost:3000/api/reader${query}`);
  const { book } = await (await handle(request())).json(); expect(book.fixtureReplay).toBe(true); expect(book.clipsApproved).toBe(24);
  const audio = await handle(new Request("http://localhost:3000/api/reader?fixtureClip=st-page-01", { headers: { range: "bytes=0-43" } }));
  expect(audio.status).toBe(206); expect((await audio.arrayBuffer()).byteLength).toBe(44);
  expect((await handle(request("?fixtureClip=../../.env.local"))).status).toBe(404);
  expect((await handle(request("?clip=00000000-0000-4000-8000-000000000000"))).status).toBe(404);
});
