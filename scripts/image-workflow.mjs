import { spawnSync } from "node:child_process";
import env from "@next/env";
if (process.env.RUN_IMAGE_WORKFLOW !== "1" || process.env.CI || !["pages", "regenerate", "freeze"].includes(process.env.M3_ACTION)) {
  console.error("Disabled. Explicit local RUN_IMAGE_WORKFLOW=1 and an authorized M3_ACTION are required.");
  process.exit(1);
}
env.loadEnvConfig(process.cwd(), true, { info() {}, error() {} });
const result = spawnSync(process.execPath, ["node_modules/vitest/vitest.mjs", "run", "tests/paid/image-workflow.test.ts", "--no-file-parallelism"], { stdio: "inherit" });
process.exit(result.status ?? 1);
