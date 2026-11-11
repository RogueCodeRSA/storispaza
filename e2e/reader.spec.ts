import { test, expect, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { demoStory } from "../fixtures/demo-story";
import { initialSpeechProject } from "../src/domain/speech";
import { readerBook, type ReaderBook } from "../src/domain/reader";
import { encodeCaptureWav } from "../src/domain/capture";

async function denyMicrophone(page: Page) {
  await page.addInitScript(() => { navigator.mediaDevices.getUserMedia = async () => { throw new Error("M5 must not request a microphone"); }; });
}
async function injectBook(page: Page, book: ReaderBook) { await page.route("**/api/reader", route => route.fulfill({ json: { book } })); }
async function injectLegacyDemo(page: Page) {
  const book = readerBook(initialSpeechProject(structuredClone(demoStory), randomUUID(), "mock"));
  for (const entry of book.pages) for (const language of ["en", "st"] as const) entry.text[language].audio = { id: `demo-${language}-${entry.number}`, url: "/api/reader?demoTone=1", seconds: 6, provisional: true };
  await injectBook(page, book);
}

test("M5 bilingual page reading, pause/resume, next-page preload and keyboard navigation", async ({ page }, info) => {
  await denyMicrophone(page); await injectLegacyDemo(page);
  const requests: string[] = []; page.on("request", request => requests.push(request.url()));
  await page.goto("/play");
  await expect(page.getByRole("heading", { name: "Page 1 · English", exact: true })).toBeVisible();
  await page.locator(".review-status summary").click();
  await expect(page.getByText("Provisional non-speech demo audio", { exact: false })).toBeVisible();
  await page.locator(".review-status summary").click();
  await expect.poll(() => requests.some(url => url.includes("/api/reader?image=2"))).toBe(true);
  const media = page.locator("audio");
  await page.getByRole("button", { name: "Play audio sample", exact: true }).click();
  await expect(page.locator(".narrative")).toHaveClass(/reading/);
  await expect.poll(() => media.evaluate((audio: HTMLAudioElement) => audio.currentTime)).toBeGreaterThan(.25);
  await page.getByRole("button", { name: "Pause audio sample" }).click();
  const paused = await media.evaluate((audio: HTMLAudioElement) => audio.currentTime);
  await expect(page.locator(".audio-status")).toContainText("paused");
  await page.getByRole("slider", { name: "Narration position" }).focus(); await page.keyboard.press("ArrowRight");
  await expect.poll(() => media.evaluate((audio: HTMLAudioElement) => audio.currentTime)).toBeGreaterThan(paused);
  await page.getByRole("button", { name: "Resume audio sample" }).click();
  await expect.poll(() => media.evaluate((audio: HTMLAudioElement) => audio.currentTime)).toBeGreaterThan(paused);
  await page.getByRole("button", { name: "Next page", exact: true }).focus(); await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "Page 2 · English", exact: true })).toBeFocused();
  expect(await media.evaluate((audio: HTMLAudioElement) => audio.paused)).toBe(true);
  await page.getByRole("button", { name: "Previous page", exact: true }).click();
  await page.getByRole("button", { name: "Play audio sample", exact: true }).click();
  await expect.poll(() => media.evaluate((audio: HTMLAudioElement) => audio.currentTime)).toBeGreaterThanOrEqual(paused);
  await page.getByRole("group", { name: "Reading language" }).getByRole("button", { name: "Sesotho", exact: true }).focus(); await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "Page 1 · Sesotho", exact: true })).toBeFocused();
  await expect(page.getByLabel("Page 1 Sesotho text")).toContainText("after the creator adds it");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath("m5-provisional-reader.png"), fullPage: true });
});

test("M5 missing narration and phrases stay provisional, unapproved vocabulary is excluded, text response completes", async ({ page }) => {
  await denyMicrophone(page);
  const project = initialSpeechProject(structuredClone(demoStory), randomUUID(), "real");
  const word = project.scripts.find(script => script.id === "en-word-01")!; word.status = "approved";
  project.scripts.find(script => script.id === "en-word-03")!.text = "DO NOT SHOW UNREVIEWED WORD";
  project.scripts.find(script => script.id === "st-page-01")!.text = "Test-only translation slot; not real Sesotho";
  await injectBook(page, readerBook(project)); await page.goto("/play");
  await page.locator(".review-status summary").click();
  await expect(page.getByText(/Provisional audio — recording pending; text-only page/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Play audio sample" })).toHaveCount(0);
  await expect(page.getByText(/light · read aloud together/)).toBeVisible();
  await expect(page.getByText("DO NOT SHOW UNREVIEWED WORD")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /^Listen to/ })).toHaveCount(0);
  await page.getByRole("button", { name: "Start reading turn" }).focus(); await page.keyboard.press("Enter");
  const respond = page.getByRole("button", { name: "I responded — continue without microphone" });
  await expect(respond).toBeFocused(); await expect(page.getByText(/Your turn\. Respond aloud/)).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(page.getByText(/Reading turn complete\./)).toBeFocused();
  await expect(page.getByText(/Provisional interaction — missing phrase review or recordings/)).toBeVisible();
  await expect(page.getByRole("link", { name: /StoriSpeak → Open/ })).toHaveAttribute("href", "/speak#interaction-scripts");
  await page.getByRole("group", { name: "Reading language" }).getByRole("button", { name: "Sesotho", exact: true }).click();
  await expect(page.getByLabel("Page 1 Sesotho text")).toContainText("Test-only translation slot");
  await expect(page.getByText(/Provisional text — review pending/)).toBeVisible();
});

test("M5 current reviewed vocabulary and a full recorded opening/response/continuation use one player", async ({ page }) => {
  await denyMicrophone(page);
  const project = initialSpeechProject(structuredClone(demoStory), randomUUID(), "mock");
  for (const [id, text] of [["en-opening","Test author supplied opening"],["en-response","Test author supplied response"],["en-continuation","Test author supplied continuation"],["en-word-01","light"]]) {
    const script = project.scripts.find(script => script.id === id)!; script.text = text; script.status = "approved";
    script.clip = { id:randomUUID(),scriptVersion:script.version,sha256:"0".repeat(64),seconds:1,approved:true,adultOwnVoice:true };
  }
  await injectBook(page, readerBook(project));
  const bytes = Buffer.from(encodeCaptureWav(Float32Array.from({length:16000},(_,i)=>Math.sin(i/11)*.04),16000));
  await page.route("**/api/reader?clip=*", route => route.fulfill({contentType:"audio/wav",body:bytes}));
  await page.goto("/play");
  const word = page.getByRole("button",{name:"Listen to light",exact:true}); await expect(word).toBeVisible(); await word.click();
  await expect(page.locator(".audio-status")).toContainText("Playing English word light");
  await page.getByRole("button",{name:"Start reading turn"}).click();
  const respond = page.getByRole("button",{name:"I responded — continue without microphone"});
  await expect(respond).toBeFocused();
  await page.keyboard.press("Tab"); await expect(page.getByRole("button",{name:"Play response example"})).toBeFocused(); await page.keyboard.press("Enter");
  await expect(respond).toBeFocused(); await page.keyboard.press("Enter");
  await expect(page.getByText(/Reading turn complete\./)).toBeFocused();
  await page.locator(".review-status summary").click();
  await expect(page.getByText(/Provisional interaction — missing phrase review or recordings/)).toBeVisible();
  expect(await page.locator("audio").count()).toBe(1);
});

test("M5 reduced-data mode skips preloads and audio errors keep text, position and retry usable", async ({ page }) => {
  await page.addInitScript(() => { Object.defineProperty(navigator,"connection",{value:{saveData:true,effectiveType:"2g"}}); });
  const imageRequests: string[]=[]; page.on("request",request=>{if(request.url().includes("/api/reader?image="))imageRequests.push(request.url());});
  await injectLegacyDemo(page);
  let failed = false;
  await page.route("**/api/reader?demoTone=1", route=> { if(!failed){ failed=true; return route.abort(); } return route.continue(); });
  await page.goto("/play"); await expect(page.getByRole("heading",{name:"Page 1 · English",exact:true})).toBeVisible();
  await page.getByRole("button",{name:"Play audio sample",exact:true}).click();
  await expect(page.locator(".audio-status")).toContainText("Audio unavailable");
  await page.getByRole("button",{name:"Resume audio sample"}).click();
  await expect(page.getByRole("button",{name:"Pause audio sample"})).toBeVisible();
  await page.locator("audio").evaluate((audio:HTMLAudioElement)=>audio.dispatchEvent(new Event("waiting")));
  await expect(page.locator(".audio-status")).toContainText("Buffering");
  await page.getByRole("button",{name:"Pause audio sample"}).click();
  await expect(page.locator(".audio-status")).toContainText("Audio paused");
  expect(imageRequests.some(url=>url.includes("image=2"))).toBe(false);
  for (const button of await page.locator("button:visible").all()) {
    const size=await button.boundingBox(); expect(size?.height).toBeGreaterThanOrEqual(48); expect(size?.width).toBeGreaterThanOrEqual(48);
  }
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
