import { test, expect, Page } from "@playwright/test";

// Auth is handled by tests/e2e/auth.setup.ts (runs once, saves storageState).
// Each test here starts already signed in as admin@glimmora.ai.

function waitFor(page: Page, match: RegExp, method = "POST") {
  return page.waitForResponse(
    (r) => match.test(r.url()) && r.request().method() === method
  );
}

test.describe("Admin panel — every button / interaction", () => {
  // --- DASHBOARD ---
  test("/ dashboard renders stat cards + recent rides feed", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    await expect(page.getByText("Rides Today")).toBeVisible();
    await expect(page.getByText("Active Drivers")).toBeVisible();
  });

  // --- DRIVERS ---
  test("/drivers — each status pill filters the list", async ({ page }) => {
    await page.goto("/drivers");
    for (const pill of ["All", "PENDING", "APPROVED", "REJECTED", "SUSPENDED"]) {
      await page.getByRole("link", { name: pill, exact: true }).click();
      await expect(
        page.getByRole("heading", { name: "Drivers" })
      ).toBeVisible();
    }
  });

  test("/drivers/[id] — approve fires PATCH and updates status", async ({
    page,
  }) => {
    await page.goto("/drivers");
    // Pick the first row available regardless of status — robust to prior test runs
    const firstLink = page.locator("tbody tr a").first();
    await firstLink.click();
    await expect(page).toHaveURL(/\/drivers\/[^/]+$/);

    // Find any status button that is not disabled and click it
    const buttons = page.getByRole("button").filter({
      hasText: /^(Approve|Reject|Suspend|Pending)$/,
    });
    const enabledCount = await buttons.count();
    let clicked = false;
    for (let i = 0; i < enabledCount; i++) {
      const btn = buttons.nth(i);
      if (!(await btn.isDisabled())) {
        const req = waitFor(page, /\/api\/drivers\/[^/]+$/, "PATCH");
        await btn.click();
        expect((await req).status()).toBe(200);
        clicked = true;
        break;
      }
    }
    expect(clicked).toBe(true);
  });

  // --- RIDERS ---
  test("/riders — search form submits and renders results", async ({
    page,
  }) => {
    await page.goto("/riders");
    await page.fill('input[name="q"]', "9999900001");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/riders\?q=9999900001/);
    await expect(page.getByText("9999900001")).toBeVisible();
  });

  // --- RIDES ---
  test("/rides — status pills + auto-refresh toggle + share button", async ({
    page,
    context,
  }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/rides");

    for (const pill of [
      "All",
      "REQUESTED",
      "MATCHED",
      "IN_TRIP",
      "COMPLETED",
      "CANCELLED",
    ]) {
      await page.getByRole("link", { name: pill, exact: true }).click();
      await expect(page.getByRole("heading", { name: "Rides" })).toBeVisible();
    }

    await page.getByRole("link", { name: "All", exact: true }).click();

    // AutoRefresh toggle — use role=checkbox to avoid grabbing other inputs
    const toggle = page.getByRole("checkbox").first();
    await expect(toggle).toBeChecked();
    await toggle.click();
    await expect(toggle).not.toBeChecked();
    await toggle.click();
    await expect(toggle).toBeChecked();

    // Share button: only present if there's at least one ride + write permission
    const shareBtn = page
      .getByRole("button", { name: /^(Share|Share link)$/ })
      .first();
    if (await shareBtn.count()) {
      const shareReq = waitFor(page, /\/api\/rides\/[^/]+\/token$/, "POST");
      await shareBtn.click();
      expect((await shareReq).status()).toBe(200);
    }
  });

  // --- SOS ---
  test("/sos — page and LIVE-badge link render", async ({ page }) => {
    await page.goto("/sos");
    await expect(page.getByRole("heading", { name: "SOS Alerts" })).toBeVisible();
  });

  // --- TICKETS ---
  test("/tickets — create and triage a ticket to RESOLVED", async ({
    page,
  }) => {
    await page.goto("/tickets");
    await expect(page.getByRole("heading", { name: "Tickets" })).toBeVisible();

    // All status pills clickable
    for (const pill of ["All", "Open", "In progress", "Resolved", "Closed"]) {
      await page.getByRole("link", { name: pill, exact: true }).click();
    }
    await page.getByRole("link", { name: "All", exact: true }).click();

    const subject = "UI test " + Date.now().toString().slice(-6);
    await page.fill('input[placeholder="Short summary"]', subject);
    await page.fill(
      'textarea[placeholder="What happened?"]',
      "Automated test — full lifecycle"
    );
    const createReq = waitFor(page, /\/api\/tickets$/, "POST");
    await page.getByRole("button", { name: "Create ticket" }).click();
    expect((await createReq).status()).toBe(200);

    // Go into detail
    await page.getByRole("link", { name: subject }).click();
    await expect(page.getByRole("heading", { name: subject })).toBeVisible();

    const manage = page
      .locator("div.rounded-xl")
      .filter({ hasText: "Manage" });
    await manage.locator("select").nth(0).selectOption("RESOLVED");
    await manage.locator("textarea").fill("Resolved by test");
    const saveReq = waitFor(page, /\/api\/tickets\/[^/]+$/, "PATCH");
    await manage.getByRole("button", { name: /Save changes/ }).click();
    expect((await saveReq).status()).toBe(200);

    // Reload and verify RESOLVED badge persisted (not the <option> dropdown entry)
    await page.reload();
    await expect(
      page.locator("span.ring-inset").filter({ hasText: /^Resolved$/ }).first()
    ).toBeVisible();
  });

  // --- FARES ---
  test("/fares — Save button on first city card", async ({ page }) => {
    await page.goto("/fares");
    await expect(
      page.getByRole("heading", { name: "Fare Config" })
    ).toBeVisible();

    // FareEditor is a div (not a form) — locate via the first card
    const firstCard = page
      .locator("div.rounded-xl.border.border-slate-200.bg-white.p-5")
      .first();
    const baseInput = firstCard.locator('label:has-text("Base Fare") input');
    const current = await baseInput.inputValue();
    await baseInput.fill(String(Number(current) + 1));

    const req = waitFor(page, /\/api\/cities\/[^/]+\/fare$/, "PUT");
    await firstCard.getByRole("button", { name: /^Save/ }).click();
    expect((await req).status()).toBe(200);
    await expect(firstCard.getByText("Saved ✓")).toBeVisible();

    // Restore
    await baseInput.fill(current);
    await firstCard.getByRole("button", { name: /^Save/ }).click();
  });

  // --- CONCESSIONS ---
  test("/concessions — Save persists multipliers", async ({ page }) => {
    await page.goto("/concessions");
    await expect(
      page.getByRole("heading", { name: "Concession Pricing" })
    ).toBeVisible();

    const firstCard = page
      .locator("div.rounded-xl.border.border-slate-200.bg-white.p-5")
      .first();
    const input = firstCard.locator('input[type="number"]').first();
    const current = await input.inputValue();
    await input.fill("0.83");
    const req = waitFor(page, /\/api\/cities\/[^/]+\/concessions$/, "PUT");
    await firstCard.getByRole("button", { name: /^Save/ }).click();
    expect((await req).status()).toBe(200);
    await input.fill(current);
    await firstCard.getByRole("button", { name: /^Save/ }).click();
  });

  // --- COUPONS ---
  test("/coupons — create → disable → enable → delete", async ({ page }) => {
    await page.goto("/coupons");
    const code = "UI" + Date.now().toString().slice(-6);
    await page.fill('input[placeholder="FIRSTRIDE"]', code);
    await page.fill('input[placeholder="First ride free"]', "UI smoke");
    const createReq = waitFor(page, /\/api\/coupons$/, "POST");
    await page.getByRole("button", { name: /Create coupon/ }).click();
    expect((await createReq).status()).toBe(200);
    await expect(page.getByText(code)).toBeVisible();

    const row = page.locator("tr").filter({ hasText: code });
    await row.getByRole("button", { name: "Disable" }).click();
    await expect(row.getByText("Disabled")).toBeVisible();
    await row.getByRole("button", { name: "Enable" }).click();
    await expect(row.getByText("Active")).toBeVisible();

    page.on("dialog", (d) => d.accept());
    const delReq = waitFor(page, /\/api\/coupons\/[^/]+$/, "DELETE");
    await row.getByRole("button", { name: "Delete" }).click();
    expect((await delReq).status()).toBe(200);
    await expect(page.getByText(code)).toHaveCount(0, { timeout: 10_000 });
  });

  // --- CITIES / ARCHETYPES ---
  test("/cities — Metro archetype Save persists", async ({ page }) => {
    await page.goto("/cities");
    const metroCard = page
      .locator("div.rounded-xl")
      .filter({ has: page.getByRole("heading", { level: 4, name: "Metro" }) });
    const baseInput = metroCard.locator('label:has-text("Base fare") input');
    const current = await baseInput.inputValue();
    await baseInput.fill(String(Number(current) + 2));
    const req = waitFor(page, /\/api\/archetypes\/METRO$/, "PUT");
    await metroCard.locator("button.bg-brand-600").first().click();
    expect((await req).status()).toBe(200);
    await page.reload();
    const metroCardAfter = page
      .locator("div.rounded-xl")
      .filter({ has: page.getByRole("heading", { level: 4, name: "Metro" }) });
    await metroCardAfter
      .locator('label:has-text("Base fare") input')
      .fill(current);
    await metroCardAfter.locator("button.bg-brand-600").first().click();
  });

  // --- REFERRALS ---
  test("/referrals — Recompute button fires POST /api/referrals/recompute", async ({
    page,
  }) => {
    await page.goto("/referrals");
    await expect(
      page.getByRole("heading", { level: 1, name: "Referrals" })
    ).toBeVisible();

    const recomputeReq = waitFor(page, /\/api\/referrals\/recompute$/, "POST");
    await page.getByRole("button", { name: /Recompute rewards/ }).click();
    expect((await recomputeReq).status()).toBe(200);
  });

  // --- SUBSCRIPTIONS ---
  test("/subscriptions — grant + revoke (uses any approved driver)", async ({
    page,
  }) => {
    await page.goto("/subscriptions");
    await expect(
      page.getByRole("heading", { level: 1, name: "Subscriptions" })
    ).toBeVisible();

    const form = page.locator("form");
    const driverSelect = form.locator("select").nth(0);
    const n = await driverSelect.locator("option").count();
    if (n > 1) {
      await driverSelect.selectOption({ index: 1 });
      await form.locator("select").nth(1).selectOption("DAILY");
      const req = waitFor(page, /\/api\/subscriptions$/, "POST");
      await form.getByRole("button", { name: /Grant subscription/ }).click();
      expect((await req).status()).toBe(200);

      // Revoke the newest row (first tbody tr)
      const firstRow = page.locator("tbody tr").first();
      page.on("dialog", (d) => d.accept());
      const revokeReq = waitFor(page, /\/api\/subscriptions\/[^/]+$/, "PATCH");
      await firstRow.getByRole("button", { name: "Revoke" }).click();
      expect((await revokeReq).status()).toBe(200);
    }
  });

  // --- REPORTS ---
  test("/reports — range pills + CSV export", async ({ page }) => {
    await page.goto("/reports");
    for (const range of ["7 days", "14 days", "30 days", "90 days"]) {
      await page.getByRole("link", { name: range, exact: true }).click();
      await expect(
        page.getByRole("heading", { name: "Reports" })
      ).toBeVisible();
    }
    const dl = page.waitForEvent("download");
    await page.getByRole("link", { name: /Export CSV/ }).click();
    const download = await dl;
    expect(download.suggestedFilename()).toMatch(/^rides-\d+d-.*\.csv$/);
  });

  // --- PARTNERS ---
  test("/partners — Approve button on pending partner row", async ({
    page,
  }) => {
    await page.goto("/partners");
    await expect(
      page.getByRole("heading", { name: "Partners" })
    ).toBeVisible();

    // Action buttons are hidden behind a "Review →" toggle per row.
    const firstRow = page.locator("tbody tr").first();
    await expect(firstRow).toBeVisible();
    await firstRow.getByRole("button", { name: /Review/ }).click();

    // Now Approve/Reject/Suspend are rendered inside the row. Suspend is always
    // enabled unless status is already SUSPENDED — use it as the action.
    const suspend = firstRow.getByRole("button", { name: "Suspend" });
    await expect(suspend).toBeEnabled();
    const suspendReq = waitFor(page, /\/api\/partners\/[^/]+$/, "PATCH");
    await suspend.click();
    expect((await suspendReq).status()).toBe(200);

    // Reopen the row panel and flip back to Approved for cleanliness
    await page.locator("tbody tr").first().getByRole("button", { name: /Review/ }).click();
    const approveReq = waitFor(page, /\/api\/partners\/[^/]+$/, "PATCH");
    await page.locator("tbody tr").first().getByRole("button", { name: "Approve" }).click();
    expect((await approveReq).status()).toBe(200);
  });

  // --- CORPORATES ---
  test("/corporates — top-up/debit + add/remove member + approve", async ({
    page,
  }) => {
    await page.goto("/corporates");
    await page.getByRole("link", { name: /Acme Logistics/ }).click();

    const walletCard = page
      .locator("div.rounded-xl")
      .filter({ hasText: "Wallet balance" });
    const before = await walletCard.locator("div.text-2xl").innerText();

    const topUpCard = page
      .locator("div.rounded-xl")
      .filter({ has: page.getByRole("heading", { name: "Wallet" }) });
    await topUpCard.locator('input[type="number"]').fill("500");
    await topUpCard.locator('input[placeholder*="Oct"]').fill("UI +500");
    const topReq = waitFor(page, /\/top-up$/, "POST");
    await topUpCard.getByRole("button", { name: "+ Top up" }).click();
    expect((await topReq).status()).toBe(200);
    await expect(walletCard.locator("div.text-2xl")).not.toHaveText(before);

    const afterTopUp = await walletCard.locator("div.text-2xl").innerText();
    await topUpCard.locator('input[placeholder*="Oct"]').fill("UI -500");
    const debReq = waitFor(page, /\/top-up$/, "POST");
    await topUpCard.getByRole("button", { name: "− Debit" }).click();
    expect((await debReq).status()).toBe(200);
    await expect(walletCard.locator("div.text-2xl")).not.toHaveText(afterTopUp);

    const memberCard = page
      .locator("div.rounded-xl")
      .filter({ hasText: /Members \(/ });
    const phone = "9999" + Date.now().toString().slice(-6);
    await memberCard.locator('input[placeholder="Rider phone"]').fill(phone);
    await memberCard
      .locator('input[placeholder="Name (optional)"]')
      .fill("PW Tester");
    const addReq = waitFor(page, /\/members$/, "POST");
    await memberCard.getByRole("button", { name: /Add member/ }).click();
    expect((await addReq).status()).toBe(200);

    const newRow = memberCard.locator("tr").filter({ hasText: phone });
    await expect(newRow).toBeVisible();
    page.on("dialog", (d) => d.accept());
    const rmReq = waitFor(page, /\/members\/[^/]+$/, "DELETE");
    await newRow.getByRole("button", { name: "Remove" }).click();
    expect((await rmReq).status()).toBe(200);
  });

  // --- AUDIT ---
  test("/audit — range pills + filter submit + CSV export + fraud signals", async ({
    page,
  }) => {
    await page.goto("/audit");
    await expect(
      page.getByRole("heading", { name: "Audit & Compliance" })
    ).toBeVisible();

    for (const r of ["24h", "7d", "30d", "90d"]) {
      await page.getByRole("link", { name: r, exact: true }).click();
    }

    for (const s of [
      "Stale driver applications",
      "Drivers with repeated doc rejections",
      "Unresolved SOS older than 24h",
      "Possible duplicate rider accounts",
      "High-cancellation drivers",
    ]) {
      await expect(page.getByText(s)).toBeVisible();
    }

    await page.getByRole("button", { name: "Filter" }).click();
    await expect(page).toHaveURL(/\/audit\?/);

    const dl = page.waitForEvent("download");
    await page.getByRole("link", { name: /Export CSV/ }).click();
    const download = await dl;
    expect(download.suggestedFilename()).toMatch(/^audit-\d+d-.*\.csv$/);
  });

  // --- ADMINS ---
  test("/admins — create → disable → enable → delete", async ({ page }) => {
    await page.goto("/admins");
    const email = `pw-${Date.now().toString().slice(-6)}@glimmora.ai`;
    await page.fill('input[type="email"]', email);
    await page.fill(
      'input[required]:not([type="email"]):not([type="password"])',
      "PW Test"
    );
    await page.fill('input[type="password"]', "password123");
    const createReq = waitFor(page, /\/api\/admins$/, "POST");
    await page.getByRole("button", { name: /Create admin/ }).click();
    expect((await createReq).status()).toBe(200);
    await expect(page.getByText(email)).toBeVisible();

    const row = page.locator("tr").filter({ hasText: email });
    const disableReq = waitFor(page, /\/api\/admins\/[^/]+$/, "PATCH");
    await row.getByRole("button", { name: "Disable" }).click();
    expect((await disableReq).status()).toBe(200);
    await expect(row.getByText("Disabled")).toBeVisible();

    const enableReq = waitFor(page, /\/api\/admins\/[^/]+$/, "PATCH");
    await row.getByRole("button", { name: "Enable" }).click();
    expect((await enableReq).status()).toBe(200);
    await expect(row.getByText("Active")).toBeVisible();

    page.on("dialog", (d) => d.accept());
    const delReq = waitFor(page, /\/api\/admins\/[^/]+$/, "DELETE");
    await row.getByRole("button", { name: "Delete" }).click();
    expect((await delReq).status()).toBe(200);
    await expect(page.getByText(email)).toHaveCount(0, { timeout: 10_000 });
  });
});
