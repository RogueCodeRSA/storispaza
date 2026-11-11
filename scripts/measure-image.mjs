import { spawnSync } from "node:child_process";
import env from "@next/env";
if (process.env.RUN_PAID_IMAGE !== "1" || process.env.CI) {
  console.error("Disabled. RUN_PAID_IMAGE=1 is required locally for the authorized ONE-sheet cost measurement.");
  process.exit(1);
}
env.loadEnvConfig(process.cwd(), true, { info() {}, error() {} });
const result = spawnSync(process.execPath, ["node_modules/vitest/vitest.mjs", "run", "tests/paid/illustration.test.ts", "--no-file-parallelism"], { stdio: "inherit" });
process.exit(result.status ?? 1);
