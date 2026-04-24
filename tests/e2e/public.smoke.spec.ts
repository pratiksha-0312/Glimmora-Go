import { test, expect } from "@playwright/test";

// These tests run in the "public-chromium" project with no storageState —
// they verify that pre-auth surfaces (PWA shell, kirana signup/login) are
// reachable without any session cookie.

test("PWA shell files public (no auth)", async ({ browser }) => {
  const ctx = await browser.newContext();
  const manifest = await ctx.request.get("/manifest.webmanifest");
  expect(manifest.status()).toBe(200);
  expect(manifest.headers()["content-type"]).toContain("manifest+json");

  const sw = await ctx.request.get("/sw.js");
  expect(sw.status()).toBe(200);
  expect(sw.headers()["service-worker-allowed"]).toBe("/k/");

  const offline = await ctx.request.get("/offline.html");
  expect(offline.status()).toBe(200);
  await ctx.close();
});

test("kirana login page renders + manifest linked", async ({ page }) => {
  await page.goto("/k/login");
  await expect(
    page.getByRole("heading", { name: /Kirana Partner Sign In/i })
  ).toBeVisible();
  const manifest = await page
    .locator('link[rel="manifest"]')
    .getAttribute("href");
  expect(manifest).toBe("/manifest.webmanifest");
});
