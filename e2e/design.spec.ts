import { test, expect } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { demoStory } from "../fixtures/demo-story";
import { initialSpeechProject } from "../src/domain/speech";
import { readerBook } from "../src/domain/reader";

test("reader-first cover and all six illustrations stay dominant without status clutter or placeholders", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".book-panel img")).not.toHaveAttribute("src", /placeholder/);
  await page.getByRole("link",{name:"Read the story",exact:true}).click();
  await expect(page).toHaveURL(/\/play$/);
  await expect(page.locator(".review-status")).not.toHaveAttribute("open");
  await expect(page.locator(".review-badge")).toHaveCount(1);
  expect(await page.locator("body").innerText()).not.toContain("M4 content review remains open");
  for (let number = 1; number <= 6; number++) {
    await page.getByRole("navigation",{name:"Reader pages"}).getByRole("button",{name:`Page ${number}`,exact:true}).click();
    const image = page.locator(".play-illustration img");
    await expect.poll(() => image.evaluate((value:HTMLImageElement)=>value.complete && value.naturalWidth === 1024)).toBe(true);
    await expect(image).not.toHaveAttribute("src", /placeholder|\.svg/);
    const art = await image.boundingBox(); const spread = await page.locator(".reader-spread").boundingBox();
    expect(art!.width / spread!.width).toBeGreaterThan(.55);
  }
  expect(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("only current reviewed Sesotho gets a named review badge", async ({ page }) => {
  // Injected review state is test-only, never creator review evidence.
  const project = initialSpeechProject(structuredClone(demoStory),randomUUID(),"real");
  project.story.creator = "Test Reviewer";
  const script = project.scripts.find(value=>value.id === "st-page-01")!;
  script.text = "Test-only reviewed language slot"; script.status = "approved";
  await page.route("**/api/reader",route=>route.fulfill({json:{book:readerBook(project)}}));
  await page.goto("/play"); await expect(page.locator(".review-badge")).toHaveText("Sesotho reviewed by Test Reviewer");
  script.status = "edited"; await page.reload();
  await expect(page.locator(".review-badge")).toHaveText("Language review pending");
  expect(await page.locator("body").innerText()).not.toContain("Sesotho reviewed by Test Reviewer");
});

test("page-turn and response spark preserve keyboard flow and respect reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion:"no-preference" }); await page.goto("/play");
  await expect(page.getByRole("heading",{name:"Page 1 · English",exact:true})).toBeVisible();
  expect(await page.locator(".page-turn").evaluate(value=>getComputedStyle(value).animationName)).toBe("story-page-turn");
  await page.getByRole("button",{name:"Start reading turn",exact:true}).click();
  await expect(page.getByRole("button",{name:"I responded — continue without microphone"})).toBeFocused();
  expect(await page.locator(".spark-waiting span").first().evaluate(value=>getComputedStyle(value).animationName)).toBe("story-spark");
  await page.emulateMedia({ reducedMotion:"reduce" });
  expect(await page.locator(".spark-waiting span").first().evaluate(value=>getComputedStyle(value).animationName)).toBe("none");
  await page.keyboard.press("Enter"); await expect(page.getByText(/Reading turn complete\./)).toBeFocused();
  await page.getByRole("button",{name:"Next page",exact:true}).focus(); await page.keyboard.press("Enter");
  await expect(page.getByRole("heading",{name:"Page 2 · English",exact:true})).toBeFocused();
  expect(await page.locator(".page-turn").evaluate(value=>getComputedStyle(value).animationName)).toBe("none");
  for (const button of await page.locator(".reader-progress button").all()) {
    const size = await button.boundingBox(); expect(size!.height).toBeGreaterThanOrEqual(48); expect(size!.width).toBeGreaterThanOrEqual(48);
  }
});
