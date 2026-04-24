import { chromium } from "playwright";

const TOKEN = process.argv[2] || "2dde5e10e8a4c35c44a808eb7d634934";
const URL = `http://localhost:3000/track/${TOKEN}`;

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext();
const page = await ctx.newPage();

const errors = [];
page.on("console", (msg) => {
  if (msg.type() === "error" || msg.type() === "warn") {
    console.log(`[console.${msg.type()}]`, msg.text());
  }
});
page.on("pageerror", (e) => {
  errors.push(e.message + "\n" + (e.stack ?? ""));
  console.log(`[pageerror]`, e.message);
});
page.on("requestfailed", (r) =>
  console.log(`[reqfailed] ${r.url()} — ${r.failure()?.errorText}`)
);

console.log(`visiting ${URL}`);
try {
  await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 20000 });
} catch (e) {
  console.log("goto error:", e.message);
}

await page.waitForTimeout(5000);

const hasLeafletContainer = await page.locator(".leaflet-container").count();
const hasLoadingText = await page.getByText("Loading map").count();
const hasAppError = await page.getByText("Application error").count();

console.log("");
console.log("=== DIAGNOSIS ===");
console.log(".leaflet-container count:", hasLeafletContainer);
console.log("Loading map text count:", hasLoadingText);
console.log("'Application error' count:", hasAppError);
console.log("errors captured:", errors.length);
if (errors.length > 0) {
  console.log("\nFirst error full stack:");
  console.log(errors[0].slice(0, 2000));
}

await browser.close();
