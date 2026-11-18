import type { Metadata } from "next";
import Link from "next/link";
import { adminOrders } from "@/lib/admin-data";
import {
  formatDate,
  formatINR,
  orderStatusLabels,
  orderStatusOptions,
  statusTone,
} from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Orders & Fulfilment",
  robots: { index: false },
};

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const { status, q } = await searchParams;
  const orders = await adminOrders({ status, search: q });

  const tabs = [
    { key: "all", label: "All orders" },
    ...orderStatusOptions.map((option) => ({ key: option, label: orderStatusLabels[option] })),
  ];

  return (
    <div className="flex flex-col gap-space-md">
      <div className="flex flex-col justify-between gap-3 border-b border-outline-variant/70 pb-space-sm sm:flex-row sm:items-end">
        <div>
          <span className="font-label-sm text-[9px] uppercase tracking-widest text-outline">
            Fulfilment control · {orders.length} records
          </span>
          <h1 className="mt-1 font-display text-headline-lg">Orders & fulfilment</h1>
        </div>
        <form action="/admin/orders" className="flex items-center border border-outline-variant bg-surface-container-lowest px-2.5">
          <span className="material-symbols-outlined text-[16px] text-outline">search</span>
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Order number, patron, email"
            className="w-56 bg-transparent px-2 py-2 font-body-sm text-[12px] outline-none"
          />
          {status && status !== "all" && <input type="hidden" name="status" value={status} />}
        </form>
      </div>

      <div className="no-scrollbar flex gap-1.5 overflow-x-auto pb-1">
        {tabs.map((tab) => {
          const params = new URLSearchParams();
          if (tab.key !== "all") params.set("status", tab.key);
          if (q) params.set("q", q);
          const href = params.toString() ? `/admin/orders?${params}` : "/admin/orders";
          const active = (status ?? "all") === tab.key;
          return (
            <Link
              key={tab.key}
              href={href}
              className={`whitespace-nowrap border px-3 py-1.5 font-label-sm text-[9px] uppercase tracking-wider ${
                active ? "border-primary bg-primary text-on-primary" : "border-outline-variant text-on-surface-variant hover:border-primary"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      <section className="border border-outline-variant/60 bg-surface-container-lowest">
        {orders.length === 0 ? (
          <div className="p-space-xl text-center">
            <span className="material-symbols-outlined text-[28px] text-secondary">receipt_long</span>
            <h2 className="mt-2 font-headline-sm text-headline-sm">No orders in this view</h2>
            <p className="mx-auto mt-1 max-w-md font-body-sm text-[12px] text-on-surface-variant">
              Storefront orders appear here the moment a customer checks out, with payment details and the
              garment snapshot.
            </p>
            <Link href="/shop" className="btn-secondary mt-space-md" target="_blank">
              Open storefront
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] border-collapse">
              <thead>
                <tr className="border-b border-outline-variant/60 text-left">
                  {["Order", "Patron", "Items", "Amount", "Payment", "Status", "Placed", ""].map((heading) => (
                    <th key={heading} className="px-space-sm py-2.5 font-label-sm text-[8px] uppercase tracking-widest text-outline">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const units = (order.order_items ?? []).reduce((sum, item) => sum + item.quantity, 0);
                  return (
                    <tr key={order.id} className="border-b border-outline-variant/40 last:border-0 hover:bg-surface-container-low">
                      <td className="px-space-sm py-2.5 font-label-sm text-[10px] uppercase tracking-wider">
                        {order.order_number}
                      </td>
                      <td className="px-space-sm py-2.5 font-body-sm text-[12px]">
                        {order.customer_name}
                        <span className="mt-0.5 block text-[10px] text-outline">{order.email}</span>
                      </td>
                      <td className="px-space-sm py-2.5 font-body-sm text-[12px] tabular-nums">{units}</td>
                      <td className="px-space-sm py-2.5 font-body-sm text-[12px] font-semibold tabular-nums">
                        {formatINR(order.total)}
                      </td>
                      <td className="px-space-sm py-2.5">
                        <span className={`inline-block rounded-full border px-2 py-0.5 font-label-sm text-[8px] uppercase tracking-wider ${statusTone(order.payment_status)}`}>
                          {order.payment_status}
                        </span>
                        <span className="mt-0.5 block font-label-sm text-[8px] uppercase tracking-wider text-outline">
                          {order.payment_method === "razorpay" ? "Razorpay" : "On delivery"}
                        </span>
                      </td>
                      <td className="px-space-sm py-2.5">
                        <span className={`inline-block rounded-full border px-2 py-0.5 font-label-sm text-[8px] uppercase tracking-wider ${statusTone(order.status)}`}>
                          {orderStatusLabels[order.status]}
                        </span>
                      </td>
                      <td className="px-space-sm py-2.5 font-body-sm text-[11px] text-on-surface-variant">
                        {formatDate(order.created_at)}
                      </td>
                      <td className="px-space-sm py-2.5 text-right">
                        <Link href={`/admin/orders/${order.id}`} className="material-symbols-outlined text-[17px] text-outline hover:text-secondary" aria-label="Open order">
                          visibility
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
