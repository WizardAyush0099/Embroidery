"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { slugify } from "@/lib/utils";

export type ProductFormState = {
  status: "idle" | "error";
  message?: string;
  fieldErrors?: Record<string, string>;
};

function parseJsonArray<T>(raw: FormDataEntryValue | null, fallback: T[]): T[] {
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(String(raw));
    return Array.isArray(parsed) ? (parsed as T[]) : fallback;
  } catch {
    return fallback;
  }
}

function parseJsonObject<T extends Record<string, unknown>>(raw: FormDataEntryValue | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(String(raw));
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as T) : fallback;
  } catch {
    return fallback;
  }
}

function numberOrNull(value: FormDataEntryValue | null) {
  if (value == null || String(value).trim() === "") return null;
  const parsed = Number(String(value));
  return Number.isFinite(parsed) ? parsed : null;
}

/** True when Postgres rejected the write because sort_order does not exist yet. */
function missingSortOrderColumn(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  return (
    error.code === "PGRST204" ||
    error.code === "42703" ||
    /sort_order/i.test(error.message ?? "")
  );
}

export async function saveProduct(
  _prevState: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const fabricLabel = String(formData.get("fabric_label") ?? "").trim();
  const technique = String(formData.get("technique") ?? "").trim();
  const stitchCount = numberOrNull(formData.get("stitch_count"));
  const price = numberOrNull(formData.get("price"));
  const compareAtPrice = numberOrNull(formData.get("compare_at_price"));
  const sortOrder = Math.trunc(numberOrNull(formData.get("sort_order")) ?? 0);
  const categoryId = String(formData.get("category_id") ?? "").trim();
  const images = parseJsonArray<string>(formData.get("images"), []).filter(Boolean).slice(0, 10);
  const sizes = parseJsonArray<string>(formData.get("sizes"), []).filter(Boolean).slice(0, 12);
  const colors = parseJsonArray<{ name: string; hex: string }>(formData.get("colors"), [])
    .filter((color) => color?.name && color?.hex)
    .slice(0, 12);
  const sizeStockRaw = parseJsonObject<Record<string, number>>(formData.get("size_stock"), {});
  const fallbackStock = Math.max(0, Math.floor(numberOrNull(formData.get("stock")) ?? 0));

  const fieldErrors: Record<string, string> = {};
  if (name.length < 3) fieldErrors.name = "Product name must be at least 3 characters.";
  if (price == null || price < 0) fieldErrors.price = "Enter a valid price.";
  if (compareAtPrice != null && compareAtPrice > 0 && compareAtPrice < (price ?? 0)) {
    fieldErrors.compare_at_price = "The original price must be higher than the selling price.";
  }
  if (images.length === 0) fieldErrors.images = "Add at least one product photograph.";
  if (Object.keys(fieldErrors).length > 0) {
    return { status: "error", message: "Please correct the highlighted fields.", fieldErrors };
  }

  const sizeStock = sizes.reduce<Record<string, number>>((acc, size) => {
    const value = Number(sizeStockRaw[size] ?? 0);
    acc[size] = Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
    return acc;
  }, {});

  const stock =
    sizes.length > 0 ? Object.values(sizeStock).reduce((sum, value) => sum + value, 0) : fallbackStock;

  const desiredSlug = slugify(String(formData.get("slug") ?? "") || name);

  try {
    const admin = createSupabaseAdminClient();

    let slug = desiredSlug || `garment-${Date.now()}`;
    const { data: clash } = await admin
      .from("products")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (clash && clash.id !== id) {
      slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
    }

    const payload = {
      name,
      slug,
      description: description || null,
      fabric_label: fabricLabel || null,
      technique: technique || null,
      stitch_count: stitchCount != null ? Math.floor(stitchCount) : null,
      price,
      compare_at_price: compareAtPrice && compareAtPrice > 0 ? compareAtPrice : null,
      category_id: categoryId || null,
      images,
      sizes,
      colors,
      size_stock: sizeStock,
      stock,
      sort_order: sortOrder,
      is_featured: formData.get("is_featured") === "on",
      is_new_arrival: formData.get("is_new_arrival") === "on",
      is_published: formData.get("is_published") === "on",
      is_customisable: formData.get("is_customisable") === "on",
    };

    const write = async (values: Record<string, unknown>) =>
      id
        ? admin.from("products").update(values).eq("id", id)
        : admin.from("products").insert(values);

    let { error } = await write(payload);
    if (missingSortOrderColumn(error)) {
      // The display-order migration has not been applied to this project yet;
      // save everything else rather than losing the atelier's work.
      const fallback: Record<string, unknown> = { ...payload };
      delete fallback.sort_order;
      ({ error } = await write(fallback));
    }
    if (error) throw error;

    revalidatePath("/");
    revalidatePath("/shop");
    revalidatePath(`/shop/${slug}`);
    revalidatePath("/custom");
    revalidatePath("/admin");
    revalidatePath("/admin/products");
    revalidatePath("/admin/inventory");
  } catch (error) {
    console.error("saveProduct failed", error);
    return {
      status: "error",
      message: "The product could not be saved. Check your Supabase connection and try again.",
    };
  }

  redirect(`/admin/products?saved=${encodeURIComponent(name)}`);
}

/** Inline catalogue ordering from the admin product list. */
export async function updateProductOrder(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "").trim();
  const raw = String(formData.get("sort_order") ?? "").trim();
  if (!id || raw === "") return;

  const value = Number(raw);
  if (!Number.isFinite(value)) return;

  const admin = createSupabaseAdminClient();
  let { error } = await admin
    .from("products")
    .update({ sort_order: Math.trunc(value) })
    .eq("id", id);

  if (missingSortOrderColumn(error)) {
    console.error("updateProductOrder: run supabase/migrations/20261119_product_display_order.sql");
    error = null;
  }
  if (error) console.error("updateProductOrder failed", error);

  revalidatePath("/");
  revalidatePath("/shop");
  revalidatePath("/admin/products");
}

export async function deleteProduct(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id || String(formData.get("confirm") ?? "") !== "yes") return;

  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("products").delete().eq("id", id);
  if (error) console.error("deleteProduct failed", error);

  revalidatePath("/");
  revalidatePath("/shop");
  revalidatePath("/admin/products");
  revalidatePath("/admin/inventory");
  redirect("/admin/products?deleted=1");
}

export async function toggleProductFlag(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const field = String(formData.get("field") ?? "");
  const value = String(formData.get("value") ?? "") === "true";

  if (!id || !["is_published", "is_featured", "is_new_arrival"].includes(field)) return;

  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("products")
    .update({ [field]: value })
    .eq("id", id);

  if (error) console.error("toggleProductFlag failed", error);

  revalidatePath("/");
  revalidatePath("/shop");
  revalidatePath("/admin/products");
  revalidatePath("/admin");
}

export async function updateInventory(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  let sizes: string[] = [];
  try {
    const parsed = JSON.parse(String(formData.get("sizes") ?? "[]"));
    if (Array.isArray(parsed)) sizes = parsed.filter((size): size is string => typeof size === "string");
  } catch {
    return;
  }

  const sizeStock: Record<string, number> = {};
  for (const size of sizes) {
    const value = Number(formData.get(`stock_${size}`) ?? 0);
    sizeStock[size] = Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
  }

  const total = Object.values(sizeStock).reduce((sum, value) => sum + value, 0);
  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("products")
    .update({ size_stock: sizeStock, stock: total })
    .eq("id", id);

  if (error) console.error("updateInventory failed", error);

  revalidatePath("/shop");
  revalidatePath("/admin/inventory");
  revalidatePath("/admin/products");
}
