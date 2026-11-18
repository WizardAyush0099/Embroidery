"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { requestStatusOptions } from "@/lib/format";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { AdminFormState } from "@/lib/actions/admin-orders";
import type { CustomRequestStatus } from "@/lib/types";

export async function updateCustomRequest(
  _prevState: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as CustomRequestStatus;
  const quoteRaw = String(formData.get("quote_amount") ?? "").trim();
  const adminNotes = String(formData.get("admin_notes") ?? "").trim();
  const quoteAmount = quoteRaw === "" ? null : Number(quoteRaw);

  if (!id) return { status: "error", message: "Missing request." };
  if (!requestStatusOptions.includes(status)) {
    return { status: "error", message: "Choose a valid request status." };
  }
  if (quoteAmount != null && (!Number.isFinite(quoteAmount) || quoteAmount < 0)) {
    return { status: "error", message: "Enter a valid quotation amount." };
  }

  try {
    const admin = createSupabaseAdminClient();
    const { error } = await admin
      .from("custom_requests")
      .update({
        status,
        quote_amount: quoteAmount,
        admin_notes: adminNotes || null,
      })
      .eq("id", id);

    if (error) throw error;
  } catch (error) {
    console.error("updateCustomRequest failed", error);
    return { status: "error", message: "The request could not be updated." };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/requests");
  revalidatePath(`/admin/requests/${id}`);

  return { status: "success", message: "Request updated. The patron sees the new status in their account." };
}
