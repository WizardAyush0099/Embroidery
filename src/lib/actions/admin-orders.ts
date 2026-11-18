"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { orderStatusOptions } from "@/lib/format";
import type { OrderStatus, PaymentStatus } from "@/lib/types";

export type AdminFormState = {
  status: "idle" | "success" | "error";
  message?: string;
};

const paymentStatuses: PaymentStatus[] = ["pending", "paid", "failed", "refunded"];

export async function updateOrder(
  _prevState: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as OrderStatus;
  const paymentStatus = String(formData.get("payment_status") ?? "") as PaymentStatus;
  const adminNotes = String(formData.get("admin_notes") ?? "").trim();

  if (!id) return { status: "error", message: "Missing order." };
  if (!orderStatusOptions.includes(status)) return { status: "error", message: "Choose a valid order status." };
  if (!paymentStatuses.includes(paymentStatus)) {
    return { status: "error", message: "Choose a valid payment status." };
  }

  try {
    const admin = createSupabaseAdminClient();
    const { error } = await admin
      .from("orders")
      .update({ status, payment_status: paymentStatus, admin_notes: adminNotes || null })
      .eq("id", id);

    if (error) throw error;
  } catch (error) {
    console.error("updateOrder failed", error);
    return { status: "error", message: "The order could not be updated." };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);

  return { status: "success", message: "Order updated and the customer timeline refreshed." };
}
