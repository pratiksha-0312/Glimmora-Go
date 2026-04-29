import { chromium } from "@playwright/test";
import path from "node:path";
import fs from "node:fs/promises";

const BASE = "http://localhost:3000";
const OUT = path.resolve("tmp/glimmora-after");
await fs.mkdir(OUT, { recursive: true });

const PAGES = [
  ["rides", "/rides"],
  ["drivers", "/drivers"],
  ["partners", "/partners"],
  ["subscriptions", "/subscriptions"],
  ["fares", "/fares"],
  ["sos", "/sos"],
  ["reports", "/reports"],
  ["admins", "/admins"],
  ["audit", "/audit"],
  ["notifications", "/notifications"],
];

const browser = await chromium.launch({ headless: false });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
await page.fill('input[type="email"]', "admin@glimmora.ai");
await page.fill('input[type="password"]', "admin123");
await page.click('button[type="submit"]');
await page.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 15000 });

for (const [name, route] of PAGES) {
  try {
    await page.goto(`${BASE}${route}`, { waitUntil: "networkidle", timeout: 30_000 });
    await page.waitForTimeout(1200);
    const file = path.join(OUT, `${name}.png`);
    await page.screenshot({ path: file, fullPage: false });
    console.log("✓", name);
  } catch (e) {
    console.warn("✗", name, e.message);
  }
}

await browser.close();
