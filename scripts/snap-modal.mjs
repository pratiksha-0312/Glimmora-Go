import { chromium } from "@playwright/test";
import path from "node:path";

const BASE = "http://localhost:3000";
const OUT = path.resolve("tmp/glimmora-modal");
import fs from "node:fs/promises";
await fs.mkdir(OUT, { recursive: true });

const browser = await chromium.launch({ headless: false });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

await page.goto(`${BASE}/login`, { waitUntil: "networkidle", timeout: 60_000 });
await page.fill('input[type="email"]', "admin@glimmora.ai");
await page.fill('input[type="password"]', "admin123");
await page.click('button[type="submit"]');
await page.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 60_000 });

await page.goto(`${BASE}/subscriptions`, { waitUntil: "networkidle", timeout: 60_000 });
await page.waitForTimeout(1500);
await page.screenshot({ path: path.join(OUT, "1-page.png"), fullPage: false });

await page.getByRole("button", { name: /New Subscription/i }).click();
await page.waitForTimeout(800);
await page.screenshot({ path: path.join(OUT, "2-modal.png"), fullPage: false });

console.log("✓ saved 1-page.png and 2-modal.png");
await browser.close();
