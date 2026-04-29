import { test, expect } from "@playwright/test";

// Walks the admin payout flow end-to-end:
//   /partners → View Ramji Kirana Store → Generate payout → Mark paid (UTR).
// Prereq: `node scripts/seed-payout-demo.mjs` so the partner has billable rides.
// Run visibly: npx playwright test payout --headed --workers=1 --project=chromium

const SHOP = "Ramji Kirana Store";
const UTR = "DEMO-UTR-" + Date.now().toString().slice(-6);

test("admin payout flow — generate then mark paid", async ({ page }) => {
  await page.goto("/partners");
  await expect(page.getByRole("heading", { name: "Partners" })).toBeVisible();

  // Open the partner detail page via the new "View" button
  const row = page.locator("tr", { hasText: SHOP });
  await row.getByRole("link", { name: "View" }).click();
  await expect(page.getByRole("heading", { name: SHOP })).toBeVisible();

  // Generate a payout for the default 7-day window
  await page.getByRole("button", { name: "Generate payout" }).click();
  await page.getByRole("button", { name: "Generate", exact: true }).click();

  // A PENDING payout row should appear in the Payouts section
  const pendingRow = page.locator("div").filter({ hasText: /PENDING/ }).first();
  await expect(pendingRow).toBeVisible({ timeout: 10_000 });

  // Mark it paid with a fake UTR
  await page.getByRole("button", { name: "Mark paid" }).click();
  await page.getByPlaceholder("UTR / ref").fill(UTR);
  await page.getByRole("button", { name: "Save" }).click();

  // Row should flip to PAID and surface the UTR
  await expect(page.getByText("PAID", { exact: true }).first()).toBeVisible({
    timeout: 10_000,
  });
  await expect(page.getByText(UTR)).toBeVisible();
});
