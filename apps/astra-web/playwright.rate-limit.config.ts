import { defineConfig, devices } from "@playwright/test";
import { fileURLToPath } from "node:url";

const emailCaptureDir = fileURLToPath(new URL("../../.astra-email/e2e-rate-limit", import.meta.url));

export default defineConfig({
  testDir: "./e2e",
  testMatch: "auth-rate-limit.spec.ts",
  timeout: 60_000,
  workers: 1,
  expect: {
    timeout: 10_000
  },
  use: {
    baseURL: "http://localhost:3013",
    colorScheme: "light",
    trace: "on-first-retry",
    screenshot: "only-on-failure"
  },
  webServer: {
    command: `ASTRA_EMAIL_DELIVERY=file ASTRA_EMAIL_CAPTURE_DIR=${JSON.stringify(emailCaptureDir)} BETTER_AUTH_URL=http://localhost:3013 npm --workspace @astra/astra-web exec -- next start --port 3013`,
    url: "http://localhost:3013/login",
    reuseExistingServer: false,
    timeout: 120_000
  },
  projects: [
    {
      name: "rate-limit",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } }
    }
  ]
});
