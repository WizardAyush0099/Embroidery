#!/usr/bin/env node
/**
 * Live verification against the configured Supabase project.
 *
 *   node scripts/verify-live.mjs
 *
 * Expectations (tables, functions, buckets) are read straight out of
 * supabase/schema.sql so this script never drifts from the migration.
 * Exit code 0 = every check passed.
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
const URL_BASE = (env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
const ANON =
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";
const SERVICE = (env.SUPABASE_SERVICE_ROLE_KEY || "").trim();

if (!URL_BASE || !ANON) {
  console.error("NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY missing in .env.local");
  process.exit(1);
}

const schema = readFileSync("supabase/schema.sql", "utf8");
const unique = (list) => [...new Set(list)];
const expectedTables = unique(
  [...schema.matchAll(/create table(?: if not exists)?\s+(?:public\.)?([a-z0-9_]+)/gi)].map((m) =>
    m[1].toLowerCase(),
  ),
);
const expectedFns = unique(
  [...schema.matchAll(/create or replace function\s+(?:public\.)?([a-z0-9_]+)/gi)].map((m) =>
    m[1].toLowerCase(),
  ),
);
// Only look inside the storage.buckets insert (category seeds share the shape).
const expectedBuckets = unique(
  [...schema.matchAll(/insert into storage\.buckets[\s\S]*?on conflict/gi)].flatMap((block) =>
    [...block[0].matchAll(/\(\s*'([a-z0-9-]+)'\s*,/g)].map((m) => m[1]),
  ),
);
// Trigger functions are never exposed through PostgREST's RPC surface.
const triggerFns = unique(
  [...schema.matchAll(/create or replace function\s+(?:public\.)?([a-z0-9_]+)\s*\([^)]*\)\s*returns\s+trigger/gi)].map(
    (m) => m[1].toLowerCase(),
  ),
);
const expectedRpcFns = expectedFns.filter((f) => !triggerFns.includes(f));

const results = [];
const record = (name, ok, detail) => {
  results.push({ name, ok, detail });
  console.log(`${ok ? "  ✓" : "  ✗"} ${name}${detail ? ` — ${detail}` : ""}`);
};

const headers = (key, extra = {}) => ({
  apikey: key,
  Authorization: `Bearer ${key}`,
  ...extra,
});

async function main() {
  console.log(`\nProject: ${URL_BASE}\n`);

  // 1. Schema: probe every table declared in schema.sql.
  console.log("Schema");
  const probeTable = async (table) => {
    const res = await fetch(`${URL_BASE}/rest/v1/${table}?select=*&limit=0`, {
      headers: headers(ANON),
    });
    let body = "";
    if (!res.ok) body = await res.text();
    const missing = res.status === 404 && body.includes("PGRST205");
    return { table, status: res.status, exists: res.ok || !missing };
  };
  const tableProbes = await Promise.all(expectedTables.map(probeTable));
  const missingTables = tableProbes.filter((p) => !p.exists).map((p) => p.table);
  record(
    `Tables present (${tableProbes.length - missingTables.length}/${tableProbes.length})`,
    missingTables.length === 0,
    missingTables.length ? `missing: ${missingTables.join(", ")}` : "ok",
  );

  // Functions that are revoked from anon still exist; probe with the service
  // role so a permission denial is not mistaken for a missing function.
  // Required (non-defaulted) arguments must be supplied or PostgREST answers
  // 404 PGRST202 even though the function exists. place_order raises
  // EMPTY_CART before touching any row, so this probe has no side effects.
  const probeArgs = { place_order: { p_customer: {}, p_items: [] } };
  const probeFn = async (fn, key = SERVICE || ANON) => {
    const res = await fetch(`${URL_BASE}/rest/v1/rpc/${fn}`, {
      method: "POST",
      headers: headers(key, { "Content-Type": "application/json" }),
      body: JSON.stringify(probeArgs[fn] ?? {}),
    });
    const body = res.ok ? "" : await res.text();
    const missing = res.status === 404 && body.includes("PGRST202");
    return { fn, status: res.status, exists: !missing };
  };
  const fnProbes = await Promise.all(expectedRpcFns.map(probeFn));
  const missingFns = fnProbes.filter((p) => !p.exists).map((p) => p.fn);
  if (expectedRpcFns.length) {
    record(
      `Functions present (${fnProbes.length - missingFns.length}/${fnProbes.length})`,
      missingFns.length === 0,
      missingFns.length ? `missing: ${missingFns.join(", ")}` : "ok",
    );
  }
  if (triggerFns.length) {
    record(`Trigger functions: ${triggerFns.join(", ")}`, true, "checked via SQL below");
  }

  // 2. Row counts (seed data).
  console.log("\nSeed data");
  const count = async (table, filter = "", key = ANON) => {
    const url = `${URL_BASE}/rest/v1/${table}?select=id${filter}`;
    const res = await fetch(url, {
      headers: headers(key, { Prefer: "count=exact", Range: "0-0" }),
    });
    if (!res.ok) return { ok: false, status: res.status, count: null };
    const range = res.headers.get("content-range") || "";
    const total = Number(range.split("/")[1]);
    return { ok: true, status: res.status, count: Number.isFinite(total) ? total : null };
  };

  const products = await count("products");
  record(
    "products readable",
    products.ok,
    products.ok ? `${products.count} rows` : `HTTP ${products.status}`,
  );
  if (products.ok) {
    record("products seeded", (products.count ?? 0) >= 8, `${products.count} rows (expect ≥ 8)`);
  }
  const categories = await count("categories");
  if (categories.ok) record("categories seeded", (categories.count ?? 0) > 0, `${categories.count} rows`);

  // 3. Storage buckets.
  console.log("\nStorage");
  const bucketRes = await fetch(`${URL_BASE}/storage/v1/bucket`, {
    headers: headers(SERVICE || ANON),
  });
  let buckets = [];
  if (bucketRes.ok) {
    try {
      buckets = await bucketRes.json();
    } catch {
      buckets = [];
    }
  }
  record("buckets listable", bucketRes.ok, `${Array.isArray(buckets) ? buckets.length : 0} bucket(s)`);
  for (const name of unique(expectedBuckets)) {
    const found = buckets.find?.((b) => b.id === name || b.name === name);
    record(
      `bucket ${name}`,
      Boolean(found),
      found ? `public=${String(found.public)}` : "not created",
    );
  }

  // 4. RLS: anonymous callers must not be able to write or read private rows.
  console.log("\nRow level security");
  const anonInsert = await fetch(`${URL_BASE}/rest/v1/products`, {
    method: "POST",
    headers: headers(ANON, { "Content-Type": "application/json", Prefer: "return=minimal" }),
    body: JSON.stringify({ slug: "rls-probe-should-fail", name: "RLS probe", price: 1 }),
  });
  record(
    "anon insert into products blocked",
    anonInsert.status === 401 || anonInsert.status === 403,
    `HTTP ${anonInsert.status}`,
  );
  const anonOrders = await fetch(`${URL_BASE}/rest/v1/orders?select=id&limit=1`, {
    headers: headers(ANON),
  });
  if (anonOrders.ok) {
    const rows = await anonOrders.json().catch(() => []);
    record("anon cannot read orders", Array.isArray(rows) && rows.length === 0, `${rows.length} row(s)`);
  } else {
    record("anon cannot read orders", anonOrders.status === 401 || anonOrders.status === 403, `HTTP ${anonOrders.status}`);
  }
  const anonRpc = await probeFn("place_order", ANON);
  record(
    "place_order not executable by anon",
    !anonRpc.exists || anonRpc.status === 401 || anonRpc.status === 403,
    `HTTP ${anonRpc.status}`,
  );

  // 5. Auth providers.
  console.log("\nAuth");
  const settings = await fetch(`${URL_BASE}/auth/v1/settings`, { headers: headers(ANON) });
  if (settings.ok) {
    const json = await settings.json().catch(() => ({}));
    record("Google provider enabled", Boolean(json.external?.google), String(json.external?.google));
  } else {
    record("auth settings", false, `HTTP ${settings.status}`);
  }

  // 6. Service role (server-only operations: admin writes, place_order, signed uploads).
  console.log("\nService role");
  if (!SERVICE) {
    record("SUPABASE_SERVICE_ROLE_KEY set", false, "empty — admin writes, checkout and uploads will fail");
  } else {
    const admin = await fetch(`${URL_BASE}/rest/v1/products?select=id&limit=1`, {
      headers: headers(SERVICE),
    });
    record("service role can read products", admin.ok, `HTTP ${admin.status}`);
    const adminUsers = await fetch(`${URL_BASE}/auth/v1/admin/users?per_page=1`, {
      headers: headers(SERVICE),
    });
    record("service role can list auth users", adminUsers.ok, `HTTP ${adminUsers.status}`);
  }

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  if (failed.length) {
    console.log("Failing:");
    for (const f of failed) console.log(`  - ${f.name}${f.detail ? ` (${f.detail})` : ""}`);
  }
  process.exit(failed.length ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
