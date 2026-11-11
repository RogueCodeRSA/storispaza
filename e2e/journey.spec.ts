import { expect, test, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

async function stage(page: Page, name: string) {
  await page.getByRole("navigation", { name: "Story stages" }).getByRole("button", { name: new RegExp(name) }).click();
  await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
}
async function selectPage(page: Page, number: number) {
  await page.getByRole("navigation", { name: "Story pages" }).getByRole("button", { name: `Page ${number}`, exact: true }).click();
}

for (const source of ["Next.js", "standalone file"] as const) {
  test(`five-stage journey offline — ${source}`, async ({ page, context }, testInfo) => {
    test.setTimeout(60_000);
    const external: string[] = [];
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    await context.route("**/*", route => {
      const url = new URL(route.request().url());
      if (url.protocol === "file:" || url.hostname === "127.0.0.1") return route.continue();
      external.push(route.request().url()); return route.abort();
    });
    if (source === "standalone file") await context.setOffline(true);
    await page.goto(source === "Next.js" ? "/studio" : pathToFileURL(resolve("public/offline/storispaza-offline.html")).href);
    await expect(page.getByText("Create a six-page illustrated story, review English and Sesotho side by side, then read and respond together.")).toBeVisible();
    await expect(page.getByText("Create a six-page illustrated story, review English and Sesotho side by side, then read and respond together.")).toBeInViewport();
    await expect(page.getByRole("button", { name: "Start the mock journey" })).toBeInViewport();
    await page.screenshot({ path: testInfo.outputPath("m1-welcome.png"), fullPage: true });
    await page.getByRole("button", { name: "Start the mock journey" }).click();
    if (source === "Next.js") await context.setOffline(true);
    await page.getByRole("button", { name: "Load six-page demo story" }).click();
    await expect(page.getByLabel("English narrative")).toBeVisible();
    for (let n = 1; n <= 6; n++) {
      await selectPage(page, n);
      const narrative = page.getByLabel("English narrative");
      await narrative.fill(`${await narrative.inputValue()} Creator edit ${n}.`);
      await page.getByLabel(/I acknowledge this page's provisional English text/).check();
    }
    await page.getByRole("button", { name: "Continue to StoriCreate" }).click();
    for (let n = 1; n <= 6; n++) {
      await selectPage(page, n);
      if (n === 2) {
        await page.getByRole("button", { name: "Regenerate this page placeholder" }).click();
        await expect(page.getByRole("status")).toContainText("Page 2 placeholder changed");
      }
      await page.getByLabel(/I acknowledge this image source and draft review status/).check();
    }
    await page.getByRole("button", { name: "Continue to StoriSpeak" }).click();
    for (let n = 1; n <= 6; n++) {
      await selectPage(page, n);
      await expect(page.getByText("Sesotho text · Provisional / unreviewed", { exact: true })).toBeVisible();
      await page.getByLabel("Sesotho text · provisional / unreviewed").fill(`[Sesotho placeholder ${n} — awaiting creator review]`);
      await page.getByLabel(/I acknowledge this Sesotho text needs a fluent review/).check();
    }
    await page.getByRole("button", { name: "Continue to StoriPlay" }).click();
    await expect(page.getByText("Audio placeholder · Provisional / unreviewed", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Play placeholder audio", exact: true }).click();
    await expect(page.getByRole("button", { name: "Pause placeholder audio", exact: true })).toBeVisible();
    await expect.poll(() => page.locator("audio").evaluate((audio: HTMLAudioElement) => audio.currentTime)).toBeGreaterThan(0);
    await page.getByRole("button", { name: "Pause placeholder audio", exact: true }).click();
    const paused = await page.locator("audio").evaluate((audio: HTMLAudioElement) => audio.currentTime);
    await page.getByRole("button", { name: "Play placeholder audio", exact: true }).click();
    await expect.poll(() => page.locator("audio").evaluate((audio: HTMLAudioElement) => audio.currentTime)).toBeGreaterThan(paused);
    await page.getByRole("group", { name: "Reader language" }).getByRole("button", { name: "Sesotho", exact: true }).click();
    await expect(page.getByText("Sesotho text · Provisional / unreviewed", { exact: true })).toBeVisible();
    await expect(page.locator(".narrative")).toContainText("Sesotho placeholder 6");
    await page.getByRole("button", { name: "Previous page", exact: true }).click();
    await expect(page.locator(".narrative")).toContainText("Sesotho placeholder 5");
    await page.getByRole("button", { name: "Start opening placeholder" }).click();
    await expect(page.getByRole("button", { name: "I responded — continue" })).toBeVisible({ timeout: 8000 });
    await expect(page.locator("audio")).toHaveJSProperty("paused", true);
    await page.getByRole("button", { name: "I responded — continue" }).click();
    await expect(page.getByText("Call-and-response demo complete.")).toBeVisible({ timeout: 8000 });
    await page.screenshot({ path: testInfo.outputPath("m1-reader.png"), fullPage: true });
    await page.getByRole("button", { name: "Continue to StoriOwn" }).click();
    await expect(page.getByRole("button", { name: "Export provisional story JSON" })).toBeDisabled();
    await page.getByLabel(/I understand these cultural details are draft assumptions/).check();
    await page.getByRole("combobox", { name: /Visibility/ }).selectOption("shared");
    await expect(page.getByRole("button", { name: "Export provisional story JSON" })).toBeDisabled();
    await page.getByLabel(/I consent to distributing an explicitly provisional/).check();
    await expect(page.getByRole("button", { name: "Add placeholder recording copy" })).toBeDisabled();
    await page.getByLabel(/Keep a placeholder recording copy in this draft/).check();
    await page.getByRole("button", { name: "Add placeholder recording copy" }).click();
    await page.getByLabel(/Save this provisional draft on this device/).check();
    await page.getByRole("button", { name: "Save provisional draft", exact: true }).click();
    await expect(page.getByRole("status")).toContainText("draft saved on this device");
    await page.getByRole("button", { name: "Delete recording copy", exact: true }).click();
    await expect(page.getByText("No recording copy attached.")).toBeVisible();
    const jsonDownload = page.waitForEvent("download");
    await page.getByRole("button", { name: "Export provisional story JSON" }).click();
    const json = JSON.parse(await readFile(await (await jsonDownload).path(), "utf8"));
    expect(json.story.pages).toHaveLength(6);
    expect(json.reviewStatus).toBe("provisional-unreviewed");
    expect(json.recordingCopy).toBe(false);
    expect(json.story.pages[0].narrative).toContain("Creator edit 1");
    expect(json.story.pages[0].translation.status).toBe("edited");
    const readerDownload = page.waitForEvent("download");
    await page.getByRole("button", { name: "Export provisional HTML reader" }).click();
    const reader = await readFile(await (await readerDownload).path(), "utf8");
    expect(reader).toContain("PROVISIONAL / UNREVIEWED");
    expect(reader).toContain("Creator edit 6");
    await page.getByRole("button", { name: "Restore saved demo draft" }).click();
    await expect(page.getByLabel("English narrative")).toHaveValue(/Creator edit 1/);
    await stage(page, "StoriOwn");
    await expect(page.getByText("No recording copy attached.")).toBeVisible();
    await stage(page, "StoriStart");
    await page.getByLabel("English narrative").fill("Changed again after acknowledgement.");
    await stage(page, "StoriOwn");
    await expect(page.getByRole("button", { name: "Export provisional story JSON" })).toBeDisabled();
    if (source === "standalone file") {
      await page.reload();
      await page.getByRole("button", { name: "Restore saved demo draft" }).click();
      await expect(page.getByLabel("English narrative")).toHaveValue(/Creator edit 1/);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(external).toEqual([]);
    expect(errors).toEqual([]);
  });
}

test("storage and audio failures keep the draft usable", async ({ page }) => {
  await page.goto("/studio");
  await page.getByRole("button", { name: "Start the mock journey" }).click();
  await page.getByRole("button", { name: "Try fixture voice transcript" }).click();
  await expect(page.getByLabel("English narrative")).toBeVisible();
  await stage(page, "StoriPlay");
  await page.evaluate(() => { HTMLMediaElement.prototype.play = () => Promise.reject(new Error("blocked")); });
  await page.getByRole("button", { name: "Play placeholder audio", exact: true }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText("Audio could not start");
  await stage(page, "StoriOwn");
  await page.evaluate(() => { Storage.prototype.setItem = () => { throw new Error("unavailable"); }; });
  await page.getByLabel(/Save this provisional draft on this device/).check();
  await page.getByRole("button", { name: "Save provisional draft", exact: true }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText("Could not save on this device");
  await stage(page, "StoriStart");
  await expect(page.getByLabel("English narrative")).toBeVisible();
});
