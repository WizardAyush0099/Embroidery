"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { loadRazorpayScript, openRazorpay } from "@/lib/razorpay-client";

export function RetryPaymentButton({
  orderId,
  email,
  amountLabel,
}: {
  orderId: string;
  email: string;
  amountLabel: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePay() {
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/payment/razorpay/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const data = (await response.json()) as {
        ok: boolean;
        error?: string;
        keyId?: string;
        razorpayOrderId?: string;
        amount?: number;
        currency?: string;
        brandName?: string;
        prefill?: { name: string; email: string; contact: string };
      };

      if (!response.ok || !data.ok || !data.razorpayOrderId) {
        setError(data.error ?? "Payment could not be started.");
        return;
      }

      const loaded = await loadRazorpayScript();
      if (!loaded) {
        setError("The Razorpay checkout could not load. Check your connection and try again.");
        return;
      }

      const outcome = await openRazorpay({
        keyId: data.keyId ?? "",
        razorpayOrderId: data.razorpayOrderId,
        amount: data.amount ?? 0,
        currency: data.currency ?? "INR",
        name: data.brandName ?? "Atelier Brodé",
        description: `Balance for order ${orderId.slice(0, 8)}`,
        prefill: data.prefill ?? { name: "", email, contact: "" },
      });

      if (outcome.status !== "paid") {
        setError("Payment was not completed. You can retry whenever you are ready.");
        return;
      }

      const verify = await fetch("/api/payment/razorpay/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          razorpay_order_id: outcome.response.razorpay_order_id,
          razorpay_payment_id: outcome.response.razorpay_payment_id,
          razorpay_signature: outcome.response.razorpay_signature,
        }),
      });

      if (!verify.ok) {
        setError("Payment was received but verification failed. Please contact the concierge.");
        return;
      }

      router.push(`/orders/${orderId}?email=${encodeURIComponent(email)}&payment=success`);
      router.refresh();
    } catch (paymentError) {
      console.error(paymentError);
      setError("Payment could not be completed. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <button type="button" onClick={handlePay} disabled={pending} className="btn-primary w-full sm:w-auto">
        {pending ? "Opening secure payment…" : `Pay ${amountLabel} securely`}
      </button>
      {error && <p className="mt-2 font-body-sm text-[12px] text-error">{error}</p>}
    </div>
  );
}
