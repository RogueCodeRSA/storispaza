import { build } from "esbuild";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { reviewedSpeechPack } from "./reviewed-speech.mjs";

let edition = ""; let reviewedClips = 0;
if (existsSync("fixtures/approved-speech/manifest.json")) {
  const { manifest, book, files } = reviewedSpeechPack(readFileSync);
  const images = Object.values(JSON.parse(readFileSync("fixtures/image-pack.json", "utf8")).images);
  for (const page of book.pages) {
    const image = images.find(value => value.page === page.number && value.approved && value.redistributionConsent);
    if (!image) throw new Error("Missing approved offline illustration.");
    page.imageUrl = image.dataUrl;
  }
  const slots = [...book.pages.flatMap(page => [page.text.en, page.text.st]), ...Object.values(book.interaction).flatMap(Object.values), ...Object.values(book.vocabulary).flat()];
  for (const slot of slots) {
    const id = new URL(slot.audio.url, "http://localhost").searchParams.get("fixtureClip");
    slot.audio.url = `data:audio/wav;base64,${files.get(`fixtures/approved-speech/${id}.wav`).toString("base64")}`;
  }
  const json = value => JSON.stringify(value).replaceAll("<", "\\u003c");
  edition = `<script type="application/json" id="reviewed-edition">${json({ book, story: manifest.story })}</script><script type="application/json" id="fixture-provenance">${json(manifest)}</script>`;
  reviewedClips = files.size;
}

const result = await build({
  entryPoints: ["src/offline/entry.tsx"], bundle: true, write: false, minify: true,
  platform: "browser", format: "iife", target: ["chrome100"], jsx: "automatic",
  define: { "process.env.NODE_ENV": '"production"' },
  outfile: "journey.js", legalComments: "inline", metafile: true,
});
const script = result.outputFiles.find(file => file.path.endsWith(".js"))?.text;
const css = result.outputFiles.find(file => file.path.endsWith(".css"))?.text;
if (!script || !css) throw new Error("Offline bundle did not produce script and styles.");
const csp = "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; media-src data: blob:; connect-src 'none'; base-uri 'none'; form-action 'none'";
const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="${csp}"><title>StoriSpaza — offline story</title><style>body{margin:0;background:#faf5e9}${css.replace(/<\/style/gi, "<\\/style")}</style></head><body><div id="root"></div><noscript>Enable JavaScript to read this self-contained offline story.</noscript>${edition}<script>${script.replace(/<\/script/gi, "<\\/script")}</script></body></html>`;
const hash = createHash("sha256").update(html).digest("hex");
// Ensure browser bundling has not pulled in a server environment or private file.
if (Object.keys(result.metafile.inputs).some(path => /src\/server\/|node:/.test(path))) throw new Error("Server dependency in offline bundle.");
const manifest = JSON.parse(await readFile("fixtures/manifest.json", "utf8"));
if (manifest.humanReviewed !== false) throw new Error("M1 fixture review status unexpectedly changed.");
await mkdir("public/offline", { recursive: true });
await writeFile("public/offline/storispaza-offline.html", html);
await writeFile("public/offline/build.json", JSON.stringify({ milestone: reviewedClips ? "M4" : "M1", status: reviewedClips ? "reviewed-fixture-replay-with-unreviewed-copy-editor" : "provisional-unreviewed", reviewedClips, bytes: Buffer.byteLength(html), sha256: hash, inputs: Object.keys(result.metafile.inputs).length }, null, 2));
console.log(`Offline story: public/offline/storispaza-offline.html (${Math.ceil(Buffer.byteLength(html) / 1024)} KiB, ${reviewedClips} reviewed clips), SHA256 ${hash}`);
