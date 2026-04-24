import { test, expect } from "@playwright/test";

const PARTNER_PHONE = "9888800001"; // seed: Ramji Kirana Store, Rewa, APPROVED

test.describe("Partner PWA — browser flows", () => {
  test("OTP login + dashboard + map picker + confirm booking", async ({
    page,
  }) => {
    // --- OTP login ---
    await page.goto("/p/login");
    await page.fill('input[inputmode="numeric"]', PARTNER_PHONE);
    const otpReqPromise = page.waitForResponse(
      (res) =>
        res.url().includes("/api/partner/otp/request") &&
        res.request().method() === "POST"
    );
    await page.getByRole("button", { name: /Send OTP/ }).click();
    const otpRes = await otpReqPromise;
    const { devCode } = await otpRes.json();
    expect(devCode).toMatch(/^\d{6}$/);

    await page
      .locator('input[inputmode="numeric"][maxlength="6"]')
      .fill(devCode);
    await page.getByRole("button", { name: /^Sign in/ }).click();
    await page.waitForURL("/p");
    await expect(page.getByText("Book a ride for a customer")).toBeVisible();

    // --- Open book form ---
    await page.getByRole("link", { name: /Book a ride/ }).click();
    await page.waitForURL("/p/book");
    await expect(page.getByText("Route")).toBeVisible();

    // --- Fill customer phone ---
    const phoneField = page
      .locator('input[inputmode="numeric"][maxlength="10"]')
      .first();
    await phoneField.fill("9999977777");

    // --- Open pickup picker ---
    await page.getByRole("button", { name: /Pick pickup on map/ }).click();
    await expect(page.getByText("Pick location")).toBeVisible();

    // Map must mount
    await expect(page.locator(".leaflet-container")).toBeVisible({
      timeout: 15_000,
    });

    // Tap map center to drop a pin.
    const mapBox = await page.locator(".leaflet-container").boundingBox();
    if (!mapBox) throw new Error("map box missing");
    await page.mouse.click(
      mapBox.x + mapBox.width / 2,
      mapBox.y + mapBox.height / 2
    );

    // Wait for reverse-geocode + marker to appear
    await expect(page.locator(".leaflet-marker-pane > *")).toHaveCount(1, {
      timeout: 15_000,
    });

    // Confirm
    await page.getByRole("button", { name: /Confirm location/ }).click();
    await expect(page.getByText("Pick location")).toHaveCount(0);

    // --- Open drop picker via search ---
    await page.getByRole("button", { name: /Pick drop on map/ }).click();
    const searchInput = page.locator('input[placeholder*="Search in"]');
    await searchInput.fill("Rewa Railway Station");
    const resultPanel = page.locator("div.absolute.z-\\[1000\\]");
    await expect(resultPanel).toBeVisible({ timeout: 20_000 });
    const firstResult = resultPanel.locator("button").first();
    await expect(firstResult).toBeVisible({ timeout: 10_000 });
    await firstResult.click();
    await expect(page.locator(".leaflet-marker-pane > *")).toHaveCount(1, {
      timeout: 10_000,
    });
    await page.getByRole("button", { name: /Confirm location/ }).click();
    await expect(page.getByText("Pick location")).toHaveCount(0);

    // --- Fare estimate ---
    const estReqPromise = page.waitForResponse(
      (res) =>
        res.url().includes("/api/partner/bookings") &&
        res.request().method() === "PUT"
    );
    await page.getByRole("button", { name: /Get fare estimate/ }).click();
    const estRes = await estReqPromise;
    expect(estRes.status()).toBe(200);
    const est = await estRes.json();
    expect(est.fareEstimate).toBeGreaterThan(0);
    expect(est.distanceKm).toBeGreaterThan(0);
    await expect(page.getByText(`₹${est.fareEstimate}`)).toBeVisible();

    // --- Confirm booking ---
    const bookReqPromise = page.waitForResponse(
      (res) =>
        res.url().includes("/api/partner/bookings") &&
        res.request().method() === "POST"
    );
    await page.getByRole("button", { name: /^Confirm booking/ }).click();
    const bookRes = await bookReqPromise;
    expect(bookRes.status()).toBe(200);

    // Redirects to /p/bookings
    await page.waitForURL("/p/bookings", { timeout: 10_000 });
    await expect(page.getByText("9999977777").first()).toBeVisible({
      timeout: 15_000,
    });
  });
});
