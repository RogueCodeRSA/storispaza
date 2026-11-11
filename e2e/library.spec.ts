import { expect, test } from "@playwright/test";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

for (const offline of [false, true]) test(`local consented library and five-step save ${offline ? "offline file" : "Next.js"}`, async ({ page, context }, info) => {
  test.setTimeout(60_000);
  const external: string[] = []; const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  if (offline) { await context.setOffline(true); page.on("request", request => { if (/^https?:/.test(request.url())) external.push(request.url()); }); }
  await page.goto(offline ? pathToFileURL(resolve("public/offline/storispaza-offline.html")).href : "/library");
  if (offline) await page.getByRole("button", { name: "Library", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Your local library" })).toBeVisible();
  const cards = page.locator(".library-card"); await expect(cards).toHaveCount(3);
  await expect(cards.first()).toContainText("The Girl Who Spoke to Electricity");
  await expect(cards.nth(1)).toContainText("Example · unreviewed · not a community submission");
  await cards.first().click(); await expect(page.getByRole("heading", { name: "Page 1 · English", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Library", exact: true }).click();
  await page.getByRole("button", { name: /The Rain Jar/ }).click();
  await expect(page.locator(".local-text-reader p[lang=en]")).toContainText("Mia watched rain");
  await expect(page.getByText("Text only. No approved narration is attached.", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "Next page", exact: true }).click(); await expect(page.getByRole("heading", { name: "One more drop" })).toBeVisible();
  await page.getByRole("button", { name: "Add your story", exact: true }).click();
  await page.getByRole("button", { name: "Start the mock journey" }).click();
  await page.getByLabel("Story title", { exact: true }).fill("My local test story");
  await page.getByRole("button", { name: "Load six-page demo story" }).click();
  for (const [stage, label] of [["StoriStart", "I acknowledge this page's provisional English text"], ["StoriCreate", "I acknowledge this image source and draft review status"], ["StoriSpeak", "I acknowledge this Sesotho text needs a fluent review"]]) {
    await page.getByRole("navigation", { name: "Story stages" }).getByRole("button", { name: new RegExp(stage) }).click();
    for (let number = 1; number <= 6; number++) {
      await page.getByRole("navigation", { name: "Story pages" }).getByRole("button", { name: `Page ${number}`, exact: true }).click();
      await page.getByLabel(label, { exact: false }).check();
    }
  }
  for (const stage of ["StoriPlay", "StoriOwn"]) await page.getByRole("navigation", { name: "Story stages" }).getByRole("button", { name: new RegExp(stage) }).click();
  await page.getByLabel("I understand these cultural details are draft assumptions awaiting review.", { exact: true }).check();
  await expect(page.getByRole("combobox", { name: /^Visibility/ })).toHaveValue("private");
  await expect(page.getByRole("button", { name: "Save to library", exact: true })).toBeDisabled();
  await page.getByLabel("Creator credit", { exact: true }).fill("Test Creator");
  await page.getByRole("combobox", { name: /^Visibility/ }).selectOption("shared");
  await page.getByLabel("I consent to distributing an explicitly provisional, unreviewed demo copy.", { exact: true }).check();
  const consent = page.getByLabel("I consent to including this provisional story in this device's library.", { exact: true });
  await consent.check();
  await page.getByLabel("Creator credit", { exact: true }).fill("Updated Test Creator");
  await expect(page.getByRole("button", { name: "Save to library", exact: true })).toBeDisabled();
  await consent.check(); await page.getByRole("button", { name: "Save to library", exact: true }).click();
  await expect(cards).toHaveCount(4); await expect(cards.last()).toContainText("Updated Test Creator");
  await page.reload(); if (offline) await page.getByRole("button", { name: "Library", exact: true }).click();
  await expect(cards).toHaveCount(4); await cards.last().click();
  await expect(page.getByRole("heading", { name: "My local test story" })).toBeVisible();
  await page.getByRole("button", { name: "Remove local library copy" }).click(); await expect(cards).toHaveCount(3);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath("local-library.png"), fullPage: true, animations: "disabled" });
  await page.evaluate(() => localStorage.setItem("storispaza-local-library-v1", JSON.stringify([{ sharingConsent: false, title: "PRIVATE MUST NOT APPEAR" }])));
  await page.reload(); if (offline) await page.getByRole("button", { name: "Library", exact: true }).click();
  await expect(page.getByText(/Library storage is unavailable or invalid/)).toBeVisible();
  await expect(cards).toHaveCount(3); await expect(page.getByText("PRIVATE MUST NOT APPEAR")).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem("storispaza-local-library-v1"))).toContain("PRIVATE MUST NOT APPEAR");
  expect(external).toEqual([]); expect(errors).toEqual([]);
});
