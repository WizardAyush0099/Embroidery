import type { Metadata } from "next";
import Link from "next/link";
import { adminRequests } from "@/lib/admin-data";
import {
  formatDate,
  formatINR,
  requestStatusLabels,
  requestStatusOptions,
  statusTone,
} from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Custom Embroidery Queue",
  robots: { index: false },
};

export default async function AdminRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const requests = await adminRequests({ status });

  const tabs = [
    { key: "all", label: "All commissions" },
    ...requestStatusOptions.map((option) => ({ key: option, label: requestStatusLabels[option] })),
  ];

  return (
    <div className="flex flex-col gap-space-md">
      <div className="flex flex-col justify-between gap-3 border-b border-outline-variant/70 pb-space-sm sm:flex-row sm:items-end">
        <div>
          <span className="font-label-sm text-[9px] uppercase tracking-widest text-outline">
            Karigar proofing queue · {requests.length} briefs
          </span>
          <h1 className="mt-1 font-display text-headline-lg">Custom embroidery queue</h1>
        </div>
        <Link href="/custom" target="_blank" className="border border-outline-variant px-3 py-2 font-label-sm text-[9px] uppercase tracking-widest hover:border-primary">
          Open customer studio
        </Link>
      </div>

      <div className="no-scrollbar flex gap-1.5 overflow-x-auto pb-1">
        {tabs.map((tab) => {
          const href = tab.key === "all" ? "/admin/requests" : `/admin/requests?status=${tab.key}`;
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

      {requests.length === 0 ? (
        <div className="border border-outline-variant/60 bg-surface-container-lowest p-space-xl text-center">
          <span className="material-symbols-outlined text-[28px] text-secondary">stylus_note</span>
          <h2 className="mt-2 font-headline-sm text-headline-sm">No commissions in this view</h2>
          <p className="mx-auto mt-1 max-w-md font-body-sm text-[12px] text-on-surface-variant">
            Bespoke briefs submitted through the custom studio land here with the patron&apos;s artwork,
            placement and quotation controls.
          </p>
        </div>
      ) : (
        <section className="border border-outline-variant/60 bg-surface-container-lowest overflow-x-auto">
          <table className="w-full min-w-[820px] border-collapse">
            <thead>
              <tr className="border-b border-outline-variant/60 text-left">
                {["Request", "Patron", "Garment & brief", "Artwork", "Quote", "Status", ""].map((heading) => (
                  <th key={heading} className="px-space-sm py-2.5 font-label-sm text-[8px] uppercase tracking-widest text-outline">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr key={request.id} className="border-b border-outline-variant/40 last:border-0 hover:bg-surface-container-low">
                  <td className="px-space-sm py-2.5 font-label-sm text-[10px] uppercase tracking-wider">
                    {request.request_number}
                    <span className="mt-0.5 block text-[8px] text-outline">{formatDate(request.created_at)}</span>
                  </td>
                  <td className="px-space-sm py-2.5 font-body-sm text-[12px]">
                    {request.customer_name}
                    <span className="mt-0.5 block text-[10px] text-outline">{request.email}</span>
                  </td>
                  <td className="px-space-sm py-2.5 font-body-sm text-[11px]">
                    {request.garment_name ?? "Garment TBC"}
                    <span className="mt-0.5 block text-[10px] text-outline">
                      {request.size ?? "—"} · {request.placement ?? "Placement TBC"}
                    </span>
                  </td>
                  <td className="px-space-sm py-2.5 font-label-sm text-[9px] uppercase tracking-wider">
                    {request.reference_images.length > 0 ? `${request.reference_images.length} file(s)` : "Text brief"}
                  </td>
                  <td className="px-space-sm py-2.5 font-body-sm text-[12px] tabular-nums">
                    {request.quote_amount != null ? formatINR(request.quote_amount) : "—"}
                  </td>
                  <td className="px-space-sm py-2.5">
                    <span className={`inline-block rounded-full border px-2 py-0.5 font-label-sm text-[8px] uppercase tracking-wider ${statusTone(request.status)}`}>
                      {requestStatusLabels[request.status]}
                    </span>
                  </td>
                  <td className="px-space-sm py-2.5 text-right">
                    <Link href={`/admin/requests/${request.id}`} className="material-symbols-outlined text-[17px] text-outline hover:text-secondary" aria-label="Review request">
                      visibility
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
