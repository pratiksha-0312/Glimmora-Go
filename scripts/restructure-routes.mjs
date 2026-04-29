// Moves admin routes into verifai-style group folders and adjusts the
// `../`-depth of any imports that escape `src/` (e.g. `../../../../generated/prisma`)
// inside each moved file. Also rewrites inbound link references in the rest
// of the codebase.
//
// Run: node scripts/restructure-routes.mjs

import fs from "node:fs/promises";
import path from "node:path";

const MOVES = [
  // /cities split into two groups — archetype goes first so it isn't
  // dragged along when /cities itself is renamed.
  {
    from: "src/app/(admin)/cities/archetype",
    to: "src/app/(admin)/configuration/city-archetype",
  },
  {
    from: "src/app/(admin)/cities",
    to: "src/app/(admin)/pricing-promotions/cities",
  },
  // Pricing & Promotions
  {
    from: "src/app/(admin)/fares",
    to: "src/app/(admin)/pricing-promotions/fares",
  },
  {
    from: "src/app/(admin)/concessions",
    to: "src/app/(admin)/pricing-promotions/concessions",
  },
  {
    from: "src/app/(admin)/coupons",
    to: "src/app/(admin)/pricing-promotions/coupons",
  },
  // Safety
  { from: "src/app/(admin)/sos", to: "src/app/(admin)/safety/sos" },
  { from: "src/app/(admin)/tracking", to: "src/app/(admin)/safety/tracking" },
  // Driver Operations
  {
    from: "src/app/(admin)/drivers",
    to: "src/app/(admin)/driver-operations/drivers",
  },
  {
    from: "src/app/(admin)/subscriptions",
    to: "src/app/(admin)/driver-operations/subscriptions",
  },
  {
    from: "src/app/(admin)/referrals",
    to: "src/app/(admin)/driver-operations/referrals",
  },
  // Configuration
  { from: "src/app/(admin)/admins", to: "src/app/(admin)/configuration/admins" },
  {
    from: "src/app/(admin)/notifications",
    to: "src/app/(admin)/configuration/notifications",
  },
  { from: "src/app/(admin)/audit", to: "src/app/(admin)/configuration/audit" },
  // Partner Management — corporates folds under /partners/enterprise
  {
    from: "src/app/(admin)/corporates",
    to: "src/app/(admin)/partners/enterprise",
  },
];

// Inbound link rewrites: keys are old URL paths, values are new ones.
// Order matters — longer paths first so /admins/roles isn't mangled by
// /admins. We match on word boundaries / non-word chars after the path.
const URL_REWRITES = [
  // Sub-routes first so they don't get clobbered by their parent.
  ["/cities/archetype", "/configuration/city-archetype"],
  ["/admins/roles", "/configuration/admins/roles"],
  ["/drivers/", "/driver-operations/drivers/"],
  ["/partners/enterprise/", "/partners/enterprise/"],
  ["/corporates/", "/partners/enterprise/"],
  ["/tickets/", "/tickets/"], // tickets stay flat — explicit no-op
  // Top-level routes
  ["/cities", "/pricing-promotions/cities"],
  ["/fares", "/pricing-promotions/fares"],
  ["/concessions", "/pricing-promotions/concessions"],
  ["/coupons", "/pricing-promotions/coupons"],
  ["/sos", "/safety/sos"],
  ["/tracking", "/safety/tracking"],
  ["/drivers", "/driver-operations/drivers"],
  ["/subscriptions", "/driver-operations/subscriptions"],
  ["/referrals", "/driver-operations/referrals"],
  ["/admins", "/configuration/admins"],
  ["/notifications", "/configuration/notifications"],
  ["/audit", "/configuration/audit"],
  ["/corporates", "/partners/enterprise"],
];

function depthChange(from, to) {
  return to.split("/").length - from.split("/").length;
}

async function exists(p) {
  try {
    await fs.stat(p);
    return true;
  } catch {
    return false;
  }
}

async function* walkFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* walkFiles(p);
    else if (e.isFile() && /\.(tsx?|jsx?|mjs)$/.test(e.name)) yield p;
  }
}

async function fixRelativeImports(file, levelsAdded) {
  if (levelsAdded === 0) return;
  const before = await fs.readFile(file, "utf8");
  const re = /(from\s+['"]|import\s+['"]|require\(['"])((?:\.\.\/){4,})/g;
  const after = before.replace(re, (_m, prefix, ups) => {
    return prefix + "../".repeat(levelsAdded) + ups;
  });
  if (after !== before) await fs.writeFile(file, after);
}

async function copyDirRecursive(from, to) {
  await fs.mkdir(to, { recursive: true });
  const entries = await fs.readdir(from, { withFileTypes: true });
  for (const e of entries) {
    const srcPath = path.join(from, e.name);
    const dstPath = path.join(to, e.name);
    if (e.isDirectory()) {
      await copyDirRecursive(srcPath, dstPath);
    } else {
      await fs.copyFile(srcPath, dstPath);
    }
  }
}

async function rmDirRecursive(p) {
  await fs.rm(p, { recursive: true, force: true });
}

async function moveDir(from, to) {
  if (!(await exists(from))) {
    console.warn(`(skip) ${from} does not exist`);
    return;
  }
  if (await exists(to)) {
    console.warn(`(skip) ${to} already exists`);
    return;
  }
  await fs.mkdir(path.dirname(to), { recursive: true });
  // Try fast rename first; fall back to copy + remove on Windows when
  // the dev server has a watcher holding the source.
  try {
    await fs.rename(from, to);
  } catch (err) {
    if (err.code !== "EPERM" && err.code !== "EBUSY") throw err;
    console.warn(`  rename failed (${err.code}), falling back to copy + delete`);
    await copyDirRecursive(from, to);
    await rmDirRecursive(from);
  }
  const dd = depthChange(from, to);
  for await (const f of walkFiles(to)) {
    await fixRelativeImports(f, dd);
  }
  console.log(`✓ ${from} → ${to} (depth ${dd >= 0 ? "+" + dd : dd})`);
}

function rewriteUrls(content) {
  let out = content;
  for (const [from, to] of URL_REWRITES) {
    if (from === to) continue;
    // Match the path when followed by end-of-string, /, ?, ", ', `, ),
    // # or whitespace — i.e. not the start of a longer path segment.
    // Anchor on a quote or backtick before to avoid matching unrelated text.
    const re = new RegExp(
      `(["'\`(])${from.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")}(?=["'\`)?#\\s/]|\\$)`,
      "g"
    );
    out = out.replace(re, (_m, q) => q + to);
  }
  return out;
}

async function rewriteInboundLinks() {
  const root = "src";
  let touched = 0;
  for await (const f of walkFiles(root)) {
    // Skip files inside the moved directories — they're already done
    // by relative-import fix; URL strings inside them point at correct
    // new paths because the script also runs them through this rewrite.
    const before = await fs.readFile(f, "utf8");
    const after = rewriteUrls(before);
    if (after !== before) {
      await fs.writeFile(f, after);
      touched++;
      console.log(`  url-rewrite: ${f}`);
    }
  }
  console.log(`URL rewrites: ${touched} files`);
}

async function main() {
  for (const m of MOVES) {
    await moveDir(m.from, m.to);
  }
  console.log("\n--- inbound link rewrites ---");
  await rewriteInboundLinks();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
