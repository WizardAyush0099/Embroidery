"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type SettingsFormState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export async function updateSettings(
  _prevState: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  await requireAdmin();

  const brandName = String(formData.get("brand_name") ?? "").trim();
  const contactEmail = String(formData.get("contact_email") ?? "").trim();
  const contactPhone = String(formData.get("contact_phone") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const instagram = String(formData.get("instagram") ?? "").trim();
  const announcement = String(formData.get("announcement") ?? "").trim();
  const shippingFee = Number(formData.get("shipping_fee") ?? 0);
  const freeThreshold = Number(formData.get("free_shipping_threshold") ?? 0);

  if (!brandName) return { status: "error", message: "Brand name is required." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
    return { status: "error", message: "Enter a valid contact email." };
  }
  if (!Number.isFinite(shippingFee) || shippingFee < 0) {
    return { status: "error", message: "Shipping fee must be a positive amount." };
  }
  if (!Number.isFinite(freeThreshold) || freeThreshold < 0) {
    return { status: "error", message: "Free shipping threshold must be a positive amount." };
  }

  try {
    const admin = createSupabaseAdminClient();
    const { error } = await admin
      .from("store_settings")
      .update({
        brand_name: brandName,
        contact_email: contactEmail,
        contact_phone: contactPhone,
        address,
        instagram: instagram || null,
        announcement: announcement || null,
        shipping_fee: shippingFee,
        free_shipping_threshold: freeThreshold,
        cod_enabled: formData.get("cod_enabled") === "on",
      })
      .eq("id", 1);

    if (error) throw error;
  } catch (error) {
    console.error("updateSettings failed", error);
    return { status: "error", message: "Settings could not be saved." };
  }

  revalidatePath("/", "layout");
  revalidatePath("/admin/settings");
  return { status: "success", message: "Store settings saved." };
}
