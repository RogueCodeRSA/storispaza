import { spawnSync } from "node:child_process";
import env from "@next/env";
if (process.env.RUN_PAID_TRANSLATION !== "1" || process.env.CI) { console.error("Disabled. Explicit local RUN_PAID_TRANSLATION=1 is required for one unapproved six-page draft."); process.exit(1); }
env.loadEnvConfig(process.cwd(), true, { info() {}, error() {} });
const result = spawnSync(process.execPath, ["node_modules/vitest/vitest.mjs", "run", "tests/paid/translation.test.ts", "--no-file-parallelism"], { stdio: "inherit" }); process.exit(result.status ?? 1);
