// One-shot helper: sweep cream/brown color tokens through admin pages
// to bring them in line with the verifai pattern. Idempotent — running
// twice is a no-op. Breadcrumbs are added per page in a separate edit.
//
// Run: node scripts/apply-verifai-skin.mjs

import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve("src/app/(admin)");
// These pages stay verbatim per spec.
const SKIP = new Set(["page.tsx", "coupons/page.tsx", "rides/page.tsx"]);

async function* walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else if (e.isFile() && p.endsWith(".tsx")) yield p;
  }
}

const REPLACEMENTS = [
  // Outer cards: slate borders → sand
  {
    re: /border border-slate-200 bg-white shadow-sm/g,
    to: "border border-[#f0e4d6] bg-white shadow-sm",
  },
  // Table headers and side panels: slate-50 fill → cream
  {
    re: /(<thead[^>]*className=)"bg-slate-50/g,
    to: '$1"border-b border-[#f0e4d6] bg-[#fbf7f2]',
  },
  // Row hover background
  {
    re: /hover:bg-slate-50/g,
    to: "hover:bg-[#fbf7f2]",
  },
  // Active filter pills
  {
    re: /bg-brand-600 text-white/g,
    to: "bg-[#a57865] text-white",
  },
  // Brand link colors when used for table-row "Review →" actions
  // (kept for now; the brand-* aliases still resolve, just darker brown)
];

async function main() {
  let changedFiles = 0;
  let totalReplacements = 0;
  for await (const file of walk(ROOT)) {
    const rel = path.relative(ROOT, file).replace(/\\/g, "/");
    if (SKIP.has(rel)) continue;
    const before = await fs.readFile(file, "utf8");
    let after = before;
    let replacedHere = 0;
    for (const r of REPLACEMENTS) {
      const matches = after.match(r.re);
      if (matches) {
        after = after.replace(r.re, r.to);
        replacedHere += matches.length;
      }
    }
    if (after !== before) {
      await fs.writeFile(file, after);
      changedFiles++;
      totalReplacements += replacedHere;
      console.log(`✓ ${rel} (${replacedHere} repl)`);
    }
  }
  console.log(`\nDone: ${changedFiles} files, ${totalReplacements} replacements`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
