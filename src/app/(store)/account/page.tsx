import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { signOut } from "@/lib/actions/auth";
import { getSessionUser } from "@/lib/auth";
import { formatDate, formatINR, orderStatusLabels, requestStatusLabels, statusTone } from "@/lib/format";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { CustomRequest, Order } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "My Account",
  robots: { index: false },
};

export default async function AccountPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/account");

  const admin = createSupabaseAdminClient();
  const [ordersRes, requestsRes] = await Promise.all([
    admin
      .from("orders")
      .select("*, order_items(*)")
      .or(`user_id.eq.${user.id},email.eq.${user.email ?? ""}`)
      .order("created_at", { ascending: false })
      .limit(50),
    admin
      .from("custom_requests")
      .select("*")
      .or(`user_id.eq.${user.id},email.eq.${user.email ?? ""}`)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const orders = (ordersRes.data ?? []) as Order[];
  const requests = (requestsRes.data ?? []) as CustomRequest[];

  return (
    <div className="mx-auto w-full max-w-[1440px] px-margin-mobile py-space-xl md:px-margin-tablet lg:px-margin">
      <div className="mb-space-xl flex flex-col justify-between gap-4 border-b border-outline-variant/70 pb-space-md sm:flex-row sm:items-end">
        <div>
          <span className="eyebrow">Private client room</span>
          <h1 className="mt-1 font-display text-display-sm-mobile text-on-surface md:text-display-sm">
            {user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "Patron"}
          </h1>
          <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">{user.email}</p>
        </div>
        <form action={signOut}>
          <button type="submit" className="btn-secondary py-2.5">
            Sign out
          </button>
        </form>
      </div>

      <section>
        <div className="mb-space-md flex items-end justify-between">
          <h2 className="font-headline-md text-headline-md">Orders</h2>
          <span className="font-label-sm text-[10px] uppercase tracking-widest text-outline">
            {orders.length} record{orders.length === 1 ? "" : "s"}
          </span>
        </div>

        {orders.length === 0 ? (
          <div className="border border-outline-variant/70 bg-surface-container-lowest p-space-lg text-center">
            <p className="font-body-md text-body-md text-on-surface-variant">
              No orders yet. When you place one, its proofing and dispatch status will appear here.
            </p>
            <Link href="/shop" className="btn-primary mt-space-md">
              Shop the collection
            </Link>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-outline-variant/70 border-y border-outline-variant/70">
            {orders.map((order) => (
              <div key={order.id} className="flex flex-col gap-3 py-space-md md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-label-md text-label-md uppercase tracking-wider">{order.order_number}</span>
                    <span className={`rounded-full border px-2.5 py-0.5 font-label-sm text-[9px] uppercase tracking-wider ${statusTone(order.status)}`}>
                      {orderStatusLabels[order.status]}
                    </span>
                    <span className={`rounded-full border px-2.5 py-0.5 font-label-sm text-[9px] uppercase tracking-wider ${statusTone(order.payment_status)}`}>
                      {order.payment_status}
                    </span>
                  </div>
                  <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
                    {formatDate(order.created_at)} · {(order.order_items ?? []).length} garment
                    {(order.order_items ?? []).length === 1 ? "" : "s"} · {formatINR(order.total)}
                  </p>
                </div>
                <Link
                  href={`/orders/${order.id}?email=${encodeURIComponent(order.email)}`}
                  className="font-label-sm text-[10px] uppercase tracking-widest text-secondary underline underline-offset-4"
                >
                  View commission
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-space-2xl">
        <div className="mb-space-md flex items-end justify-between">
          <h2 className="font-headline-md text-headline-md">Custom commissions</h2>
          <Link href="/custom" className="font-label-sm text-[10px] uppercase tracking-widest text-secondary underline underline-offset-4">
            Start a new brief
          </Link>
        </div>

        {requests.length === 0 ? (
          <div className="border border-outline-variant/70 bg-surface-container-lowest p-space-lg text-center">
            <p className="font-body-md text-body-md text-on-surface-variant">
              You have not submitted a bespoke brief yet. The studio accepts monograms, crests and artwork.
            </p>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-outline-variant/70 border-y border-outline-variant/70">
            {requests.map((request) => (
              <div key={request.id} className="flex flex-col gap-2 py-space-md md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-label-md text-label-md uppercase tracking-wider">{request.request_number}</span>
                    <span className={`rounded-full border px-2.5 py-0.5 font-label-sm text-[9px] uppercase tracking-wider ${statusTone(request.status)}`}>
                      {requestStatusLabels[request.status]}
                    </span>
                  </div>
                  <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
                    {request.garment_name ?? "Atelier garment"} · {request.placement ?? "Placement TBC"} ·{" "}
                    {formatDate(request.created_at)}
                  </p>
                  {request.quote_amount != null && (
                    <p className="mt-1 font-label-sm text-[10px] uppercase tracking-wider text-secondary">
                      Quotation {formatINR(request.quote_amount)}
                    </p>
                  )}
                </div>
                <Link href="/contact" className="font-label-sm text-[10px] uppercase tracking-widest text-on-surface underline underline-offset-4">
                  Discuss with concierge
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
