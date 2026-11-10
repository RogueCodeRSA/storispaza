import { spawnSync } from "node:child_process";
import env from "@next/env";
if (process.env.RUN_PAID_TESTS !== "1" || process.env.CI) {
  console.error("Paid tests are disabled. Explicitly set RUN_PAID_TESTS=1 locally and provide a synthetic audio path. Never run in CI.");
  process.exit(1);
}
// Load ignored local credentials before Vitest sets NODE_ENV=test (which causes
// Next's loader to intentionally skip .env.local).
env.loadEnvConfig(process.cwd(), true, { info() {}, error() {} });
const result = spawnSync(process.execPath, ["node_modules/vitest/vitest.mjs", "run", "tests/paid/capture.test.ts", "--no-file-parallelism"], { stdio: "inherit" });
process.exit(result.status ?? 1);
