import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const env = {};
for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const t = line.trim();
  if (!t || t.startsWith("#") || !t.includes("=")) continue;
  const i = t.indexOf("=");
  env[t.slice(0, i).trim()] = t.slice(i + 1).trim().replace(/^["']|["']$/g, "");
}
const URL = env.NEXT_PUBLIC_SUPABASE_URL;
const op = { auth: { persistSession: false, autoRefreshToken: false } };
const admin = createClient(URL, env.SUPABASE_SERVICE_ROLE_KEY, op);
const anon = createClient(URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, op);

const results = [];
const check = (name, ok, detail = "") => {
  results.push({ name, ok });
  console.log(`${ok ? "  ✓" : "  ✗"} ${name}${detail ? ` — ${detail}` : ""}`);
};
const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==",
  "base64",
);

const restore = [];
let failed = false;

try {
  console.log("\nCatalog");
  const { data: products, error: pErr } = await admin
    .from("products")
    .select("id,name,slug,sizes,size_stock,stock,price,is_published")
    .eq("is_published", true);
  if (pErr) throw pErr;
  check("published products readable", (products?.length ?? 0) >= 8, `${products?.length} rows`);

  let picked = null;
  let size = null;
  for (const p of products ?? []) {
    for (const s of p.sizes ?? []) {
      if (((p.size_stock ?? {})[s] ?? 0) > 0) { picked = p; size = s; break; }
    }
    if (picked) break;
  }
  if (!picked) {
    picked = (products ?? []).find((p) => (p.stock ?? 0) > 0) ?? (products ?? [])[0];
    size = picked?.sizes?.[0] ?? null;
  }
  if (!picked) throw new Error("no products to test with");

  // Guarantee capacity for one unit, remembering the exact prior state.
  const before = { size_stock: picked.size_stock, stock: picked.stock };
  const available = size ? ((picked.size_stock ?? {})[size] ?? 0) : (picked.stock ?? 0);
  if (available < 1) {
    const nextSizeStock = { ...(picked.size_stock ?? {}) };
    if (size) nextSizeStock[size] = 3;
    await admin
      .from("products")
      .update({ size_stock: nextSizeStock, stock: Math.max(picked.stock ?? 0, 3) })
      .eq("id", picked.id);
  }
  restore.push(async () => {
    await admin.from("products").update({ size_stock: before.size_stock, stock: before.stock }).eq("id", picked.id);
  });

  console.log("\nCheckout (place_order RPC, same payload as the app)");
  const customer = {
    name: "E2E Verification",
    email: "e2e@example.com",
    phone: "+919000000000",
    address: { line1: "1 Test Road", line2: "", city: "Mumbai", state: "MH", postal_code: "400001", country: "India" },
  };
  const items = [
    { product_id: picked.id, size: size ?? "", color: "Test", quantity: 1, embroidery_text: "E2E", placement: "chest" },
  ];
  const { data: order, error: oErr } = await admin.rpc("place_order", {
    p_customer: customer,
    p_items: items,
    p_payment_method: "cod",
    p_user_id: null,
    p_notes: "e2e verification",
    p_proof_preference: "digital",
  });
  if (oErr) throw new Error(`place_order: ${oErr.message}`);
  const orderNumber = order?.order_number ?? "";
  check("order created", Boolean(order?.order_id), orderNumber);
  check("order number format AB-YY-NNNN", /^AB-\d{2}-\d{4}$/.test(orderNumber), orderNumber);
  const expectedTotal = Number(order?.subtotal ?? 0) + Number(order?.shipping_fee ?? 0);
  check(
    "total = subtotal + shipping",
    Math.abs(Number(order?.total ?? -1) - expectedTotal) < 0.01,
    `subtotal ${order?.subtotal} + shipping ${order?.shipping_fee} = ${order?.total}`,
  );
  if (order?.order_id) {
    restore.push(async () => {
      await admin.from("orders").delete().eq("id", order.order_id);
    });
    const { data: row } = await admin
      .from("orders")
      .select("order_number,status,payment_method,payment_status,customer_name,email,shipping_address")
      .eq("id", order.order_id)
      .single();
    check("order row persisted", row?.order_number === orderNumber, `${row?.status}/${row?.payment_method}`);
    check("shipping address stored", Boolean(row?.shipping_address?.city), row?.shipping_address?.city ?? "missing");
    const { data: lines } = await admin.from("order_items").select("name,size,quantity,line_total,embroidery_text").eq("order_id", order.order_id);
    check("order line items written", (lines?.length ?? 0) === 1, `${lines?.[0]?.name} / ${lines?.[0]?.size}`);
    const { data: after } = await admin.from("products").select("stock,size_stock").eq("id", picked.id).single();
    const afterAvailable = size ? (after?.size_stock ?? {})[size] ?? 0 : after?.stock ?? 0;
    check("stock decremented by 1", afterAvailable === (available < 1 ? 2 : available - 1), `${available} → ${afterAvailable}`);
  }

  console.log("\nCustom request + private reference upload");
  const { data: req, error: rErr } = await admin
    .from("custom_requests")
    .insert({
      customer_name: "E2E Verification",
      email: "e2e@example.com",
      phone: "+919000000000",
      garment_id: picked.id,
      garment_name: picked.name,
      size: size ?? "M",
      color: "Ivory",
      custom_text: "E2E",
      font_style: "script",
      thread_color: "gold",
      placement: "chest",
      description: "Automated verification run.",
      reference_images: [],
      status: "new",
    })
    .select("id,request_number,status")
    .single();
  if (rErr) throw new Error(`custom_requests insert: ${rErr.message}`);
  check("request created", Boolean(req?.id), req?.request_number);
  check("request number format CR-YY-NNNN", /^CR-\d{2}-\d{4}$/.test(req?.request_number ?? ""), req?.request_number);
  if (req?.id) restore.push(async () => { await admin.from("custom_requests").delete().eq("id", req.id); });

  const path = `requests/${new Date().toISOString().slice(0, 7)}/e2e-${Date.now()}.png`;
  const { data: signed, error: sErr } = await admin.storage.from("custom-references").createSignedUploadUrl(path);
  check("signed upload URL issued", Boolean(signed?.token), sErr?.message ?? path);
  if (signed?.token) {
    restore.push(async () => { await admin.storage.from("custom-references").remove([path]); });
    const { error: upErr } = await admin.storage
      .from("custom-references")
      .uploadToSignedUrl(path, signed.token, png, { contentType: "image/png" });
    check("browser-style upload to private bucket", !upErr, upErr?.message ?? "ok");
    const { data: priv } = await anon.storage.from("custom-references").download(path);
    check("private reference blocked for anon", !priv, priv ? "ANON COULD READ IT" : "denied");
  }

  const pubPath = `e2e/${Date.now()}.png`;
  const { error: pubErr } = await admin.storage.from("product-images").upload(pubPath, png, { contentType: "image/png", upsert: true });
  if (!pubErr) {
    restore.push(async () => { await admin.storage.from("product-images").remove([pubPath]); });
    const { data: pub } = admin.storage.from("product-images").getPublicUrl(pubPath);
    const res = await fetch(pub.publicUrl);
    check("public product image served over CDN", res.ok, `HTTP ${res.status}`);
  } else {
    check("upload to public bucket", false, pubErr.message);
  }
} catch (err) {
  failed = true;
  console.log(`\n  ✗ FATAL — ${err.message}`);
} finally {
  for (const fn of restore.reverse()) {
    try { await fn(); } catch (e) { console.log(`  ! cleanup: ${e.message}`); }
  }
  const bad = results.filter((r) => !r.ok);
  console.log(`\n${results.length - bad.length}/${results.length} checks passed${bad.length ? ` — failing: ${bad.map((b) => b.name).join(", ")}` : ""}`);
  process.exit(bad.length || failed ? 1 : 0);
}
