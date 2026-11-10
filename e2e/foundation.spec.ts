import { expect, test } from "@playwright/test";

test("foundation and fixture API work without external network", async ({ page, context }, testInfo) => {
  const external: string[] = [];
  await context.route("**/*", route => {
    const url = new URL(route.request().url());
    if (url.hostname === "127.0.0.1") return route.continue();
    external.push(url.origin);
    return route.abort();
  });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Every story has a place." })).toBeVisible();
  await expect(page.getByText("Mock mode · offline fixtures")).toBeVisible();
  await expect(page.getByRole("list").first().getByRole("listitem")).toHaveCount(5);
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
  await expect(page.getByRole("link", { name: "Try the mock journey" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "The Girl Who Spoke to Electricity" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const response = await page.request.get("/api/demo/story");
  const result = await response.json();
  expect(result.provenance).toBe("mock-fixture");
  expect(result.data.pages).toHaveLength(6);
  expect(result.humanReviewed).toBe(false);
  expect(external).toEqual([]);
  await page.screenshot({ path: testInfo.outputPath("foundation.png"), fullPage: true });
});
