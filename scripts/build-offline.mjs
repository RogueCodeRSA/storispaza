import { build } from "esbuild";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";

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
const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="${csp}"><title>StoriSpaza — offline mock journey</title><style>body{margin:0;background:#faf5e9}${css.replace(/<\/style/gi, "<\\/style")}</style></head><body><div id="root"></div><noscript>Enable JavaScript to run this self-contained offline mock journey.</noscript><script>${script.replace(/<\/script/gi, "<\\/script")}</script></body></html>`;
const hash = createHash("sha256").update(html).digest("hex");
// Ensure browser bundling has not pulled in a server environment or private file.
if (Object.keys(result.metafile.inputs).some(path => /src\/server\/|openai\/|node:/.test(path))) throw new Error("Server dependency in offline bundle.");
const manifest = JSON.parse(await readFile("fixtures/manifest.json", "utf8"));
if (manifest.humanReviewed !== false) throw new Error("M1 fixture review status unexpectedly changed.");
await mkdir("public/offline", { recursive: true });
await writeFile("public/offline/storispaza-offline.html", html);
await writeFile("public/offline/build.json", JSON.stringify({ milestone: "M1", status: "provisional-unreviewed", bytes: Buffer.byteLength(html), sha256: hash, inputs: Object.keys(result.metafile.inputs).length }, null, 2));
console.log(`Offline mock: public/offline/storispaza-offline.html (${Math.ceil(Buffer.byteLength(html) / 1024)} KiB), SHA256 ${hash}`);
