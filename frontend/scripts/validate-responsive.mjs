import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { writeFile } from "node:fs/promises";

const baseUrl = "http://127.0.0.1:4173";

const mockData = {
  kpis: {
    totalPassengers: 891,
    survivors: 342,
    survivalRatePct: 38.38,
    averageAge: 29.7,
    averageFare: 32.2,
    topSurvivalClass: "Class 1"
  },
  topCategories: [
    { category: "Class 3", passengerCount: 491, survivalRatePct: 24.24, avgFare: 13.67 },
    { category: "Class 1", passengerCount: 216, survivalRatePct: 62.96, avgFare: 84.15 },
    { category: "Class 2", passengerCount: 184, survivalRatePct: 47.28, avgFare: 20.66 }
  ],
  regionalDistribution: [
    { region: "S - Southampton", passengerCount: 644, sharePct: 72.28, survivalRatePct: 33.7 },
    { region: "C - Cherbourg", passengerCount: 168, sharePct: 18.86, survivalRatePct: 55.36 },
    { region: "Q - Queenstown", passengerCount: 77, sharePct: 8.64, survivalRatePct: 38.96 }
  ],
  ageTrend: [
    { ageBand: "0-9", passengerCount: 62, survivalRatePct: 61.29 },
    { ageBand: "10-19", passengerCount: 102, survivalRatePct: 40.19 },
    { ageBand: "20-29", passengerCount: 220, survivalRatePct: 35.45 },
    { ageBand: "30-39", passengerCount: 167, survivalRatePct: 44.31 }
  ]
};

const viewports = [
  { name: "mobile", width: 375, height: 812, expectedKpiCols: 1 },
  { name: "tablet", width: 768, height: 1024, expectedKpiCols: 2 },
  { name: "desktop", width: 1280, height: 900, expectedKpiCols: 3 }
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const waitForServer = async (url, timeoutMs = 20000) => {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
    } catch {
      // keep polling
    }
    await sleep(300);
  }

  throw new Error(`Timed out waiting for server at ${url}`);
};

const server =
  process.platform === "win32"
    ? spawn("cmd.exe", ["/d", "/s", "/c", "npm run dev -- --host 127.0.0.1 --port 4173"], { stdio: "ignore" })
    : spawn("npm", ["run", "dev", "--", "--host", "127.0.0.1", "--port", "4173"], { stdio: "ignore" });

let browser;
const viewportResults = [];

try {
  await waitForServer(baseUrl);

  browser = await chromium.launch({ headless: true });
  const errors = [];

  for (const viewport of viewports) {
    const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height } });

    page.on("pageerror", (err) => {
      errors.push(`${viewport.name}: ${err.message}`);
    });

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(`${viewport.name}: console error - ${msg.text()}`);
      }
    });

    await page.route("**/api/analytics/kpis", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: mockData.kpis })
      });
    });

    await page.route("**/api/analytics/top-categories**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: mockData.topCategories })
      });
    });

    await page.route("**/api/analytics/regional-distribution", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: mockData.regionalDistribution })
      });
    });

    await page.route("**/api/analytics/trend**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: mockData.ageTrend })
      });
    });

    await page.route("**/api/ai/insight", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            insight: "Passengers in first class had the strongest survival outcomes.",
            fallbackUsed: false
          }
        })
      });
    });

    await page.goto(baseUrl, { waitUntil: "networkidle" });
    await page.waitForSelector("text=Filters", { timeout: 10000 });

    const result = await page.evaluate(() => {
      const kpiSection = document.querySelector('section[aria-label="Key metrics"]');
      if (!kpiSection) {
        throw new Error("KPI section not found");
      }

      const computed = window.getComputedStyle(kpiSection);
      const cols = computed.gridTemplateColumns
        .split(" ")
        .map((token) => token.trim())
        .filter(Boolean).length;

      const overflow = document.documentElement.scrollWidth > window.innerWidth + 1;

      return { cols, overflow };
    });

    if (result.cols !== viewport.expectedKpiCols) {
      throw new Error(
        `${viewport.name} expected ${viewport.expectedKpiCols} KPI columns but found ${result.cols}`
      );
    }

    if (result.overflow) {
      throw new Error(`${viewport.name} has horizontal overflow`);
    }

    await page.getByRole("button", { name: "Generate Insight" }).click();
    await page.waitForSelector("text=Passengers in first class had the strongest survival outcomes.", { timeout: 5000 });
    viewportResults.push({
      viewport: viewport.name,
      width: viewport.width,
      height: viewport.height,
      expectedKpiColumns: viewport.expectedKpiCols,
      actualKpiColumns: result.cols,
      horizontalOverflow: result.overflow,
      aiInsightRendered: true
    });

    await page.close();
  }

  if (errors.length > 0) {
    throw new Error(`Console/runtime errors found:\n${errors.join("\n")}`);
  }

  await writeFile(
    "responsive-validation-report.json",
    JSON.stringify(
      {
        passed: true,
        checkedAt: new Date().toISOString(),
        viewports: viewportResults
      },
      null,
      2
    ),
    "utf-8"
  );

  console.log("Responsive validation passed for mobile, tablet, and desktop viewports.");
} finally {
  if (browser) {
    await browser.close();
  }
  if (!server.killed) {
    server.kill();
  }
}
