// Inserts a `breadcrumbs={[...]}` prop into the PageHeader call in each
// admin page that doesn't already have one. Crumb mapping is derived from
// the sidebar group (matching Sidebar.tsx).
//
// Run: node scripts/add-breadcrumbs.mjs

import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve("src/app/(admin)");
const SKIP = new Set(["page.tsx", "coupons/page.tsx"]);

// Map of relative path → breadcrumb crumbs (last crumb is the page itself).
// /rides handled in the page itself (dynamic per view).
const CRUMBS = {
  "drivers/page.tsx": [["Driver Operations"], ["Drivers"]],
  "drivers/[id]/page.tsx": [
    ["Driver Operations"],
    ["Drivers", "/drivers"],
    ["Driver"],
  ],
  "subscriptions/page.tsx": [["Driver Operations"], ["Subscriptions"]],
  "referrals/page.tsx": [["Driver Operations"], ["Driver Referrals"]],
  "fares/page.tsx": [["Pricing & Promotions"], ["Fare Configuration"]],
  "concessions/page.tsx": [["Pricing & Promotions"], ["Concession Pricing"]],
  "cities/page.tsx": [["Configuration"], ["City Archetype"]],
  "sos/page.tsx": [["Safety Monitoring"], ["SOS Alerts"]],
  "tracking/page.tsx": [["Safety Monitoring"], ["Ride Share Tracking"]],
  "partners/page.tsx": [["Partner Management"], ["Partners"]],
  "partners/[id]/page.tsx": [
    ["Partner Management"],
    ["Partners", "/partners"],
    ["Partner"],
  ],
  "corporates/page.tsx": [["Partner Management"], ["Enterprise"]],
  "corporates/[id]/page.tsx": [
    ["Partner Management"],
    ["Enterprise", "/corporates"],
    ["Account"],
  ],
  "reports/page.tsx": [["Reports"]],
  "admins/page.tsx": [["Configuration"], ["Admin Users"]],
  "admins/roles/page.tsx": [
    ["Configuration"],
    ["Admin Users", "/admins"],
    ["Roles & Permissions"],
  ],
  "notifications/page.tsx": [["Configuration"], ["Notification Logs"]],
  "audit/page.tsx": [["Configuration"], ["Audit Logs"]],
  "tickets/page.tsx": [["Tickets"]],
  "tickets/[id]/page.tsx": [["Tickets", "/tickets"], ["Ticket"]],
  "riders/page.tsx": [["Riders"]],
};

function fmtCrumbs(crumbs) {
  // crumbs = [["Label"], ["Label", "/href"], ...]
  return (
    "[\n" +
    crumbs
      .map(([label, href]) => {
        if (href) return `          { label: "${label}", href: "${href}" },`;
        return `          { label: "${label}" },`;
      })
      .join("\n") +
    "\n        ]"
  );
}

async function main() {
  let touched = 0;
  for (const [rel, crumbs] of Object.entries(CRUMBS)) {
    if (SKIP.has(rel)) continue;
    const file = path.join(ROOT, rel);
    let src;
    try {
      src = await fs.readFile(file, "utf8");
    } catch {
      console.warn("(skip, not found)", rel);
      continue;
    }
    if (src.includes("breadcrumbs={")) {
      console.log(`= ${rel} (already has breadcrumbs)`);
      continue;
    }
    // Find <PageHeader\n        title= and inject before title
    const m = src.match(/(<PageHeader\s*\n\s*)(title=)/);
    if (!m) {
      // Some headers might be inline: <PageHeader title="..."
      const inline = src.match(/<PageHeader\s+title=/);
      if (inline) {
        const injection = ` breadcrumbs={${fmtCrumbs(crumbs).replace(
          /\n {10}/g,
          "\n      "
        )}}`;
        src = src.replace(/<PageHeader\s+title=/, `<PageHeader${injection}\n        title=`);
      } else {
        console.warn(`✗ ${rel} — could not locate PageHeader call`);
        continue;
      }
    } else {
      const indent = m[1].split("\n")[1] ?? "        ";
      const injection = `breadcrumbs={${fmtCrumbs(crumbs)}}\n${indent}`;
      src = src.replace(/(<PageHeader\s*\n\s*)(title=)/, `$1${injection}$2`);
    }
    await fs.writeFile(file, src);
    touched++;
    console.log(`✓ ${rel}`);
  }
  console.log(`\nDone: ${touched} files updated`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
