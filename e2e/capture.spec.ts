import { expect, test } from "@playwright/test";
import { demoStory } from "../fixtures/demo-story";
import { encodeCaptureWav } from "../src/domain/capture";

test("M2 microphone start, stop and deletion release tracks", async ({ page }) => {
  await page.addInitScript(() => {
    const original = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
    navigator.mediaDevices.getUserMedia = async constraints => {
      const stream = await original(constraints);
      Object.assign(window, { captureTestTracks: stream.getTracks() }); return stream;
    };
  });
  await page.goto("http://127.0.0.1:3200/create");
  await page.getByLabel(/I consent to temporarily hold/).check();
  await page.getByRole("button", { name: "Start English recording" }).click();
  await expect(page.getByRole("button", { name: "Stop recording", exact: true })).toBeEnabled();
  await page.getByRole("button", { name: "Stop recording", exact: true }).click();
  await expect(page.getByLabel("Review English recording")).toBeVisible();
  expect(await page.evaluate(() => (window as unknown as { captureTestTracks: MediaStreamTrack[] }).captureTestTracks.every(track => track.readyState === "ended"))).toBe(true);
  await page.getByRole("button", { name: "Delete recording", exact: true }).click();
  await expect(page.getByLabel("Review English recording")).toHaveCount(0);
});

test("M2 denied microphone preserves typed fallback", async ({ page }) => {
  await page.addInitScript(() => { navigator.mediaDevices.getUserMedia = async () => { throw new DOMException("Denied", "NotAllowedError"); }; });
  await page.goto("http://127.0.0.1:3200/create");
  await page.getByRole("textbox", { name: "Story idea", exact: true }).fill("Keep this typed idea.");
  await page.getByLabel(/I consent to temporarily hold/).check();
  await page.getByRole("button", { name: "Start English recording" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "permission was denied" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Story idea", exact: true })).toHaveValue("Keep this typed idea.");
});

test("M2 six-page editing, explicit save and error recovery", async ({ page }, info) => {
  const story = structuredClone(demoStory);
  let fail = false;
  await page.route("**/api/capture/**", async route => {
    if (route.request().url().endsWith("session")) return route.fulfill({ json: { ready: true } });
    if (fail) return route.fulfill({ status: 503, json: { error: { message: "Provider unavailable. Your input is unchanged." } } });
    return route.fulfill({ json: { data: story, assets: [], usage: { actualUsd: .001, tokens: { input: 100, output: 100 } } } });
  });
  await page.goto("http://127.0.0.1:3200/create");
  await page.getByRole("textbox", { name: "Story idea", exact: true }).fill("A fictional child shares books with friends.");
  const create = page.getByRole("button", { name: "Create six-page story" });
  await expect(create).toBeDisabled();
  await page.getByLabel(/Send this idea and context/).check();
  await create.click();
  for (let n = 1; n <= 6; n++) {
    await page.getByRole("button", { name: `Page ${n}`, exact: true }).click();
    await page.getByLabel("Page title", { exact: true }).fill(`Edited page ${n}`);
    await page.getByLabel("Page narrative").fill(`Edited narrative ${n}.`);
    await page.getByLabel("Illustration description").fill(`Creator description ${n}.`);
    await page.getByLabel("Character references (comma separated)").fill(story.characters.map(character => character.id).join(", "));
    await page.getByLabel("Learning moment").fill(`Cooperation ${n}.`);
  }
  await expect(page.getByRole("button", { name: "Save unreviewed story draft" })).toBeDisabled();
  await page.getByLabel(/Save the current unreviewed story/).check();
  await page.getByRole("button", { name: "Save unreviewed story draft" }).click();
  await page.reload();
  await page.getByRole("button", { name: "Restore saved story" }).click();
  await page.getByRole("button", { name: "Page 6", exact: true }).click();
  await expect(page.getByLabel("Page narrative")).toHaveValue("Edited narrative 6.");
  await page.getByRole("textbox", { name: "Story idea", exact: true }).fill("Retain this input on error.");
  await page.getByLabel(/Send this idea and context/).check();
  fail = true; await create.click();
  await expect(page.getByRole("alert").filter({ hasText: "Provider unavailable" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Story idea", exact: true })).toHaveValue("Retain this input on error.");
  await expect(page.getByLabel("Page narrative")).toHaveValue("Edited narrative 6.");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath("m2-editor.png"), fullPage: true });
});

test("M2 English upload, editable transcript and deletion", async ({ page }) => {
  let audioCalls = 0; let storyCalls = 0;
  await page.route("**/api/capture/**", async route => {
    if (route.request().url().endsWith("transcribe")) {
      audioCalls++;
      expect(route.request().headers()["x-audio-consent"]).toBe("true");
      return route.fulfill({ json: { data: "Uncorrected English transcript.", assets: [], usage: { actualUsd: .0001, tokens: null } } });
    }
    if (route.request().url().endsWith("story")) storyCalls++;
    return route.fulfill({ json: { ready: true } });
  });
  await page.goto("http://127.0.0.1:3200/create");
  await page.getByLabel(/I consent to temporarily hold/).check();
  const wav = encodeCaptureWav(new Float32Array(16000), 16000);
  await page.getByLabel(/Upload English voice note/).setInputFiles({ name: "synthetic.wav", mimeType: "audio/wav", buffer: Buffer.from(wav) });
  await expect(page.getByRole("button", { name: "Transcribe English audio" })).toBeDisabled();
  await page.getByLabel(/Send this audio to/).check();
  await page.getByRole("button", { name: "Transcribe English audio" }).click();
  await expect(page.getByLabel("Editable English transcript")).toHaveValue("Uncorrected English transcript.");
  await page.getByLabel("Editable English transcript").fill("Corrected fictional story idea.");
  await page.getByRole("button", { name: "Use edited transcript as idea" }).click();
  await expect(page.getByRole("textbox", { name: "Story idea", exact: true })).toHaveValue("Corrected fictional story idea.");
  await page.getByRole("button", { name: "Delete recording", exact: true }).click();
  await expect(page.getByLabel("Review English recording")).toHaveCount(0);
  await expect(page.getByLabel("Editable English transcript")).toHaveValue("Corrected fictional story idea.");
  expect(audioCalls).toBe(1); expect(storyCalls).toBe(0);
  await page.getByRole("button", { name: "Clear transcript" }).click();
  await expect(page.getByLabel("Editable English transcript")).toHaveValue("");
});
