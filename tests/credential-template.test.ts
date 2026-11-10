import { readFileSync } from "node:fs";
import { expect, it } from "vitest";

it("keeps credential assignments blank in the tracked environment example", () => {
  const example = readFileSync(".env.example", "utf8");
  for (const line of example.split(/\r?\n/)) {
    if (/^[A-Z0-9_]*(?:KEY|TOKEN|SECRET)\s*=/.test(line)) expect(line.split("=").slice(1).join("=").trim()).toBe("");
  }
});
