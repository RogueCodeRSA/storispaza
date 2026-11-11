import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import sharp from "sharp";
import { expect, it } from "vitest";
import scenes from "../../docs/M3_SCENES.json";
import { readConfig } from "@/server/config";
import { openDatabase } from "@/server/storage";
import { createProvider } from "@/server/providers";
import { createDollarGuard } from "@/server/allowance";
import { IllustrationWorkspace } from "@/server/illustration-service";

async function contactSheet(workspace: IllustrationWorkspace) {
  const layers = [];
  for (let page = 1; page <= 6; page++) {
    const thumb = await sharp(workspace.asset(workspace.read()!.pages[page - 1]!.assetId)).flatten({ background: "#faf5e9" }).resize(400, 400).toBuffer();
    const left = ((page - 1) % 3) * 420 + 10; const top = Math.floor((page - 1) / 3) * 450 + 35;
    layers.push({ input: thumb, left, top });
    layers.push({ input: Buffer.from(`<svg width="400" height="26"><text x="0" y="20" font-family="Arial" font-size="20" fill="#203e35">Page ${page} · UNREVIEWED</text></svg>`), left, top: top - 28 });
  }
  await sharp({ create: { width: 1260, height: 900, channels: 3, background: "#faf5e9" } }).composite(layers).webp({ quality: 90 }).toFile(".tools/m3-contact-sheet.webp");
}

it.skipIf(process.env.RUN_IMAGE_WORKFLOW !== "1")("explicitly authorized M3 pages or approved freeze; no automatic retries", async () => {
  if (process.env.CI) throw new Error("Local-only workflow.");
  const gatePath = resolve(".tools/m3-sheet-gate.json");
  const gate = JSON.parse(readFileSync(gatePath, "utf8"));
  const config = readConfig({ ...process.env, AI_PROVIDER: "real", ENABLE_LIVE_AI: "1", DATA_DIR: gate.dataDir });
  const db = openDatabase(config.DATA_DIR);
  try {
    const provider = createProvider(config, adapter => createDollarGuard(db, gate.session, adapter, { sessionUsd: config.SESSION_BUDGET_USD, developmentUsd: config.DEVELOPMENT_BUDGET_USD, requestsPerMinute: config.AI_REQUESTS_PER_MINUTE }, config.IMAGE_ATTEMPT_LIMIT));
    const workspace = new IllustrationWorkspace(db, gate.session, config, provider);
    const command = (action: string, extras = {}) => workspace.execute({ action, revision: workspace.read()!.revision, ...extras });
    if (process.env.M3_ACTION === "pages") {
      if (process.env.CREATOR_SHEET_APPROVED !== "1" || process.env.CREATOR_SCENES_CONFIRMED !== "1" || !scenes.confirmedByCreator) throw new Error("Explicit creator approval of sheet, measured cost and scene suggestions is required.");
      if (gate.pageRunStarted) throw new Error("Page run already started. Review state; do not automatically repeat it.");
      await command("approve-sheet", { assetId: gate.assetId, acceptMeasuredCost: true });
      gate.approved = true; gate.pageRunStarted = true; gate.state = "pages-running";
      writeFileSync(gatePath, JSON.stringify(gate, null, 2));
      for (let page = 1; page <= 6; page++) {
        await command("page", { page, prompt: scenes.prompts[page - 1], sceneConfirmed: true });
        const project = workspace.read()!;
        const image = project.pages[page - 1]!;
        writeFileSync(`.tools/m3-page-${page}.webp`, workspace.asset(image.assetId));
        console.log(JSON.stringify({ page, usage: image.usage, attempts: workspace.status().attempts, developmentExposureUsd: workspace.status().exposureUsd, approved: false, frozen: false }));
        if (project.halted) throw new Error("Image work halted. Review usage; do not retry.");
      }
      await contactSheet(workspace);
      gate.state = "awaiting-six-image-approval";
    } else if (process.env.M3_ACTION === "regenerate") {
      if (process.env.CREATOR_SCENES_CONFIRMED !== "1") throw new Error("Creator must confirm the edited scene before regeneration.");
      const page = Number(process.env.M3_PAGE);
      if (!Number.isInteger(page) || page < 1 || page > 6) throw new Error("Select exactly one page 1–6.");
      const previous = workspace.read()!;
      await command("page", { page, prompt: scenes.prompts[page - 1], sceneConfirmed: true });
      const project = workspace.read()!;
      writeFileSync(`.tools/m3-page-${page}.webp`, workspace.asset(project.pages[page - 1]!.assetId));
      if (project.pages.some((image, i) => i !== page - 1 && image?.assetId !== previous.pages[i]?.assetId)) throw new Error("Unrelated image changed.");
      console.log(JSON.stringify({ regeneratedPage: page, usage: project.pages[page - 1]!.usage, attempts: workspace.status().attempts, developmentExposureUsd: workspace.status().exposureUsd, approved: false, frozen: false }));
      await contactSheet(workspace);
      gate.state = "awaiting-six-image-approval";
    } else if (process.env.M3_ACTION === "freeze") {
      if (process.env.CREATOR_IMAGES_APPROVED !== "1" || process.env.CREATOR_REDISTRIBUTION_CONSENT !== "1") throw new Error("Current six-image approval and explicit fixture redistribution consent are required.");
      for (let page = 1; page <= 6; page++) await command("approve-page", { page, assetId: workspace.read()!.pages[page - 1]!.assetId });
      await command("freeze", { redistributionConsent: true });
      const project = workspace.read()!;
      const directory = resolve("fixtures/approved-images"); mkdirSync(directory, { recursive: true });
      const items = [{ file: "character-sheet.webp", image: project.sheet! }, ...project.pages.map((image, i) => ({ file: `page-${i + 1}.webp`, image: image! }))];
      for (const item of items) writeFileSync(resolve(directory, item.file), workspace.asset(item.image.assetId));
      writeFileSync("fixtures/image-pack.json", JSON.stringify({ images: Object.fromEntries(project.pages.map((image, i) => [image!.source.assetId, { page: i + 1, source: image!.source, history: project.story.pages[i].assetHistory, dataUrl: `data:image/webp;base64,${Buffer.from(workspace.asset(image!.assetId)).toString("base64")}`, approved: true, redistributionConsent: true }])) }));
      writeFileSync(resolve(directory, "manifest.json"), JSON.stringify({ milestone: "M3", approvedBy: "creator", redistributionConsent: true, approvedDate: "2026-11-11", invoiceVerified: false, textStatus: "provisional; images only approved", brief: project.brief, scenePrompts: project.pagePrompts,
        history: project.story.pages.map(page => ({ page: page.number, sources: page.assetHistory })),
        images: items.map(({ file, image }) => { const bytes = workspace.asset(image.assetId); return { file, source: image.source, usage: image.usage, approved: image.approved, frozen: image.frozen, bytes: bytes.length, sha256: createHash("sha256").update(bytes).digest("hex") }; }) }, null, 2));
      gate.state = "images-approved-frozen";
    } else throw new Error("Unknown workflow action.");
    gate.revision = workspace.read()!.revision;
    writeFileSync(gatePath, JSON.stringify(gate, null, 2));
    expect(workspace.status().attempts <= 20).toBe(true);
  } finally { db.close(); }
}, 600000);
