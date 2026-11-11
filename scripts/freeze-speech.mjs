import { spawnSync } from "node:child_process";
import env from "@next/env";
if (process.env.FREEZE_REVIEWED_SPEECH !== "1" || process.env.CI) { console.error("Disabled. Local opt-in plus actual in-app review/freeze/redistribution consent are required."); process.exit(1); }
env.loadEnvConfig(process.cwd(), true, { info() {}, error() {} });
const result = spawnSync(process.execPath, ["node_modules/vitest/vitest.mjs", "run", "tests/paid/freeze-speech.test.ts", "--no-file-parallelism"], { stdio: "inherit" }); process.exit(result.status ?? 1);
