import { defineConfig, devices } from "@playwright/test";
import { fileURLToPath } from "node:url";

const astraBaseUrl = process.env.ASTRA_E2E_BASE_URL?.trim() || "http://localhost:3011";
const composerBaseUrl = process.env.ASTRA_E2E_COMPOSER_BASE_URL?.trim() || "http://localhost:3012";
const astraPort = new URL(astraBaseUrl).port || "3011";
const composerPort = new URL(composerBaseUrl).port || "3012";
const astraServerCommand = process.env.ASTRA_E2E_SERVER_MODE === "production"
  ? `npm --workspace @astra/astra-web exec next start -- --port ${astraPort}`
  : `npm --workspace @astra/astra-web exec next dev -- --webpack --port ${astraPort}`;
const emailCaptureDir = fileURLToPath(new URL("../../.astra-email/e2e", import.meta.url));
process.env.ASTRA_EMAIL_DELIVERY = "file";
process.env.ASTRA_EMAIL_CAPTURE_DIR = emailCaptureDir;

export default defineConfig({
  testDir: "./e2e",
  testIgnore: "auth-rate-limit.spec.ts",
  timeout: 60_000,
  workers: 1,
  expect: {
    timeout: 10_000
  },
  use: {
    baseURL: astraBaseUrl,
    colorScheme: "light",
    trace: "on-first-retry",
    screenshot: "only-on-failure"
  },
  webServer: [
    {
      command: "node ../../scripts/e2e-open-meteo-fixture.mjs",
      url: "http://127.0.0.1:4317/health",
      reuseExistingServer: true,
      timeout: 10_000
    },
    {
      command: `ASTRA_APP_BASE_URL=${astraBaseUrl} COMPOSER_REQUIRE_AUTH=0 npm --workspace @astra/composer-web exec next dev -- --port ${composerPort}`,
      url: `${composerBaseUrl}/api/status`,
      reuseExistingServer: true,
      timeout: 120_000
    },
    {
      command: `ASTRA_APP_BASE_URL=${astraBaseUrl} COMPOSER_APP_BASE_URL=${composerBaseUrl} ASTRA_E2E_DISABLE_AUTH_RATE_LIMIT=1 ASTRA_EMAIL_DELIVERY=file ASTRA_EMAIL_CAPTURE_DIR=${JSON.stringify(emailCaptureDir)} ASTRA_PLACE_SEARCH_PROVIDER=open-meteo ASTRA_OPEN_METEO_GEOCODING_URL=http://127.0.0.1:4317/v1/search ${astraServerCommand}`,
      url: `${astraBaseUrl}/`,
      reuseExistingServer: true,
      timeout: 120_000
    }
  ],
  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } }
    },
    {
      name: "tablet",
      use: { ...devices["iPad Pro 11"], viewport: { width: 820, height: 1180 } }
    },
    {
      name: "mobile",
      use: { ...devices["Pixel 5"], viewport: { width: 390, height: 844 } }
    }
  ]
});
