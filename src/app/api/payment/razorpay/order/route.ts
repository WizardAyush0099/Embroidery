import { NextResponse } from "next/server";
import { defaultSettings } from "@/lib/catalog";
import { isRazorpayConfigured, razorpayKeyId } from "@/lib/config";
import { createRazorpayOrder } from "@/lib/razorpay";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  if (!isRazorpayConfigured) {
    return NextResponse.json({ ok: false, error: "Razorpay is not configured" }, { status: 503 });
  }

  let orderId: string | undefined;
  try {
    const body = (await request.json()) as { orderId?: string };
    orderId = body.orderId;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid payload" }, { status: 400 });
  }

  if (!orderId) {
    return NextResponse.json({ ok: false, error: "Missing order id" }, { status: 400 });
  }

  try {
    const admin = createSupabaseAdminClient();
    const { data: order, error } = await admin
      .from("orders")
      .select("id, order_number, total, payment_status, email, phone, customer_name")
      .eq("id", orderId)
      .maybeSingle();

    if (error || !order) {
      return NextResponse.json({ ok: false, error: "Order not found" }, { status: 404 });
    }

    if (order.payment_status === "paid") {
      return NextResponse.json({ ok: false, error: "This order is already paid" }, { status: 409 });
    }

    const { data: settings } = await admin
      .from("store_settings")
      .select("brand_name")
      .eq("id", 1)
      .maybeSingle();

    const amountInPaise = Math.round(Number(order.total) * 100);
    const razorpayOrder = await createRazorpayOrder({
      amountInPaise,
      receipt: order.order_number,
      notes: { order_id: order.id, order_number: order.order_number },
    });

    await admin
      .from("orders")
      .update({ razorpay_order_id: razorpayOrder.id, payment_method: "razorpay" })
      .eq("id", order.id);

    return NextResponse.json({
      ok: true,
      keyId: razorpayKeyId,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      brandName: settings?.brand_name ?? defaultSettings.brand_name,
      prefill: {
        name: order.customer_name,
        email: order.email,
        contact: order.phone,
      },
    });
  } catch (error) {
    console.error("razorpay order creation failed", error);
    return NextResponse.json({ ok: false, error: "Could not start payment" }, { status: 500 });
  }
}
