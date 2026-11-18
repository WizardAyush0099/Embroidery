"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth";
import { defaultSettings } from "@/lib/catalog";
import { isRazorpayConfigured, razorpayKeyId } from "@/lib/config";
import { createRazorpayOrder } from "@/lib/razorpay";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { ShippingAddress } from "@/lib/types";

export type CheckoutInput = {
  name: string;
  email: string;
  phone: string;
  address: ShippingAddress;
  items: Array<{
    productId: string;
    size: string;
    color: string;
    quantity: number;
    embroideryText?: string;
    placement?: string;
  }>;
  paymentMethod: "cod" | "razorpay";
  proofPreference: "digital" | "trust_artisan";
  notes?: string;
};

export type CheckoutResult =
  | {
      ok: true;
      orderId: string;
      orderNumber: string;
      total: number;
      razorpay?: {
        keyId: string;
        razorpayOrderId: string;
        amount: number;
        currency: string;
        brandName: string;
        email: string;
        phone: string;
        name: string;
      };
    }
  | { ok: false; error: string };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[0-9+\-\s()]{7,18}$/;

function friendlyError(message: string) {
  if (message.startsWith("INSUFFICIENT_STOCK")) {
    const [, product = "this garment", size = ""] = message.split(":");
    return `${product} is sold out${size ? ` in size ${size}` : ""}. Please adjust your bag.`;
  }
  if (message.startsWith("PRODUCT_UNAVAILABLE")) {
    return "One of the garments in your bag is no longer available.";
  }
  if (message === "EMPTY_CART") return "Your bag is empty.";
  return "We could not place your order. Please review your details and try again.";
}

export async function placeOrder(input: CheckoutInput): Promise<CheckoutResult> {
  // The order is only ever placed for the signed-in patron; the form's email
  // field is never trusted as the buyer's identity.
  const session = await getSessionUser();
  if (!session?.email) {
    return { ok: false, error: "Please sign in to place your order." };
  }

  const name = input.name?.trim();
  const email = session.email;
  const phone = input.phone?.trim();

  if (!name || name.length < 2) return { ok: false, error: "Please enter your full name." };
  if (!email || !EMAIL_PATTERN.test(email)) return { ok: false, error: "Please enter a valid email address." };
  if (!phone || !PHONE_PATTERN.test(phone)) return { ok: false, error: "Please enter a valid phone number." };

  const address = input.address ?? {};
  if (!address.line1?.trim() || !address.city?.trim() || !address.state?.trim() || !address.postal_code?.trim()) {
    return { ok: false, error: "Please complete your shipping address." };
  }

  if (!Array.isArray(input.items) || input.items.length === 0) {
    return { ok: false, error: "Your bag is empty." };
  }

  const items = input.items.map((item) => ({
    product_id: item.productId,
    size: item.size ?? "",
    color: item.color ?? "",
    quantity: Math.max(1, Math.min(10, Number(item.quantity) || 1)),
    embroidery_text: item.embroideryText ?? null,
    placement: item.placement ?? null,
  }));

  const paymentMethod = input.paymentMethod === "razorpay" ? "razorpay" : "cod";
  if (paymentMethod === "razorpay" && !isRazorpayConfigured) {
    return { ok: false, error: "Online payment is not available yet. Please choose pay on delivery." };
  }

  try {
    const admin = createSupabaseAdminClient();

    const { data, error } = await admin.rpc("place_order", {
      p_customer: {
        name,
        email,
        phone,
        address: {
          line1: address.line1?.trim() ?? "",
          line2: address.line2?.trim() ?? "",
          city: address.city?.trim() ?? "",
          state: address.state?.trim() ?? "",
          postal_code: address.postal_code?.trim() ?? "",
          country: address.country?.trim() || "India",
        },
      },
      p_items: items,
      p_payment_method: paymentMethod,
      // Orders are linked to a patron by verified email; the session identity
      // now comes from Clerk rather than a Supabase auth id.
      p_user_id: null,
      p_notes: input.notes?.trim() || null,
      p_proof_preference: input.proofPreference === "trust_artisan" ? "trust_artisan" : "digital",
    });

    if (error) {
      console.error("place_order failed", error);
      return { ok: false, error: friendlyError(error.message) };
    }

    const result = data as { order_id: string; order_number: string; total: number };
    if (!result?.order_id) {
      return { ok: false, error: "We could not place your order. Please try again." };
    }

    let razorpay: Extract<CheckoutResult, { ok: true }>["razorpay"];

    if (paymentMethod === "razorpay") {
      const { data: settings } = await admin
        .from("store_settings")
        .select("brand_name")
        .eq("id", 1)
        .maybeSingle();

      const amountInPaise = Math.round(Number(result.total) * 100);
      const razorpayOrder = await createRazorpayOrder({
        amountInPaise,
        receipt: result.order_number,
        notes: { order_id: result.order_id, order_number: result.order_number },
      });

      await admin
        .from("orders")
        .update({ razorpay_order_id: razorpayOrder.id })
        .eq("id", result.order_id);

      razorpay = {
        keyId: razorpayKeyId,
        razorpayOrderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        brandName: settings?.brand_name ?? defaultSettings.brand_name,
        email,
        phone,
        name,
      };
    }

    revalidatePath("/admin");
    revalidatePath("/admin/orders");

    return {
      ok: true,
      orderId: result.order_id,
      orderNumber: result.order_number,
      total: Number(result.total),
      razorpay,
    };
  } catch (error) {
    console.error("placeOrder failed", error);
    return {
      ok: false,
      error:
        error instanceof Error && error.message.includes("credentials")
          ? "The store is not connected to its database yet."
          : "We could not place your order. Please try again.",
    };
  }
}
