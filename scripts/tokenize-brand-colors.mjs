// Replaces hardcoded brand hex codes inside Tailwind arbitrary-value
// brackets with CSS variable references that the ColorThemePicker can swap.
//
// e.g. `bg-[#a57865]` → `bg-[color:var(--brand-500)]`
//      `text-[#3a2d28]` → `text-[color:var(--brand-text)]`
//      `from-[#fdf8f4]` → `from-[color:var(--brand-cream-soft)]`
//
// API routes, fonts, anything outside src/ is skipped. Idempotent — running
// twice is a no-op.
//
// Run: node scripts/tokenize-brand-colors.mjs

import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve("src");

// hex → token map (lowercase)
const MAP = {
  "#a57865": "var(--brand-500)",
  "#8e6253": "var(--brand-600)",
  "#f0e4d6": "var(--brand-sand-border)",
  "#fbf7f2": "var(--brand-cream)",
  "#f3e8db": "var(--brand-cream-active)",
  "#fbf5ef": "var(--brand-cream-hover)",
  "#fdf8f4": "var(--brand-cream-soft)",
  "#3a2d28": "var(--brand-text)",
  "#6b5349": "var(--brand-text-muted)",
  "#a89485": "var(--brand-text-soft)",
};

async function* walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else if (e.isFile() && /\.(tsx?|jsx?|css)$/.test(e.name)) yield p;
  }
}

async function main() {
  let changedFiles = 0;
  let totalReplacements = 0;
  for await (const f of walk(ROOT)) {
    // Skip globals.css — that's where the variables themselves live
    if (f.endsWith("globals.css")) continue;
    let content = await fs.readFile(f, "utf8");
    const before = content;
    // Match a `-[#xxxxxx]` pattern — i.e. a Tailwind arbitrary value with
    // a 6-char hex. We do NOT touch the same hex outside brackets (HTML
    // attributes, comments) — safer to be conservative.
    content = content.replace(
      /(-\[)(#[0-9a-fA-F]{6})(\])/g,
      (whole, l, hex, r) => {
        const repl = MAP[hex.toLowerCase()];
        if (!repl) return whole;
        return `${l}color:${repl}${r}`;
      }
    );
    // Same for split attrs like `border-[#xxxxx]/30` (alpha) — leave alone
    // (none in our tree right now).
    if (content !== before) {
      const reCount = before.match(/-\[#[0-9a-fA-F]{6}\]/g) ?? [];
      const afterCount = content.match(/-\[color:var/g) ?? [];
      const delta = afterCount.length - (before.match(/-\[color:var/g) ?? []).length;
      await fs.writeFile(f, content);
      changedFiles++;
      totalReplacements += delta;
      console.log(`✓ ${path.relative(ROOT, f)} (${delta} swaps)`);
    }
  }
  console.log(`\nTotal: ${changedFiles} files, ${totalReplacements} swaps`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
