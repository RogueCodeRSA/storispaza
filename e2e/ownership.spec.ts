import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

test("M6 private defaults, review blockers, sharing and deletion controls work on keyboard/mobile", async ({ page }, info) => {
  await page.goto("/speak");
  await page.getByLabel(/I consent to unencrypted local storage/).check();
  await page.getByRole("button", { name: "Open / restore StoriSpeak review" }).click();
  await expect(page.getByRole("textbox", { name: "en-page-01 script", exact: true })).toBeVisible();
  await page.goto("/own");
  await page.getByRole("button", { name: "Open / refresh private edition" }).focus(); await page.keyboard.press("Enter");
  await expect(page.getByLabel("Export visibility")).toHaveValue("private");
  await expect(page.getByText("Mock rehearsals cannot become approved publications.", { exact: true })).toBeVisible();
  const json = page.getByRole("button", { name: "Download story JSON + provenance" }); await expect(json).toBeDisabled();
  await page.getByLabel("Export visibility").selectOption("shared");
  await expect(page.getByLabel(/I have permission from relevant contributors/)).not.toBeChecked();
  await page.getByRole("button", { name: "Save edition choices" }).click();
  await expect(page.getByText("Consent is required for shared export.", { exact: true })).toBeVisible();
  await page.getByLabel(/I have permission from relevant contributors/).check();
  await page.getByRole("button", { name: "Save edition choices" }).click();
  await expect(page.getByText("Consent is required for shared export.", { exact: true })).toHaveCount(0);
  await expect(json).toBeDisabled();
  await page.getByLabel(/Include available current approved adult page narration/).check();
  await expect(page.getByLabel(/I consent to copying my approved adult narration/)).not.toBeChecked();
  await expect(page.getByRole("button", { name: "Delete all recordings" })).toBeDisabled();
  await page.getByLabel(/Delete all retained workspace recordings/).check();
  await page.getByRole("button", { name: "Delete all recordings" }).click();
  await expect(page.getByRole("status").filter({ hasText: "All workspace recordings deleted" })).toBeVisible();
  await expect(page.getByLabel(/I consent to copying my approved adult narration/)).not.toBeChecked();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath("m6-review-blocked.png"), fullPage: true });
});

test("M6 approved-edition controls download both files and recheck stale confirmations", async ({ page }) => {
  // Synthetic UI state; actual export/approval enforcement is tested against the server in ownership.test.ts.
  let revision = 1; let changed = false;
  await page.route("**/api/ownership", async route => {
    const body = route.request().postDataJSON();
    if (body.action === "export") {
      if (changed) return route.fulfill({ status: 409, json: { error: { message: "Content changed. Refresh and review the current edition." } } });
      return route.fulfill({ body: body.format === "json" ? '{"testOnly":true}' : readFileSync(".tools/m6-test-reader.html", "utf8"), contentType: body.format === "json" ? "application/json" : "text/html" });
    }
    if (body.action === "settings") revision++;
    return route.fulfill({ json: { revision, title: "TEST ONLY edition", ownership: body.ownership ?? { creator: "Test creator", visibility: "private", sharingConsent: false, assumptionsConfirmed: true }, issues: [], recordingCount: 0, pages: [] } });
  });
  await page.goto("/own"); await page.getByRole("button", { name: "Open / refresh private edition" }).click();
  const final = page.getByLabel(/I reviewed this current edition/); const json = page.getByRole("button", { name: "Download story JSON + provenance" });
  await expect(json).toBeDisabled(); await final.focus(); await page.keyboard.press("Space");
  for (const [name, filename] of [["Download story JSON + provenance", "storispaza-story.json"], ["Download offline HTML reader", "storispaza-story.html"]]) {
    const download = page.waitForEvent("download"); await page.getByRole("button", { name, exact: true }).click(); expect((await download).suggestedFilename()).toBe(filename);
  }
  await page.getByLabel("Creator / attribution name").fill("Changed creator"); await expect(final).not.toBeChecked(); await expect(json).toBeDisabled();
  await page.getByRole("button", { name: "Save edition choices" }).click(); await final.check(); changed = true; await json.click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText("Content changed"); await expect(final).not.toBeChecked();
});

test("M6 actual server-generated standalone HTML opens offline without network or scripts", async ({ page, context }, info) => {
  const external: string[] = []; page.on("request", request => { if (/^https?:/.test(request.url())) external.push(request.url()); });
  await context.setOffline(true);
  await page.goto(pathToFileURL(resolve(".tools/m6-test-reader.html")).href);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText('<script>alert("test")</script>');
  await expect(page.locator("article")).toHaveCount(6); await expect(page.locator('p[lang="st"]')).toHaveCount(6);
  expect(await page.locator("img").evaluateAll(images => images.every(image => image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0))).toBe(true);
  await expect(page.locator("audio,script")).toHaveCount(0);
  await page.getByRole("link", { name: "Page 6", exact: true }).click(); await expect(page.locator("#page-6")).toBeInViewport();
  expect(external).toEqual([]); expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath("m6-offline-reader.png"), fullPage: true });
});
