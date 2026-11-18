import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { OrderStatusForm } from "@/components/admin/OrderStatusForm";
import { adminOrder } from "@/lib/admin-data";
import {
  formatDate,
  formatINR,
  orderStatusLabels,
  paymentStatusLabels,
  statusTone,
} from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Order Detail",
  robots: { index: false },
};

export default async function AdminOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await adminOrder(id);
  if (!order) notFound();

  const address = order.shipping_address ?? {};
  const units = (order.order_items ?? []).reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="flex flex-col gap-space-md">
      <div className="flex flex-col justify-between gap-2 border-b border-outline-variant/70 pb-space-sm sm:flex-row sm:items-end">
        <div>
          <nav className="flex items-center gap-2 font-label-sm text-[8px] uppercase tracking-widest text-outline">
            <Link href="/admin/orders" className="hover:text-on-surface">
              Orders
            </Link>
            <span>/</span>
            <span className="text-secondary">{order.order_number}</span>
          </nav>
          <h1 className="mt-1 font-display text-headline-lg">{order.customer_name}</h1>
          <p className="mt-1 font-body-sm text-[12px] text-on-surface-variant">
            {formatDate(order.created_at, true)} · {units} garment{units === 1 ? "" : "s"} ·{" "}
            {order.payment_method === "razorpay" ? "Razorpay" : "Pay on delivery"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className={`rounded-full border px-2.5 py-1 font-label-sm text-[8px] uppercase tracking-widest ${statusTone(order.status)}`}>
            {orderStatusLabels[order.status]}
          </span>
          <span className={`rounded-full border px-2.5 py-1 font-label-sm text-[8px] uppercase tracking-widest ${statusTone(order.payment_status)}`}>
            {paymentStatusLabels[order.payment_status]}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-space-md xl:grid-cols-12">
        <div className="flex flex-col gap-space-md xl:col-span-8">
          <section className="border border-outline-variant/60 bg-surface-container-lowest">
            <div className="border-b border-outline-variant/60 px-space-md py-3">
              <h2 className="font-headline-sm text-headline-sm">Garments in this order</h2>
            </div>
            <div className="divide-y divide-outline-variant/50">
              {(order.order_items ?? []).map((item) => (
                <div key={item.id} className="flex items-center gap-3 px-space-md py-space-sm">
                  <div className="relative h-16 w-12 shrink-0 overflow-hidden bg-surface-container">
                    {item.image ? <Image src={item.image} alt={item.name} fill sizes="48px" className="object-cover" /> : null}
                  </div>
                  <div className="flex-1">
                    <p className="font-body-sm text-[12px] font-semibold">{item.name}</p>
                    <p className="font-label-sm text-[8px] uppercase tracking-wider text-outline">
                      {item.size ?? "One size"}
                      {item.color ? ` · ${item.color}` : ""} · Qty {item.quantity}
                    </p>
                    {item.embroidery_text && (
                      <p className="mt-0.5 font-body-sm text-[11px] text-secondary">
                        Embroidery: “{item.embroidery_text}” {item.placement ? `· ${item.placement}` : ""}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-body-sm text-[12px] font-semibold tabular-nums">{formatINR(item.line_total)}</p>
                    <p className="font-label-sm text-[8px] uppercase tracking-wider text-outline">
                      {formatINR(item.unit_price)} each
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-1 border-t border-outline-variant/60 px-space-md py-space-sm font-body-sm text-[12px]">
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Subtotal</span>
                <span className="tabular-nums">{formatINR(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Delivery</span>
                <span className="tabular-nums">
                  {Number(order.shipping_fee) === 0 ? "Complimentary" : formatINR(order.shipping_fee)}
                </span>
              </div>
              <div className="flex justify-between border-t border-outline-variant/60 pt-1 font-semibold">
                <span>Total</span>
                <span className="tabular-nums">{formatINR(order.total)}</span>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-space-md sm:grid-cols-2">
            <div className="border border-outline-variant/60 bg-surface-container-lowest p-space-md">
              <h2 className="mb-2 font-label-md text-[10px] uppercase tracking-wider text-outline">Shipping address</h2>
              <p className="font-body-sm text-[12px] leading-relaxed">
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
            <div className="border border-outline-variant/60 bg-surface-container-lowest p-space-md">
              <h2 className="mb-2 font-label-md text-[10px] uppercase tracking-wider text-outline">Patron contact</h2>
              <p className="font-body-sm text-[12px] leading-relaxed">
                <a href={`mailto:${order.email}`} className="text-secondary underline underline-offset-4">
                  {order.email}
                </a>
                <br />
                {order.phone}
              </p>
              <p className="mt-2 font-body-sm text-[11px] text-on-surface-variant">
                Proof: {order.proof_preference === "digital" ? "Digital approval required" : "Trust master embroiderers"}
              </p>
              {order.notes && (
                <p className="mt-2 border-t border-outline-variant/50 pt-2 font-body-sm text-[11px] text-on-surface-variant">
                  Customer note: {order.notes}
                </p>
              )}
            </div>
          </section>

          <section className="border border-outline-variant/60 bg-surface-container-lowest p-space-md">
            <h2 className="mb-2 font-label-md text-[10px] uppercase tracking-wider text-outline">Payment trace</h2>
            <dl className="grid grid-cols-1 gap-2 font-body-sm text-[11px] sm:grid-cols-2">
              <div>
                <dt className="text-outline">Method</dt>
                <dd className="font-semibold uppercase">{order.payment_method}</dd>
              </div>
              <div>
                <dt className="text-outline">Payment status</dt>
                <dd className="font-semibold uppercase">{order.payment_status}</dd>
              </div>
              <div>
                <dt className="text-outline">Razorpay order</dt>
                <dd className="break-all">{order.razorpay_order_id ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-outline">Razorpay payment</dt>
                <dd className="break-all">{order.razorpay_payment_id ?? "—"}</dd>
              </div>
            </dl>
          </section>
        </div>

        <aside className="xl:col-span-4">
          <section className="border border-outline-variant/60 bg-surface-container-lowest p-space-md">
            <h2 className="mb-space-sm font-headline-sm text-headline-sm">Manage order</h2>
            <OrderStatusForm order={order} />
          </section>
          <div className="mt-space-md flex flex-col gap-2">
            <Link href={`/orders/${order.id}?email=${encodeURIComponent(order.email)}`} target="_blank" className="btn-secondary w-full py-2.5">
              Open customer view
            </Link>
            <a href={`mailto:${order.email}?subject=Your%20Atelier%20Brod%C3%A9%20order%20${order.order_number}`} className="btn-secondary w-full py-2.5">
              Email the patron
            </a>
          </div>
        </aside>
      </div>
    </div>
  );
}
