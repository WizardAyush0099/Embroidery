import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { dashboardData } from "@/lib/admin-data";
import {
  formatDate,
  formatINR,
  orderStatusLabels,
  requestStatusLabels,
  statusTone,
} from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Executive Overview",
  robots: { index: false },
};

export default async function AdminOverviewPage() {
  const data = await dashboardData();
  const maxRevenue = Math.max(...data.monthlyRevenue.map((month) => month.value), 1);

  return (
    <div className="flex flex-col gap-space-md">
      <div className="flex flex-col justify-between gap-2 border-b border-outline-variant/70 pb-space-sm lg:flex-row lg:items-center">
        <div>
          <span className="font-label-sm text-[9px] uppercase tracking-widest text-outline">
            Atelier Mumbai central · shift 01
          </span>
          <h1 className="mt-1 font-display text-headline-lg text-on-surface">Executive overview</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/admin/products/new" className="bg-primary px-3 py-2 font-label-sm text-[9px] uppercase tracking-widest text-on-primary hover:bg-secondary">
            Add product
          </Link>
          <Link href="/admin/requests" className="border border-outline-variant px-3 py-2 font-label-sm text-[9px] uppercase tracking-widest hover:border-primary">
            Request queue
          </Link>
          <Link href="/admin/orders" className="border border-outline-variant px-3 py-2 font-label-sm text-[9px] uppercase tracking-widest hover:border-primary">
            Orders
          </Link>
        </div>
      </div>

      <section className="grid grid-cols-1 gap-space-sm md:grid-cols-2 xl:grid-cols-4">
        <div className="border border-outline-variant/60 bg-surface-container-lowest p-space-md">
          <div className="flex items-start justify-between">
            <span className="font-label-sm text-[9px] uppercase tracking-widest text-outline">
              Gross throughput
            </span>
            <span className="material-symbols-outlined text-[16px] text-secondary">trending_up</span>
          </div>
          <p className="mt-1 font-display text-headline-lg tabular-nums text-on-surface">{formatINR(data.revenue)}</p>
          <p className="mt-1 font-body-sm text-[11px] text-on-surface-variant">
            {formatINR(data.paidRevenue)} settled · {data.orderCount} orders recorded
          </p>
        </div>

        <div className="border border-outline-variant/60 bg-surface-container-lowest p-space-md">
          <div className="flex items-start justify-between">
            <span className="font-label-sm text-[9px] uppercase tracking-widest text-outline">
              Orders in flight
            </span>
            <span className="material-symbols-outlined text-[16px] text-secondary">precision_manufacturing</span>
          </div>
          <p className="mt-1 font-display text-headline-lg tabular-nums text-on-surface">{data.pendingOrders}</p>
          <p className="mt-1 font-body-sm text-[11px] text-on-surface-variant">
            Pending, confirmed or in the atelier
          </p>
        </div>

        <div className="border border-outline-variant/60 bg-surface-container-lowest p-space-md">
          <div className="flex items-start justify-between">
            <span className="font-label-sm text-[9px] uppercase tracking-widest text-outline">
              Bespoke commissions
            </span>
            <span className="material-symbols-outlined text-[16px] text-secondary">stylus_note</span>
          </div>
          <p className="mt-1 font-display text-headline-lg tabular-nums text-on-surface">{data.openRequests}</p>
          <p className="mt-1 font-body-sm text-[11px] text-on-surface-variant">Awaiting proof or quotation</p>
        </div>

        <div className="border border-outline-variant/60 bg-surface-container-lowest p-space-md">
          <div className="flex items-start justify-between">
            <span className="font-label-sm text-[9px] uppercase tracking-widest text-outline">
              Catalogue
            </span>
            <span className="material-symbols-outlined text-[16px] text-secondary">checkroom</span>
          </div>
          <p className="mt-1 font-display text-headline-lg tabular-nums text-on-surface">
            {data.publishedCount}
            <span className="font-body-md text-body-md text-outline"> / {data.productCount}</span>
          </p>
          <p className="mt-1 font-body-sm text-[11px] text-on-surface-variant">
            {data.lowStock.length} pieces at or below 3 units
          </p>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-space-md xl:grid-cols-12">
        <section className="border border-outline-variant/60 bg-surface-container-lowest p-space-md xl:col-span-8">
          <div className="mb-space-sm flex items-center justify-between">
            <h2 className="font-headline-sm text-headline-sm">Revenue rhythm</h2>
            <span className="font-label-sm text-[9px] uppercase tracking-wider text-outline">Last 6 months</span>
          </div>
          <div className="flex h-40 items-end gap-2 border-b border-outline-variant/60 pb-2">
            {data.monthlyRevenue.map((month) => (
              <div key={month.label} className="flex flex-1 flex-col items-center gap-1">
                <span className="font-label-sm text-[8px] tabular-nums text-outline">
                  {month.value > 0 ? formatINR(month.value) : "—"}
                </span>
                <div className="flex w-full flex-1 items-end">
                  <div
                    className="w-full bg-primary transition-all"
                    style={{ height: `${Math.max(4, (month.value / maxRevenue) * 100)}%` }}
                    title={`${month.label}: ${formatINR(month.value)}`}
                  />
                </div>
                <span className="font-label-sm text-[9px] uppercase tracking-wider text-outline">{month.label}</span>
              </div>
            ))}
          </div>

          <div className="mt-space-md">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-label-md text-label-md uppercase tracking-wider">Best selling motifs</h3>
              <span className="font-label-sm text-[9px] uppercase tracking-wider text-outline">Units</span>
            </div>
            {data.topProducts.length > 0 ? (
              <div className="divide-y divide-outline-variant/50">
                {data.topProducts.map((product) => (
                  <div key={product.name} className="flex items-center justify-between py-2">
                    <span className="truncate font-body-sm text-body-sm">{product.name}</span>
                    <span className="flex items-center gap-4 font-body-sm text-[12px] tabular-nums">
                      <span className="text-outline">{formatINR(product.revenue)}</span>
                      <span className="font-semibold">{product.units}</span>
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="font-body-sm text-[12px] text-on-surface-variant">
                No sales recorded yet. Once orders arrive, best sellers appear here automatically.
              </p>
            )}
          </div>
        </section>

        <section className="border border-outline-variant/60 bg-surface-container-lowest p-space-md xl:col-span-4">
          <div className="mb-space-sm flex items-center justify-between">
            <h2 className="font-headline-sm text-headline-sm">Stock alerts</h2>
            <Link href="/admin/inventory" className="font-label-sm text-[9px] uppercase tracking-wider text-secondary underline underline-offset-4">
              Inventory
            </Link>
          </div>
          {data.lowStock.length > 0 ? (
            <div className="flex flex-col gap-2">
              {data.lowStock.map((product) => (
                <Link
                  key={product.id}
                  href={`/admin/products/${product.id}`}
                  className="flex items-center gap-2 border border-outline-variant/60 p-2 transition-colors hover:border-primary"
                >
                  <div className="relative h-12 w-10 shrink-0 overflow-hidden bg-surface-container">
                    {product.images[0] ? (
                      <Image src={product.images[0]} alt="" fill sizes="40px" className="object-cover" />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-body-sm text-[12px] font-semibold">{product.name}</p>
                    <p className="font-label-sm text-[8px] uppercase tracking-wider text-outline">
                      {product.fabric_label ?? "Atelier"}
                    </p>
                  </div>
                  <span className={`rounded px-1.5 py-0.5 font-label-sm text-[9px] font-bold ${product.stock === 0 ? "bg-error-container text-on-error-container" : "bg-[#f3ecdd] text-[#7a5a1e]"}`}>
                    {product.stock}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="font-body-sm text-[12px] text-on-surface-variant">
              Every garment is above the low-stock threshold.
            </p>
          )}
        </section>
      </div>

      <div className="grid grid-cols-1 gap-space-md xl:grid-cols-12">
        <section className="border border-outline-variant/60 bg-surface-container-lowest xl:col-span-8">
          <div className="flex items-center justify-between border-b border-outline-variant/60 px-space-md py-3">
            <h2 className="font-headline-sm text-headline-sm">Recent orders</h2>
            <Link href="/admin/orders" className="font-label-sm text-[9px] uppercase tracking-wider text-secondary underline underline-offset-4">
              All orders
            </Link>
          </div>
          {data.recentOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] border-collapse">
                <thead>
                  <tr className="border-b border-outline-variant/60 text-left">
                    {["Order", "Patron", "Items", "Total", "Status", ""].map((heading) => (
                      <th key={heading} className="px-space-sm py-2 font-label-sm text-[8px] uppercase tracking-widest text-outline">
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.recentOrders.map((order) => (
                    <tr key={order.id} className="border-b border-outline-variant/40 last:border-0 hover:bg-surface-container-low">
                      <td className="px-space-sm py-2.5 font-label-sm text-[10px] uppercase tracking-wider">
                        {order.order_number}
                        <span className="mt-0.5 block text-[8px] text-outline">{formatDate(order.created_at)}</span>
                      </td>
                      <td className="px-space-sm py-2.5 font-body-sm text-[12px]">
                        {order.customer_name}
                        <span className="mt-0.5 block text-[10px] text-outline">{order.email}</span>
                      </td>
                      <td className="px-space-sm py-2.5 font-body-sm text-[12px] tabular-nums">
                        {(order.order_items ?? []).reduce((sum, item) => sum + item.quantity, 0)}
                      </td>
                      <td className="px-space-sm py-2.5 font-body-sm text-[12px] font-semibold tabular-nums">
                        {formatINR(order.total)}
                      </td>
                      <td className="px-space-sm py-2.5">
                        <span className={`inline-block rounded-full border px-2 py-0.5 font-label-sm text-[8px] uppercase tracking-wider ${statusTone(order.status)}`}>
                          {orderStatusLabels[order.status]}
                        </span>
                      </td>
                      <td className="px-space-sm py-2.5 text-right">
                        <Link href={`/admin/orders/${order.id}`} className="material-symbols-outlined text-[17px] text-outline hover:text-secondary">
                          visibility
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-space-lg text-center">
              <p className="font-body-sm text-[12px] text-on-surface-variant">
                No orders yet. Storefront orders will appear here the moment they are placed.
              </p>
            </div>
          )}
        </section>

        <section className="border border-outline-variant/60 bg-surface-container-lowest xl:col-span-4">
          <div className="flex items-center justify-between border-b border-outline-variant/60 px-space-md py-3">
            <h2 className="font-headline-sm text-headline-sm">Commission queue</h2>
            <Link href="/admin/requests" className="font-label-sm text-[9px] uppercase tracking-wider text-secondary underline underline-offset-4">
              All
            </Link>
          </div>
          {data.recentRequests.length > 0 ? (
            <div className="divide-y divide-outline-variant/50">
              {data.recentRequests.map((request) => (
                <Link key={request.id} href={`/admin/requests/${request.id}`} className="block px-space-md py-2.5 hover:bg-surface-container-low">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-label-sm text-[10px] uppercase tracking-wider">{request.request_number}</span>
                    <span className={`rounded-full border px-2 py-0.5 font-label-sm text-[8px] uppercase tracking-wider ${statusTone(request.status)}`}>
                      {requestStatusLabels[request.status]}
                    </span>
                  </div>
                  <p className="mt-1 font-body-sm text-[12px] font-semibold">{request.customer_name}</p>
                  <p className="font-body-sm text-[11px] text-on-surface-variant">
                    {request.garment_name ?? "Garment TBC"} · {request.placement ?? "Placement TBC"}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-space-md text-center">
              <p className="font-body-sm text-[12px] text-on-surface-variant">
                No open commissions. New bespoke briefs appear here for review.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
