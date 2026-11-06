import { defineConfig, devices } from "@playwright/test";

// Har loyiha o'z portida, o'z bazasida ishlaydi (holatlar aralashmaydi). Oldin `npm run build` kerak.
const servers = [
  { name: "main", port: 3101, ai: "fake" },
  { name: "pending", port: 3102, ai: "none" },
  { name: "mobile", port: 3103, ai: "none" },
];

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 90_000,
  expect: { timeout: 15_000 },
  workers: 1,
  fullyParallel: false,
  reporter: [["list"]],
  use: { channel: "chrome", trace: "retain-on-failure" },
  webServer: servers.map((s) => ({
    command: `node scripts/e2e-server.mjs ${s.port} ${s.name} ${s.ai}`,
    url: `http://localhost:${s.port}`,
    reuseExistingServer: false,
    timeout: 60_000,
  })),
  projects: [
    { name: "main", testMatch: /main\.spec\.ts/, use: { ...devices["Desktop Chrome"], channel: "chrome", baseURL: "http://localhost:3101" } },
    { name: "pending", testMatch: /pending\.spec\.ts/, use: { ...devices["Desktop Chrome"], channel: "chrome", baseURL: "http://localhost:3102" } },
    {
      name: "mobile",
      testMatch: /mobile\.spec\.ts/,
      use: { ...devices["Pixel 7"], channel: "chrome", viewport: { width: 360, height: 740 }, baseURL: "http://localhost:3103" },
    },
  ],
});
