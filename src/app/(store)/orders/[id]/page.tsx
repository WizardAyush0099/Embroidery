import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RetryPaymentButton } from "@/components/site/RetryPaymentButton";
import { getSessionUser } from "@/lib/auth";
import { getStoreSettings } from "@/lib/catalog";
import { isRazorpayConfigured } from "@/lib/config";
import {
  formatDate,
  formatINR,
  orderStatusLabels,
  paymentStatusLabels,
  statusTone,
} from "@/lib/format";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Order } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your Commission",
  robots: { index: false },
};

const timeline: Array<{ key: Order["status"]; label: string; note: string }> = [
  { key: "pending", label: "Order received", note: "Your brief is logged with the atelier." },
  { key: "confirmed", label: "Confirmed", note: "Payment or address verified by the concierge." },
  { key: "in_production", label: "In the atelier", note: "Threads are pulled, hooped and stitched." },
  { key: "shipped", label: "Dispatched", note: "Wrapped and handed to white-glove courier." },
  { key: "delivered", label: "Delivered", note: "Signed into your collection." },
];

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ email?: string; payment?: string }>;
}) {
  const { id } = await params;
  const { email: emailParam, payment } = await searchParams;

  let order: Order | null = null;
  try {
    const admin = createSupabaseAdminClient();
    // A freshly placed order can be queried a heartbeat before the row is
    // visible to this request, so give it a couple of quick retries rather
    // than showing a 404 right after a customer has paid.
    for (let attempt = 0; attempt < 3 && !order; attempt += 1) {
      const { data, error } = await admin
        .from("orders")
        .select("*, order_items(*)")
        .eq("id", id)
        .maybeSingle();

      if (error) console.error("order lookup failed", error);
      if (data) order = data as Order;
      else if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 250));
    }
  } catch (lookupError) {
    console.error("order lookup failed", lookupError);
  }

  if (!order) notFound();
  const user = await getSessionUser();
  const authorised =
    (user && order.user_id && user.id === order.user_id) ||
    (emailParam && order.email.toLowerCase() === emailParam.toLowerCase());

  if (!authorised) notFound();

  const settings = await getStoreSettings();
  const address = order.shipping_address ?? {};
  const currentIndex = timeline.findIndex((step) => step.key === order.status);

  return (
    <div className="mx-auto w-full max-w-[1440px] px-margin-mobile py-space-xl md:px-margin-tablet lg:px-margin">
      <div className="mb-space-lg flex flex-col justify-between gap-4 border-b border-outline-variant/70 pb-space-md md:flex-row md:items-end">
        <div>
          <span className="eyebrow">Commission confirmed</span>
          <h1 className="mt-1 font-display text-display-sm-mobile text-on-surface md:text-display-sm">
            Thank you, {order.customer_name.split(" ")[0]}.
          </h1>
          <p className="mt-2 font-body-md text-body-md text-on-surface-variant">
            Order <span className="font-semibold text-on-surface">{order.order_number}</span> · Placed{" "}
            {formatDate(order.created_at, true)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full border px-3 py-1 font-label-sm text-[9px] uppercase tracking-widest ${statusTone(order.payment_status)}`}>
            {paymentStatusLabels[order.payment_status]}
          </span>
          <span className={`rounded-full border px-3 py-1 font-label-sm text-[9px] uppercase tracking-widest ${statusTone(order.status)}`}>
            {orderStatusLabels[order.status]}
          </span>
        </div>
      </div>

      {payment === "success" && (
        <div className="mb-space-md flex items-start gap-2 border border-[#c5d8bf] bg-[#e7efe4] px-3 py-2.5 font-body-sm text-body-sm text-[#3d5a38]">
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          Payment received and verified. The atelier has been notified.
        </div>
      )}
      {payment === "cancelled" && (
        <div className="mb-space-md border border-[#ddcfae] bg-[#f3ecdd] px-3 py-2.5 font-body-sm text-body-sm text-[#7a5a1e]">
          Your order is saved but payment was not completed. Use the payment button below whenever you are ready.
        </div>
      )}
      {payment === "verify-failed" && (
        <div className="mb-space-md border border-[#e5bdb8] bg-[#f7e3e1] px-3 py-2.5 font-body-sm text-body-sm text-[#8f1f1f]">
          The payment signature could not be verified automatically. Please contact the concierge with your payment reference
          and we will reconcile it manually.
        </div>
      )}
      {payment === "unavailable" && (
        <div className="mb-space-md border border-[#ddcfae] bg-[#f3ecdd] px-3 py-2.5 font-body-sm text-body-sm text-[#7a5a1e]">
          The payment window could not load on this connection. Your order is saved — you can retry payment below.
        </div>
      )}
      {order.status === "cancelled" && (
        <div className="mb-space-md border border-[#e5bdb8] bg-[#f7e3e1] px-3 py-2.5 font-body-sm text-body-sm text-[#8f1f1f]">
          This order has been cancelled. Speak to the concierge if this is unexpected.
        </div>
      )}

      <div className="grid grid-cols-1 gap-gutter lg:grid-cols-12">
        <div className="flex flex-col gap-space-lg lg:col-span-7">
          <section className="border border-outline-variant/70 bg-surface-container-lowest p-space-lg">
            <h2 className="mb-space-md font-headline-md text-headline-md">Atelier progress</h2>
            {order.status === "cancelled" ? (
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Production was stopped. A refund or exchange is arranged by the concierge.
              </p>
            ) : (
              <ol className="relative border-l border-outline-variant/70 pl-5">
                {timeline.map((step, index) => {
                  const done = index <= currentIndex;
                  return (
                    <li key={step.key} className="relative pb-space-md last:pb-0">
                      <span
                        className={`absolute -left-[27px] top-1 flex h-3 w-3 items-center justify-center rounded-full border ${
                          done ? "border-secondary bg-secondary" : "border-outline-variant bg-surface"
                        }`}
                      />
                      <p className={`font-label-md text-label-md uppercase tracking-wider ${done ? "text-on-surface" : "text-outline"}`}>
                        {step.label}
                      </p>
                      <p className="font-body-sm text-[12px] text-on-surface-variant">{step.note}</p>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>

          <section className="border border-outline-variant/70 bg-surface-container-lowest p-space-lg">
            <h2 className="mb-space-md font-headline-md text-headline-md">Garments</h2>
            <div className="divide-y divide-outline-variant/60">
              {(order.order_items ?? []).map((item) => (
                <div key={item.id} className="flex gap-3 py-space-sm first:pt-0">
                  <div className="relative h-20 w-16 shrink-0 overflow-hidden bg-surface-container">
                    {item.image ? (
                      <Image src={item.image} alt={item.name} fill sizes="64px" className="object-cover" />
                    ) : null}
                  </div>
                  <div className="flex flex-1 items-start justify-between gap-3">
                    <div>
                      <p className="font-body-md text-body-md font-semibold">{item.name}</p>
                      <p className="font-label-sm text-[9px] uppercase tracking-wider text-outline">
                        {item.size ?? "One size"}
                        {item.color ? ` · ${item.color}` : ""} · Qty {item.quantity}
                      </p>
                      {item.embroidery_text && (
                        <p className="mt-1 font-body-sm text-[12px] text-secondary">
                          Embroidery: “{item.embroidery_text}”
                          {item.placement ? ` · ${item.placement}` : ""}
                        </p>
                      )}
                    </div>
                    <span className="whitespace-nowrap font-body-sm text-body-sm font-semibold tabular-nums">
                      {formatINR(item.line_total)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="grid grid-cols-1 gap-gutter sm:grid-cols-2">
            <div className="border border-outline-variant/70 bg-surface-container-lowest p-space-md">
              <h3 className="mb-2 font-label-md text-label-md uppercase tracking-wider text-outline">Shipping address</h3>
              <p className="font-body-sm text-body-sm leading-relaxed text-on-surface">
                {order.customer_name}
                <br />
                {address.line1}
                {address.line2 ? (
                  <>
                    <br />
                    {address.line2}
                  </>
                ) : null}
                <br />
                {address.city}, {address.state} {address.postal_code}
                <br />
                {address.country ?? "India"}
              </p>
            </div>
            <div className="border border-outline-variant/70 bg-surface-container-lowest p-space-md">
              <h3 className="mb-2 font-label-md text-label-md uppercase tracking-wider text-outline">Contact</h3>
              <p className="font-body-sm text-body-sm leading-relaxed text-on-surface">
                {order.email}
                <br />
                {order.phone}
              </p>
              <p className="mt-3 font-body-sm text-[12px] text-on-surface-variant">
                Proof preference:{" "}
                {order.proof_preference === "digital" ? "Digital approval required" : "Trust master embroiderers"}
              </p>
            </div>
          </section>
        </div>

        <aside className="lg:col-span-5">
          <div className="sticky top-32 border border-outline-variant/70 bg-surface-container-lowest p-space-lg shadow-tactile">
            <h2 className="font-headline-md text-headline-md">Payment summary</h2>
            <div className="mt-space-md space-y-2 border-b border-outline-variant/70 pb-space-md font-body-sm text-body-sm">
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Subtotal</span>
                <span className="font-semibold tabular-nums">{formatINR(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Delivery</span>
                <span className="font-semibold tabular-nums">
                  {Number(order.shipping_fee) === 0 ? "Complimentary" : formatINR(order.shipping_fee)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Method</span>
                <span className="font-semibold uppercase">
                  {order.payment_method === "razorpay" ? "Razorpay" : "Pay on delivery"}
                </span>
              </div>
            </div>
            <div className="flex items-baseline justify-between py-space-md">
              <span className="font-headline-sm text-headline-sm">Total</span>
              <span className="font-display text-headline-md font-semibold tabular-nums">{formatINR(order.total)}</span>
            </div>

            {order.payment_status !== "paid" && isRazorpayConfigured && (
              <RetryPaymentButton orderId={order.id} email={order.email} amountLabel={formatINR(order.total)} />
            )}

            {order.payment_status !== "paid" && !isRazorpayConfigured && order.payment_method === "cod" && (
              <p className="rounded border border-outline-variant/70 bg-surface-container-low p-3 font-body-sm text-[12px] text-on-surface-variant">
                Pay on delivery. The concierge will confirm your address before dispatch.
              </p>
            )}

            <div className="mt-space-md space-y-2 border-t border-outline-variant/70 pt-space-md font-body-sm text-[12px] text-on-surface-variant">
              <p className="flex items-start gap-2">
                <span className="material-symbols-outlined text-[16px] text-secondary">mail</span>
                A confirmation is sent to {order.email}.
              </p>
              <p className="flex items-start gap-2">
                <span className="material-symbols-outlined text-[16px] text-secondary">support_agent</span>
                Questions? {settings.contact_email} · {settings.contact_phone}
              </p>
            </div>

            <div className="mt-space-md flex flex-col gap-2">
              <Link href="/track" className="btn-secondary w-full">
                Track another order
              </Link>
              <Link href="/shop" className="btn-primary w-full">
                Continue shopping
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
