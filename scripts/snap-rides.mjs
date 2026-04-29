import { chromium } from "@playwright/test";
import path from "node:path";

const BASE = "http://localhost:3000";
const OUT = path.resolve("tmp/glimmora-rides-after.png");

const browser = await chromium.launch({ headless: false });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
await page.fill('input[type="email"]', "admin@glimmora.ai");
await page.fill('input[type="password"]', "admin123");
await page.click('button[type="submit"]');
await page.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 15000 });

await page.goto(`${BASE}/rides`, { waitUntil: "networkidle", timeout: 30_000 });
await page.waitForTimeout(1500);
await page.screenshot({ path: OUT, fullPage: true });
console.log("✓", OUT, "currentUrl=", page.url());
await browser.close();
