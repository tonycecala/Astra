import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: {
    timeout: 5_000
  },
  use: {
    baseURL: "http://localhost:3011",
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
      command: "ASTRA_PLACE_SEARCH_PROVIDER=open-meteo ASTRA_OPEN_METEO_GEOCODING_URL=http://127.0.0.1:4317/v1/search npm run dev",
      url: "http://localhost:3011/",
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
