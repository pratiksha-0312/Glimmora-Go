// Reads tmp/verifai-color/02-diffs.json and emits the CSS block (one
// :root + 13 [data-theme="..."] selectors) holding our --brand-* tokens.
// We only ship a handful of the 52 tokens verifai exposes — the ones our
// app actually uses (primary scale, cream/sand neutrals, text shades).
//
// Run: node scripts/build-theme-css.mjs > tmp/themes.css

import fs from "node:fs/promises";

const data = JSON.parse(
  await fs.readFile("tmp/verifai-color/02-diffs.json", "utf8")
);

// Map from our token names to verifai variable names, so we can read each
// theme's value from the diff dump.
const TOKENS = [
  ["--brand-50", "--primary-50"],
  ["--brand-100", "--primary-100"],
  ["--brand-200", "--primary-200"],
  ["--brand-300", "--primary-300"],
  ["--brand-400", "--primary-400"],
  ["--brand-500", "--primary-500"],
  ["--brand-600", "--primary-600"],
  ["--brand-700", "--primary-700"],
  ["--brand-800", "--primary-800"],
  ["--brand-900", "--primary-900"],
  ["--brand-950", "--primary-950"],
  ["--brand-cream", "--slate-100"],
  ["--brand-cream-active", "--primary-100"],
  ["--brand-cream-hover", "--primary-50"],
  ["--brand-cream-soft", "--slate-50"],
  ["--brand-sand-border", "--slate-200"],
  ["--brand-text", "--slate-800"],
  ["--brand-text-muted", "--slate-600"],
  ["--brand-text-soft", "--slate-400"],
  ["--brand-sand-border-strong", "--slate-300"],
];

// Default theme = Terracotta (current). Pull from the BEFORE values in
// any non-empty diff entry.
const before = (() => {
  for (const d of data) {
    if (Object.keys(d.diff).length === 0) continue;
    const out = {};
    for (const [token, source] of TOKENS) {
      const before = d.diff[source]?.before;
      if (before) out[token] = before;
    }
    return out;
  }
  return {};
})();

// Hand-tweak: cream-hover is a touch lighter than cream-active, but the
// Terracotta picker showed both as different from #fbf5ef. Hard-code our
// existing Glimmora value as the default.
before["--brand-cream-hover"] = "#fbf5ef";

const lines = [];
lines.push(":root {");
for (const [k, v] of Object.entries(before)) lines.push(`  ${k}: ${v};`);
lines.push("}");
lines.push("");

for (const d of data) {
  if (Object.keys(d.diff).length === 0) continue;
  const slug = d.label.toLowerCase().replace(/\s+/g, "-");
  if (slug === "terracotta") continue; // already :root
  lines.push(`[data-theme="${slug}"] {`);
  for (const [token, source] of TOKENS) {
    const v = d.diff[source]?.after;
    if (v) lines.push(`  ${token}: ${v};`);
  }
  // approximate cream-hover for non-default themes
  const p50 = d.diff["--primary-50"]?.after;
  if (p50) lines.push(`  --brand-cream-hover: ${p50};`);
  lines.push("}");
  lines.push("");
}

console.log(lines.join("\n"));
