/**
 * Points the live store settings at the studio's real phone number. Only
 * replaces the seeded placeholder, so a number the owner typed in the admin
 * settings form is never overwritten.
 *
 *   node scripts/set-studio-phone.mjs           # apply
 *   node scripts/set-studio-phone.mjs --dry-run # report only
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const STUDIO_PHONE = "+91 83530 11030";
const PLACEHOLDER = "+91 98200 00000";

function loadEnv() {
  const env = {};
  try {
    const raw = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!match) continue;
      env[match[1]] = match[2].replace(/^["']|["']$/g, "");
    }
  } catch {
    // Falls back to the process environment.
  }
  return { ...env, ...process.env };
}

const env = loadEnv();
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
const dryRun = process.argv.includes("--dry-run");

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const headers = { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" };

const read = await fetch(`${url}/rest/v1/store_settings?select=id,contact_phone&id=eq.1`, { headers });
if (!read.ok) {
  console.error(`Could not read store_settings (${read.status}).`);
  process.exit(1);
}
const [row] = await read.json();
if (!row) {
  console.error("No store_settings row with id 1.");
  process.exit(1);
}

console.log(`Current concierge phone: ${row.contact_phone}`);

if (row.contact_phone !== PLACEHOLDER) {
  console.log("Leaving it untouched — it is no longer the seeded placeholder.");
  process.exit(0);
}

if (dryRun) {
  console.log(`Would set it to ${STUDIO_PHONE}.`);
  process.exit(0);
}

const write = await fetch(`${url}/rest/v1/store_settings?id=eq.1`, {
  method: "PATCH",
  headers: { ...headers, Prefer: "return=representation" },
  body: JSON.stringify({ contact_phone: STUDIO_PHONE }),
});

if (!write.ok) {
  console.error(`Update failed (${write.status}): ${await write.text()}`);
  process.exit(1);
}

const [updated] = await write.json();
console.log(`Updated concierge phone: ${updated.contact_phone}`);
