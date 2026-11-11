import { expect, test, type Page } from "@playwright/test";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { mkdir } from "node:fs/promises";

async function playing(page: Page) {
  const audio = page.locator("audio");
  await expect.poll(() => audio.evaluate((value: HTMLAudioElement) => value.currentTime)).toBeGreaterThan(0);
  expect(await audio.evaluate((value: HTMLAudioElement) => value.src.startsWith("data:audio/wav;base64,") && !value.error && value.duration > 0)).toBe(true);
}
async function finish(page: Page) {
  await playing(page);
  // Seek the actual decoded recording near its end; use the real ended event.
  await page.locator("audio").evaluate((audio: HTMLAudioElement) => { audio.currentTime = Math.max(0, audio.duration - .05); });
}

test("frozen offline edition plays all 24 approved adult clips and six illustrations without network or microphone", async ({ page, context }, info) => {
  test.setTimeout(120_000);
  const external: string[] = []; const errors: string[] = [];
  page.on("request", request => { if (/^https?:/.test(request.url())) external.push(request.url()); });
  page.on("pageerror", error => errors.push(error.message));
  await page.addInitScript(() => { navigator.mediaDevices.getUserMedia = async () => { throw new Error("No microphone permitted in fixture replay"); }; });
  await context.setOffline(true);
  await page.goto(pathToFileURL(resolve("public/offline/storispaza-offline.html")).href);
  await expect(page.getByRole("heading", { name: "Page 1 · English", exact: true })).toBeVisible();
  await expect(page.locator(".review-badge")).toHaveText("Sesotho reviewed by the creator");
  const played = new Set<string>();
  for (const language of ["English", "Sesotho"]) {
    await page.getByRole("group", { name: "Reading language" }).getByRole("button", { name: language, exact: true }).click();
    for (let number = 1; number <= 6; number++) {
      await page.getByRole("navigation", { name: "Reader pages" }).getByRole("button", { name: `Page ${number}`, exact: true }).click();
      await expect.poll(() => page.locator(".play-illustration img").evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth === 1024)).toBe(true);
      await page.getByRole("button", { name: "Play page audio", exact: true }).click(); await playing(page);
      played.add(await page.locator("audio").getAttribute("src") ?? "");
      await page.getByRole("button", { name: "Pause page audio", exact: true }).click();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
    for (const word of await page.getByRole("button", { name: /^Listen to / }).all()) {
      await word.click(); await playing(page); played.add(await page.locator("audio").getAttribute("src") ?? "");
    }
    await page.getByRole("button", { name: "Start reading turn", exact: true }).click(); await finish(page); played.add(await page.locator("audio").getAttribute("src") ?? "");
    const respond = page.getByRole("button", { name: "I responded — continue without microphone" });
    await expect(respond).toBeFocused();
    await page.getByRole("button", { name: "Play response example" }).click(); await finish(page); played.add(await page.locator("audio").getAttribute("src") ?? "");
    await expect(respond).toBeFocused(); await respond.press("Enter"); await finish(page); played.add(await page.locator("audio").getAttribute("src") ?? "");
    await expect(page.getByText(/Reading turn complete\./)).toBeFocused();
  }
  expect(played.size).toBe(24); expect(external).toEqual([]); expect(errors).toEqual([]);
  await page.getByRole("navigation", { name: "Reader pages" }).getByRole("button", { name: "Page 1", exact: true }).click();
  await mkdir("docs/design", { recursive: true });
  await page.screenshot({ path: `docs/design/m4-frozen-${info.project.name}.png`, fullPage: true, animations: "disabled" });
  await page.locator(".review-status summary").click();
  await expect(page.getByText(/All current scripts and clips in this snapshot have saved human approval/)).toBeVisible();
  await expect(page.getByText(/Current adult recording reviewed in app/)).toBeVisible();
});
