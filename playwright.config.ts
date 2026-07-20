import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",

  timeout: 30_000,

  retries: process.env.CI ? 1 : 0,

  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },

  webServer: {
    command: "npm run build && npm run start",
    port: 3000,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },

  projects: [
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: "authenticated",
      testMatch:
        /(upload-and-share|device-management|clipboard-sync|offline-recovery)\.spec\.ts/,
      dependencies: ["setup"],
      use: {
        storageState: "e2e/.auth/user.json",
      },
    },
  ],
});
