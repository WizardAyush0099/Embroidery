import { NextResponse } from "next/server";
import { verifyRazorpaySignature } from "@/lib/razorpay";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  let body: Record<string, string> | null = null;
  try {
    body = (await request.json()) as Record<string, string>;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid payload" }, { status: 400 });
  }

  const orderId = body?.orderId;
  const razorpayOrderId = body?.razorpay_order_id;
  const razorpayPaymentId = body?.razorpay_payment_id;
  const signature = body?.razorpay_signature;

  if (!orderId || !razorpayOrderId || !razorpayPaymentId || !signature) {
    return NextResponse.json({ ok: false, error: "Missing payment fields" }, { status: 400 });
  }

  const valid = verifyRazorpaySignature({
    razorpayOrderId,
    razorpayPaymentId,
    signature,
  });

  if (!valid) {
    return NextResponse.json({ ok: false, error: "Signature verification failed" }, { status: 400 });
  }

  try {
    const admin = createSupabaseAdminClient();
    const { data: order, error: fetchError } = await admin
      .from("orders")
      .select("id, status, razorpay_order_id, payment_status")
      .eq("id", orderId)
      .maybeSingle();

    if (fetchError || !order) {
      return NextResponse.json({ ok: false, error: "Order not found" }, { status: 404 });
    }

    if (order.razorpay_order_id && order.razorpay_order_id !== razorpayOrderId) {
      return NextResponse.json({ ok: false, error: "Payment does not belong to this order" }, { status: 400 });
    }

    const { error: updateError } = await admin
      .from("orders")
      .update({
        payment_status: "paid",
        razorpay_payment_id: razorpayPaymentId,
        razorpay_order_id: razorpayOrderId,
        status: order.status === "pending" ? "confirmed" : order.status,
      })
      .eq("id", orderId);

    if (updateError) throw updateError;

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("razorpay verify failed", error);
    return NextResponse.json({ ok: false, error: "Could not record payment" }, { status: 500 });
  }
}
