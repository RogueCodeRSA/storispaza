import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, it } from "vitest";

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? sourceFiles(join(directory, entry.name)) : /\.(?:ts|tsx)$/.test(entry.name) ? [join(directory, entry.name)] : []);
}
it("keeps vendor configuration, model IDs and SDK references inside adapter files", () => {
  const violations = sourceFiles("src").filter(path => !path.replaceAll("\\", "/").includes("/providers/adapters/") && /cloudflare|@cf\/|OPENAI_|CLOUDFLARE_|from ["']openai["']|gpt-\d/i.test(readFileSync(path, "utf8")));
  expect(violations).toEqual([]);
});
