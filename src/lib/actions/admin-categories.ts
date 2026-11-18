"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { slugify } from "@/lib/utils";

export type CategoryFormState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export async function saveCategory(
  _prevState: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const sortOrder = Number(formData.get("sort_order") ?? 0);
  const desiredSlug = slugify(String(formData.get("slug") ?? "") || name);

  if (name.length < 2) return { status: "error", message: "Category name is too short." };

  try {
    const admin = createSupabaseAdminClient();
    let slug = desiredSlug || `collection-${Date.now()}`;

    const { data: clash } = await admin.from("categories").select("id").eq("slug", slug).maybeSingle();
    if (clash && clash.id !== id) slug = `${slug}-${Math.random().toString(36).slice(2, 5)}`;

    const payload = {
      name,
      slug,
      description: description || null,
      sort_order: Number.isFinite(sortOrder) ? Math.floor(sortOrder) : 0,
    };

    const { error } = id
      ? await admin.from("categories").update(payload).eq("id", id)
      : await admin.from("categories").insert(payload);

    if (error) throw error;
  } catch (error) {
    console.error("saveCategory failed", error);
    return { status: "error", message: "The category could not be saved." };
  }

  revalidatePath("/shop");
  revalidatePath("/admin/categories");
  return { status: "success", message: "Category saved." };
}

export async function deleteCategory(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id || String(formData.get("confirm") ?? "") !== "yes") return;

  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("categories").delete().eq("id", id);
  if (error) console.error("deleteCategory failed", error);

  revalidatePath("/shop");
  revalidatePath("/admin/categories");
  redirect("/admin/categories?deleted=1");
}
