/**
 * Local validation of supabase/schema.sql + seed.sql + place_order().
 * Runs a throwaway PostgreSQL instance with minimal Supabase stubs
 * (auth.users, auth.jwt(), auth.uid(), storage.buckets, storage.objects).
 *
 * Usage: node scripts/verify-sql.mjs
 * Requires optional dev packages: embedded-postgres, pg
 * (npm install --no-save --package-lock=false embedded-postgres pg)
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, rmSync } from "node:fs";
import path from "node:path";
import pg from "pg";

const ROOT = process.cwd();
const DATA_DIR = "/tmp/atelier-pg-verify";
const PORT = 55432;
const BIN = path.join(ROOT, "node_modules/@embedded-postgres/linux-x64/native/bin");

function sql(name) {
  return readFileSync(path.join(ROOT, "supabase", name), "utf8");
}

const stubs = `
create schema if not exists auth;
create table if not exists auth.users (id uuid primary key default gen_random_uuid());
create or replace function auth.jwt() returns jsonb language sql stable as $$
  select coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb, '{}'::jsonb);
$$;
create or replace function auth.uid() returns uuid language sql stable as $$
  select nullif(auth.jwt() ->> 'sub', '')::uuid;
$$;
create schema if not exists storage;
create table if not exists storage.buckets (
  id text primary key, name text, public boolean,
  file_size_limit bigint, allowed_mime_types text[]
);
create table if not exists storage.objects (
  id uuid primary key default gen_random_uuid(), bucket_id text, name text
);
do $$ begin create role anon; exception when duplicate_object then null; end $$;
do $$ begin create role authenticated; exception when duplicate_object then null; end $$;
do $$ begin create role service_role bypassrls; exception when duplicate_object then null; end $$;
`;

function startPostgres() {
  if (!existsSync(BIN)) throw new Error(`Postgres binaries not found at ${BIN}`);
  rmSync(DATA_DIR, { recursive: true, force: true });
  execFileSync(path.join(BIN, "initdb"), ["-D", DATA_DIR, "-U", "postgres", "--auth=trust", "-E", "UTF8", "--no-locale"], {
    stdio: "ignore",
  });
  execFileSync(
    path.join(BIN, "pg_ctl"),
    ["-D", DATA_DIR, "-o", `-p ${PORT} -k /tmp -c listen_addresses='127.0.0.1'`, "-l", "/tmp/atelier-pg.log", "start", "-w"],
    { stdio: "ignore" },
  );
}

function stopPostgres() {
  try {
    execFileSync(path.join(BIN, "pg_ctl"), ["-D", DATA_DIR, "stop", "-m", "immediate"], { stdio: "ignore" });
  } catch {
    /* already stopped */
  }
}

async function main() {
  startPostgres();
  const admin = new pg.Client({ host: "127.0.0.1", port: PORT, user: "postgres", database: "postgres" });
  await admin.connect();
  await admin.query("drop database if exists atelier_verify");
  await admin.query("create database atelier_verify");
  await admin.end();

  const db = new pg.Client({ host: "127.0.0.1", port: PORT, user: "postgres", database: "atelier_verify" });
  await db.connect();

  await db.query(stubs);
  await db.query(sql("schema.sql"));
  console.log("✓ schema.sql applied");

  await db.query(sql("seed.sql"));
  await db.query(sql("seed.sql")); // idempotency check
  console.log("✓ seed.sql applied twice (idempotent)");

  const { rows: productRows } = await db.query(
    "select count(*)::int as count from public.products",
  );
  if (productRows[0].count !== 8) throw new Error(`expected 8 products, got ${productRows[0].count}`);
  console.log("✓ 8 products seeded");

  // Anonymous shopper sees published products only
  await db.query("set role anon");
  const { rows: anonRows } = await db.query("select count(*)::int as count from public.products");
  await db.query("reset role");
  if (anonRows[0].count !== 8) throw new Error(`anon should see 8 products, saw ${anonRows[0].count}`);
  console.log("✓ RLS: anon reads published catalogue");

  // Admin (JWT email in admin_users) sees drafts too
  await db.query("update public.products set is_published = false where slug = 'archival-french-terry-crewneck'");
  await db.query(
    `set request.jwt.claims = '{"email":"ayushdanthta@gmail.com","sub":"11111111-1111-1111-1111-111111111111"}'`,
  );
  await db.query("set role authenticated");
  const { rows: adminRows } = await db.query("select count(*)::int as count from public.products");
  await db.query("reset role");
  await db.query(`set request.jwt.claims = ''`);
  await db.query("set role anon");
  const { rows: draftHidden } = await db.query("select count(*)::int as count from public.products");
  await db.query("reset role");
  if (adminRows[0].count !== 8 || draftHidden[0].count !== 7) {
    throw new Error(`RLS mismatch: admin=${adminRows[0].count} anon=${draftHidden[0].count}`);
  }
  console.log("✓ RLS: admin sees drafts, anon does not");
  await db.query("update public.products set is_published = true where slug = 'archival-french-terry-crewneck'");

  // Checkout through the RPC
  const { rows: orderRows } = await db.query(
    `select public.place_order(
      '{"name":"Test Patron","email":"test@example.com","phone":"+919820000000",
        "address":{"line1":"12 Atelier Lane","city":"Mumbai","state":"Maharashtra","postal_code":"400001"}}'::jsonb,
      (select jsonb_agg(jsonb_build_object('product_id', id, 'size','M','color','Washed Noir','quantity',2))
       from public.products where slug = 'sovereign-heavyweight-hoodie'),
      'cod', null, 'Test order', 'digital'
    ) as result`,
  );
  const result = orderRows[0].result;
  if (Number(result.total) !== 18050) throw new Error(`expected total 18050, got ${result.total}`);
  console.log(`✓ place_order created ${result.order_number} with total ₹${result.total} (incl. ₹250 delivery)`);

  const { rows: stockRows } = await db.query(
    "select stock, size_stock from public.products where slug = 'sovereign-heavyweight-hoodie'",
  );
  if (stockRows[0].stock !== 38 || stockRows[0].size_stock.M !== 8) {
    throw new Error(`stock not decremented: ${JSON.stringify(stockRows[0])}`);
  }
  console.log("✓ stock decremented (M 10 → 8, total 40 → 38)");

  const { rows: itemRows } = await db.query("select name, quantity, unit_price, line_total from public.order_items");
  if (itemRows.length !== 1 || Number(itemRows[0].unit_price) !== 8900) throw new Error("order item snapshot wrong");
  console.log("✓ order item snapshot written at database price");

  // Free shipping threshold
  const { rows: bigRows } = await db.query(
    `select public.place_order(
      '{"name":"Test Patron","email":"test@example.com","phone":"+919820000000","address":{"line1":"1","city":"Mumbai","state":"MH","postal_code":"400001"}}'::jsonb,
      (select jsonb_agg(jsonb_build_object('product_id', id, 'size','L','color','Natural Flax','quantity',3))
       from public.products where slug = 'flax-artisan-overshirt'),
      'razorpay', null, null, 'digital'
    ) as result`,
  );
  if (Number(bigRows[0].result.shipping_fee) !== 0) throw new Error("free shipping threshold failed");
  console.log("✓ complimentary delivery above ₹25,000");

  // Oversell protection
  let blocked = false;
  try {
    await db.query(
      `select public.place_order(
        '{"name":"X","email":"x@example.com","phone":"+919820000000","address":{"line1":"1","city":"Mumbai","state":"MH","postal_code":"400001"}}'::jsonb,
        (select jsonb_agg(jsonb_build_object('product_id', id, 'size','XXL','color','Mineral Sage','quantity',99))
         from public.products where slug = 'sovereign-heavyweight-hoodie'),
        'cod', null, null, 'digital'
      )`,
    );
  } catch (error) {
    blocked = String(error.message).includes("INSUFFICIENT_STOCK");
  }
  if (!blocked) throw new Error("oversell was not blocked");
  console.log("✓ oversell rejected with INSUFFICIENT_STOCK");

  // Custom request numbering + private artwork column
  const { rows: requestRows } = await db.query(
    `insert into public.custom_requests
      (customer_name, email, phone, garment_name, size, custom_text, font_style, thread_color, placement, description, reference_images)
     values ('Test Patron','test@example.com','+919820000000','The Sovereign Heavyweight Hoodie','M','A • B',
             'Dilofé Serif Classic','Terracotta silk','Left chest','Family crest','{"requests/2026-11/ref.jpg"}')
     returning request_number, status`,
  );
  if (!/^CR-\d{2}-\d{4}$/.test(requestRows[0].request_number) || requestRows[0].status !== "new") {
    throw new Error(`request numbering failed: ${JSON.stringify(requestRows[0])}`);
  }
  console.log(`✓ custom request ${requestRows[0].request_number} created with status "new"`);

  await db.end();
  stopPostgres();
  console.log("\nAll SQL checks passed.");
}

main().catch((error) => {
  console.error("\nSQL verification failed:", error.message);
  stopPostgres();
  process.exit(1);
});
