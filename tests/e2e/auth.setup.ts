import { test as setup, expect } from "@playwright/test";
import path from "path";
import fs from "fs";

const ADMIN_STATE = path.resolve("playwright/.auth/admin.json");
fs.mkdirSync(path.dirname(ADMIN_STATE), { recursive: true });

setup("authenticate as admin", async ({ page }) => {
  await page.goto("/login");
  await page.fill('input[type="email"]', "admin@glimmora.ai");
  await page.fill('input[type="password"]', "admin123");
  await page.click('button[type="submit"]');
  await page.waitForURL((u) => !u.pathname.startsWith("/login"));
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await page.context().storageState({ path: ADMIN_STATE });
});
