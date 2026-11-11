import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  use: { baseURL: "http://127.0.0.1:3100", trace: "retain-on-failure", launchOptions: { args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"] } },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }, { name: "mobile", use: { ...devices["Pixel 7"] } }],
  webServer: [{
    command: `"${process.execPath}" node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3100`, url: "http://127.0.0.1:3100", reuseExistingServer: false,
    env: { AI_PROVIDER: "mock", DATA_DIR: "./data/e2e-images", OPENAI_API_KEY: "", NEXT_TELEMETRY_DISABLED: "1" },
  }, {
    command: `"${process.execPath}" node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3200`, url: "http://127.0.0.1:3200", reuseExistingServer: false,
    env: { AI_PROVIDER: "real", AI_ADAPTER: "openai", ENABLE_LIVE_AI: "1", DATA_DIR: "./data/e2e-real", OPENAI_API_KEY: "", NEXT_TELEMETRY_DISABLED: "1" },
  }],
});
