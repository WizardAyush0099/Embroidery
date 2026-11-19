#!/usr/bin/env node
/**
 * Remove the eight demo garments that shipped with the original design.
 *
 *   node scripts/remove-demo-catalogue.mjs [--dry-run]
 *
 * Deletes by slug, so anything the atelier has added since is untouched.
 * Reads credentials from .env.local / the environment; never prints them.
 */
import { readFileSync } from "node:fs";

const readEnv = (file) => {
  const out = {};
  let raw = "";
  try {
    raw = readFileSync(file, "utf8");
  } catch {
    return out;
  }
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
};

const env = { ...readEnv(".env.local"), ...process.env };
const BASE = (env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
const SERVICE = (env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
const dryRun = process.argv.includes("--dry-run");

if (!BASE || !SERVICE) {
  console.error("NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing.");
  process.exit(1);
}

const DEMO_SLUGS = [
  "sovereign-heavyweight-hoodie",
  "nocturne-pullover-hoodie",
  "herbarium-boxy-tee",
  "atelier-boxy-heavyweight-tee",
  "flax-artisan-overshirt",
  "sculpted-six-panel-cap",
  "archival-french-terry-crewneck",
  "custom-canvas-hoodie-blank",
];

const headers = {
  apikey: SERVICE,
  Authorization: `Bearer ${SERVICE}`,
  "Content-Type": "application/json",
};

const filter = `slug=in.(${DEMO_SLUGS.join(",")})`;

async function main() {
  const before = await fetch(`${BASE}/rest/v1/products?select=id,slug,name&${filter}`, { headers });
  if (!before.ok) throw new Error(`lookup failed: ${before.status} ${await before.text()}`);
  const found = await before.json();

  if (found.length === 0) {
    console.log("No demo garments found — the catalogue is already clean.");
  } else {
    console.log(`Found ${found.length} demo garment(s):`);
    for (const row of found) console.log(`  · ${row.name} (${row.slug})`);
  }

  if (dryRun) {
    console.log("Dry run — nothing deleted.");
    return;
  }
  if (found.length === 0) return;

  const removed = await fetch(`${BASE}/rest/v1/products?${filter}`, {
    method: "DELETE",
    headers: { ...headers, Prefer: "return=representation" },
  });
  if (!removed.ok) throw new Error(`delete failed: ${removed.status} ${await removed.text()}`);
  const deleted = await removed.json();

  const after = await fetch(`${BASE}/rest/v1/products?select=id&limit=1`, {
    headers: { ...headers, Prefer: "count=exact" },
  });
  const range = after.headers.get("content-range") || "";
  console.log(`Deleted ${deleted.length} demo garment(s). Remaining products: ${range.split("/")[1] ?? "?"}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
