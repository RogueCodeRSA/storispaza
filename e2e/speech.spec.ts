import { test, expect } from "@playwright/test";
import { encodeCaptureWav } from "../src/domain/capture";

test("M4 review gates, actual correction history, exact recording list and private clip deletion", async ({ page }, info) => {
  await page.goto("/speak");
  const open = page.getByRole("button", { name: "Open / restore StoriSpeak review" });
  await expect(open).toBeDisabled(); await page.getByLabel(/I consent to unencrypted local storage/).check(); await open.click();
  await expect(page.getByRole("button", { name: "Freeze reviewed current pack" })).toBeDisabled();
  await expect(page.getByRole("textbox", { name: "st-opening script", exact: true })).toHaveValue("");
  await page.getByLabel(/Send these six English narratives/).check();
  await page.getByRole("button", { name: "Draft six Sesotho narratives" }).click();
  const english = page.locator("article").filter({ has: page.getByRole("heading", { name: "English · en-page-01.wav", exact: true }) });
  const sesotho = page.locator("article").filter({ has: page.getByRole("heading", { name: "Sesotho · st-page-01.wav", exact: true }) });
  await expect(sesotho.getByText("machine-translated — UNREVIEWED", { exact: true })).toBeVisible();
  await english.getByLabel(/I reviewed this exact script/).check();
  await english.getByRole("button", { name: "Acknowledge en-page-01 rehearsal" }).click();
  const previous = await page.getByRole("textbox", { name: "st-page-01 script", exact: true }).inputValue();
  await page.getByRole("textbox", { name: "st-page-01 script", exact: true }).fill("Creator test correction; no language-quality claim.");
  await page.getByRole("button", { name: "Save st-page-01 correction" }).click();
  await sesotho.getByLabel(/I reviewed this exact script/).check();
  await sesotho.getByRole("button", { name: "Acknowledge st-page-01 rehearsal" }).click();
  await page.getByRole("combobox", { name: "Recording filename" }).selectOption("st-page-01");
  const upload = page.getByLabel("Upload own adult recording"); await expect(upload).toBeDisabled();
  await page.getByLabel(/This is my own adult voice/).check();
  const bytes = encodeCaptureWav(Float32Array.from({ length: 16000 }, (_, i) => Math.sin(i / 11) * .1), 16000);
  let failUpload = true;
  await page.route("**/api/speech?slot=**", async route => { if (failUpload) { failUpload = false; return route.fulfill({ status: 503, json: { error: { message: "Simulated local storage failure" } } }); } return route.continue(); });
  await upload.setInputFiles({ name: "test-only-not-human.wav", mimeType: "audio/wav", buffer: Buffer.from(bytes) });
  await expect(page.getByRole("heading", { name: "Recovery draft retained in this browser" })).toBeVisible();
  await page.getByRole("button", { name: "Retry stored recovery draft" }).click();
  await expect(page.getByRole("heading", { name: "Recovery draft retained in this browser" })).toHaveCount(0);
  await expect(page.getByLabel("Review own adult recording")).toBeVisible();
  await expect(page.getByRole("button", { name: "Acknowledge mock clip" })).toBeDisabled();
  await expect(page.getByLabel("Before clip approval")).toContainText("Listen to the whole current clip");
  await page.getByLabel("Review own adult recording").evaluate((audio: HTMLAudioElement) => audio.play());
  await expect(page.getByRole("button", { name: "Acknowledge mock clip" })).toBeEnabled({ timeout: 10000 });
  await page.getByRole("button", { name: "Acknowledge mock clip" }).click();
  await expect(page.getByRole("button", { name: "Freeze reviewed current pack" })).toBeDisabled();
  const corrections = await page.request.get("/api/speech?corrections=1");
  expect((await corrections.json()).at(-1)).toMatchObject({ slot: "st-page-01", before: previous, after: "Creator test correction; no language-quality claim." });
  const list = await page.request.get("/api/speech?checklist=1"); expect((await list.json()).length).toBe(24);
  const clipUrl = await page.getByLabel("Review own adult recording").getAttribute("src");
  await page.getByRole("button", { name: "Delete this stored recording" }).click();
  await expect(page.getByLabel("Review own adult recording")).toHaveCount(0);
  expect((await page.request.get(clipUrl!)).status()).toBe(404);
  await page.reload(); await page.getByLabel(/I consent to unencrypted local storage/).check(); await open.click();
  await expect(page.getByRole("textbox", { name: "st-page-01 script", exact: true })).toHaveValue("Creator test correction; no language-quality claim.");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.locator(".editor-grid").screenshot({ path: info.outputPath("m4-mock-page-review.png") });
});

test("M4 microphone capture stops tracks and stores only an unapproved mock recording", async ({ page }) => {
  await page.addInitScript(() => {
    const original = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
    navigator.mediaDevices.getUserMedia = async constraints => { const stream = await original(constraints); (window as unknown as { speechTestTracks: MediaStreamTrack[] }).speechTestTracks = stream.getTracks(); return stream; };
  });
  await page.goto("/speak"); await page.getByLabel(/I consent to unencrypted local storage/).check(); await page.getByRole("button", { name: "Open / restore StoriSpeak review" }).click();
  const english = page.locator("article").filter({ has: page.getByRole("heading", { name: "English · en-page-01.wav", exact: true }) });
  await english.getByLabel(/I reviewed this exact script/).check(); await english.getByRole("button", { name: "Acknowledge en-page-01 rehearsal" }).click();
  await page.getByLabel(/This is my own adult voice/).check(); await page.getByRole("button", { name: "Record and store adult draft" }).click();
  const stop = page.getByRole("button", { name: "Stop adult recording" }); await expect(stop).toBeEnabled();
  // Capture a real bounded duration from Chromium's fake device, not a UI wait.
  await page.waitForTimeout(600); await stop.click();
  await expect(page.getByLabel("Review own adult recording")).toBeVisible({ timeout: 10000 });
  expect(await page.evaluate(() => (window as unknown as { speechTestTracks: MediaStreamTrack[] }).speechTestTracks.every(track => track.readyState === "ended"))).toBe(true);
  await expect(page.getByText(/Recording UNREVIEWED/)).toBeVisible();
  await page.getByRole("button", { name: "Delete this stored recording" }).click();
});
