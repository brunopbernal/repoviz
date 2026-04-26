import { defineConfig } from "@playwright/test";
import { resolve } from "path";

export default defineConfig({
  testDir: "./tests/visual",
  outputDir: "./test-results/visual-debug",
  timeout: 30_000,
  retries: 0,

  use: {
    baseURL: "http://localhost:7777",
    headless: true,
    screenshot: "on",
    video: "off",
    trace: "off",
    viewport: { width: 1280, height: 800 },
  },

  projects: [
    {
      name: "desktop",
      use: { viewport: { width: 1280, height: 800 } },
    },
    {
      name: "mobile",
      use: { viewport: { width: 390, height: 844 } },
    },
  ],

  // Automatically start the repoviz server before tests
  webServer: {
    command: `node ${resolve("dist/cli/index.js")} serve graph.json --port 7777 --no-open`,
    url: "http://localhost:7777",
    reuseExistingServer: true,
    timeout: 15_000,
    stderr: "pipe",
  },

  reporter: [["list"], ["html", { outputFolder: "test-results/playwright-report", open: "never" }]],
});
