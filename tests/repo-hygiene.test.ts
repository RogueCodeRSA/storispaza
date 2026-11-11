import { execFileSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { expect, it } from "vitest";

it("public evaluation scan rejects tracked private paths and credentials without printing their values", () => {
  const directory = mkdtempSync(join(tmpdir(), "storispaza-hygiene-"));
  const script = resolve("scripts/check-repo.mjs");
  const git = (args: string[]) => execFileSync("git", args, { cwd: directory, stdio: "pipe" });
  const scan = () => {
    try { return { status: 0, output: execFileSync(process.execPath, [script], { cwd: directory, encoding: "utf8" }) }; }
    catch (error) { const failure = error as { status: number; stdout: string }; return { status: failure.status, output: failure.stdout }; }
  };
  try {
    git(["init", "--quiet"]); writeFileSync(join(directory, "README.md"), "Public-safe project"); git(["add", "README.md"]);
    expect(scan().status).toBe(0);
    const secret = "sk-" + "testonlynotavalidcredential123456789";
    writeFileSync(join(directory, ".env.local"), `SERVICE_API_KEY=${secret}\n`); git(["add", ".env.local"]);
    const result = scan(); expect(result.status).toBe(1); expect(result.output).toContain(".env.local"); expect(result.output).not.toContain(secret);
    git(["rm", "--cached", "--quiet", ".env.local"]); writeFileSync(join(directory, ".gitignore"), ".env.local\n");
    writeFileSync(join(directory, "leak.txt"), secret); expect(scan().status).toBe(1);
    writeFileSync(join(directory, "leak.txt"), "Public text"); writeFileSync(join(directory, "private.wav"), "test-only"); git(["add", "private.wav"]); expect(scan().status).toBe(1);
    expect(readFileSync(join(directory, "README.md"), "utf8")).toBe("Public-safe project");
  } finally { rmSync(directory, { recursive: true, force: true }); }
});

it("allows only manifest-verified adult fixtures and cannot use unstaged consent to authorize staged audio", () => {
  const directory = mkdtempSync(join(tmpdir(), "storispaza-consented-index-"));
  const script = resolve("scripts/check-repo.mjs");
  const git = (args: string[]) => execFileSync("git", args, { cwd: directory, stdio: "pipe" });
  const scan = () => { try { execFileSync(process.execPath, [script, "--staged"], { cwd: directory, stdio: "pipe" }); return 0; } catch (error) { return (error as { status: number }).status; } };
  try {
    git(["init", "--quiet"]); mkdirSync(join(directory, "fixtures"));
    cpSync(resolve("fixtures/approved-speech"), join(directory, "fixtures/approved-speech"), { recursive: true });
    git(["add", "fixtures"]); expect(scan()).toBe(0);
    const path = join(directory, "fixtures/approved-speech/manifest.json"); const original = readFileSync(path);
    const manifest = JSON.parse(original.toString()); manifest.redistributionConsent = false;
    writeFileSync(path, JSON.stringify(manifest)); git(["add", "fixtures/approved-speech/manifest.json"]);
    writeFileSync(path, original); expect(scan()).toBe(1);
    git(["add", "fixtures/approved-speech/manifest.json"]); expect(scan()).toBe(0);
    const clip = join(directory, "fixtures/approved-speech/en-page-01.wav"); const changed = readFileSync(clip); changed[44] ^= 1;
    writeFileSync(clip, changed); git(["add", "fixtures/approved-speech/en-page-01.wav"]); expect(scan()).toBe(1);
  } finally { rmSync(directory, { recursive: true, force: true }); }
}, 20_000);
