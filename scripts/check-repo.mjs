import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { reviewedSpeechPack } from "./reviewed-speech.mjs";

export function privatePath(path) {
  const name = path.replaceAll("\\", "/");
  return /(?:^|\/)(?:data|\.tools|\.next|node_modules|test-results|playwright-report|coverage)(?:\/|$)/i.test(name)
    || /(?:^|\/)\.env(?:\..*)?$/i.test(name) && name !== ".env.example"
    || /\.(?:sqlite(?:3)?(?:-wal|-shm)?|db(?:-wal|-shm)?|wav|mp3|m4a|ogg|webm|flac|aac|pem|key)$/i.test(name)
    || /^(?:public\/offline\/|fixtures\/approved-speech\/)/i.test(name);
}
export function containsCredential(bytes, knownSecrets = []) {
  const content = bytes.toString("utf8");
  return knownSecrets.some(value => bytes.includes(Buffer.from(value)))
    || /\bsk-[A-Za-z0-9_-]{20,}|-----BEGIN (?:RSA |OPENSSH |EC )?PRIVATE KEY-----|\bAKIA[A-Z0-9]{16}\b/.test(content)
    || /(?:^|\n)[ \t]*(?:export[ \t]+)?[A-Z0-9_]*(?:API_KEY|API_TOKEN|SECRET_ACCESS_KEY|CLIENT_SECRET)[ \t]*=[ \t]*["']?[^\s"'#][^\r\n]{15,}/.test(content);
}
function localSecrets() {
  if (!existsSync(".env.local")) return [];
  return readFileSync(".env.local", "utf8").split(/\r?\n/).flatMap(line => {
    const match = /^\s*(?:export\s+)?([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(line);
    if (!match || !/(?:KEY|TOKEN|SECRET|ACCOUNT_ID)$/.test(match[1])) return [];
    const value = match[2].replace(/^(["'])(.*)\1$/, "$2");
    return value.length >= 12 ? [value] : [];
  });
}
export function scanRepository(staged = false) {
  const git = args => execFileSync("git", args, { encoding: "utf8", maxBuffer: 25_000_000 });
  const paths = [...new Set(git(staged ? ["ls-files", "-z"] : ["ls-files", "--cached", "--others", "--exclude-standard", "-z"]).split("\0").filter(Boolean))];
  const secrets = localSecrets(); const failures = []; let files = 0; let artifacts = 0;
  const index = new Map();
  if (staged && paths.length) {
    if (paths.some(path => /[\r\n]/.test(path))) throw new Error("Unsupported index path.");
    // One binary-safe process avoids hundreds of slow Windows Git launches.
    const output = execFileSync("git", ["cat-file", "--batch"], { input: paths.map(path => `:${path}\n`).join(""), maxBuffer: 128_000_000 });
    let offset = 0;
    for (const path of paths) {
      const end = output.indexOf(10, offset); const header = output.toString("ascii", offset, end);
      const match = /^[a-f0-9]+ blob (\d+)$/.exec(header);
      if (!match) throw new Error("Could not read index blob.");
      const size = Number(match[1]); const start = end + 1;
      index.set(path, output.subarray(start, start + size)); offset = start + size + 1;
    }
  }
  const read = path => staged ? index.get(path) ?? (() => { throw new Error("Missing index file."); })() : readFileSync(path);
  const approvedPaths = new Set();
  if (paths.some(path => path.startsWith("fixtures/approved-speech/"))) {
    try {
      const pack = reviewedSpeechPack(read);
      for (const path of pack.files.keys()) approvedPaths.add(path);
      for (const name of ["manifest.json", "reader.json", "CONSENT.md"]) approvedPaths.add(`fixtures/approved-speech/${name}`);
    } catch { failures.push("fixtures/approved-speech/: consent/approval/hash validation failed"); }
  }
  const check = (path, bytes) => { if (containsCredential(bytes, secrets)) failures.push(`${path}: credential pattern or local credential value`); };
  for (const path of paths) {
    if (privatePath(path) && !approvedPaths.has(path)) failures.push(`${path}: private/generated path`);
    if (staged || existsSync(path)) check(path, read(path));
    files++;
  }
  function artifactsIn(directory) {
    if (!existsSync(directory)) return;
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = `${directory}/${entry.name}`;
      if (entry.isDirectory()) artifactsIn(path);
      else { check(path, readFileSync(path)); artifacts++; }
    }
  }
  artifactsIn(".next/static"); artifactsIn("public/offline");
  // Report filenames/reasons only, never matching content or credential values.
  return { status: failures.length ? "FAIL" : "PASS", staged, files, artifacts, failures };
}
if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  try { const result = scanRepository(process.argv.includes("--staged")); console.log(JSON.stringify(result)); if (result.failures.length) process.exitCode = 1; }
  catch { console.error("Repository scan could not complete; no credential values printed."); process.exitCode = 1; }
}
