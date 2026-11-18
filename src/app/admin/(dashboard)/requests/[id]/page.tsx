import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RequestReviewForm } from "@/components/admin/RequestReviewForm";
import { adminRequest } from "@/lib/admin-data";
import { formatDate, formatINR, requestStatusLabels, statusTone } from "@/lib/format";
import { signedUrlsFor } from "@/lib/storage";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Commission Review",
  robots: { index: false },
};

export default async function AdminRequestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const request = await adminRequest(id);
  if (!request) notFound();

  const signed = await signedUrlsFor(request.reference_images ?? []);

  return (
    <div className="flex flex-col gap-space-md">
      <div className="flex flex-col justify-between gap-2 border-b border-outline-variant/70 pb-space-sm sm:flex-row sm:items-end">
        <div>
          <nav className="flex items-center gap-2 font-label-sm text-[8px] uppercase tracking-widest text-outline">
            <Link href="/admin/requests" className="hover:text-on-surface">
              Commission queue
            </Link>
            <span>/</span>
            <span className="text-secondary">{request.request_number}</span>
          </nav>
          <h1 className="mt-1 font-display text-headline-lg">{request.customer_name}</h1>
          <p className="mt-1 font-body-sm text-[12px] text-on-surface-variant">
            Submitted {formatDate(request.created_at, true)} · {request.garment_name ?? "Garment TBC"}
          </p>
        </div>
        <span className={`self-start rounded-full border px-2.5 py-1 font-label-sm text-[8px] uppercase tracking-widest ${statusTone(request.status)}`}>
          {requestStatusLabels[request.status]}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-space-md xl:grid-cols-12">
        <div className="flex flex-col gap-space-md xl:col-span-8">
          <section className="border border-outline-variant/60 bg-surface-container-lowest p-space-md">
            <h2 className="mb-space-sm font-headline-sm text-headline-sm">The brief</h2>
            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[
                { label: "Garment", value: request.garment_name ?? "—" },
                { label: "Size", value: request.size ?? "—" },
                { label: "Garment colour", value: request.color ?? "—" },
                { label: "Thread colour", value: request.thread_color ?? "—" },
                { label: "Placement", value: request.placement ?? "—" },
                { label: "Typography", value: request.font_style ?? "—" },
              ].map((row) => (
                <div key={row.label}>
                  <dt className="font-label-sm text-[8px] uppercase tracking-wider text-outline">{row.label}</dt>
                  <dd className="mt-0.5 font-body-sm text-[12px]">{row.value}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-space-md border-t border-outline-variant/50 pt-space-sm">
              <p className="font-label-sm text-[8px] uppercase tracking-wider text-outline">Primary text / monogram</p>
              <p className="mt-1 font-display text-headline-md text-secondary">
                {request.custom_text ? `“${request.custom_text}”` : "No monogram — artwork brief only"}
              </p>
            </div>

            <div className="mt-space-md border-t border-outline-variant/50 pt-space-sm">
              <p className="font-label-sm text-[8px] uppercase tracking-wider text-outline">Design description</p>
              <p className="mt-1 whitespace-pre-line font-body-sm text-[12px] leading-relaxed text-on-surface-variant">
                {request.description || "No written description supplied."}
              </p>
            </div>
          </section>

          <section className="border border-outline-variant/60 bg-surface-container-lowest p-space-md">
            <div className="mb-space-sm flex items-center justify-between">
              <h2 className="font-headline-sm text-headline-sm">Reference artwork</h2>
              <span className="font-label-sm text-[8px] uppercase tracking-wider text-outline">
                Private · signed links expire in 1 hour
              </span>
            </div>
            {signed.length > 0 ? (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {signed.map((url, index) =>
                  url ? (
                    <a
                      key={url}
                      href={url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="group relative aspect-square overflow-hidden border border-outline-variant bg-surface-container"
                    >
                      {request.reference_images[index]?.toLowerCase().endsWith(".pdf") ? (
                        <span className="flex h-full w-full flex-col items-center justify-center gap-1 font-label-sm text-[9px] uppercase tracking-wider text-outline">
                          <span className="material-symbols-outlined text-[26px]">picture_as_pdf</span>
                          Open PDF
                        </span>
                      ) : (
                        <Image
                          src={url}
                          alt={`Reference ${index + 1}`}
                          fill
                          sizes="(max-width: 640px) 50vw, 20vw"
                          unoptimized
                          className="object-cover transition-transform group-hover:scale-105"
                        />
                      )}
                    </a>
                  ) : (
                    <div key={index} className="flex aspect-square items-center justify-center border border-outline-variant bg-surface-container font-body-sm text-[10px] text-outline">
                      Link unavailable
                    </div>
                  ),
                )}
              </div>
            ) : (
              <p className="font-body-sm text-[12px] text-on-surface-variant">
                No reference files were uploaded with this brief.
              </p>
            )}
          </section>

          <section className="border border-outline-variant/60 bg-surface-container-lowest p-space-md">
            <h2 className="mb-space-sm font-headline-sm text-headline-sm">Patron contact</h2>
            <p className="font-body-sm text-[12px] leading-relaxed">
              <a href={`mailto:${request.email}`} className="text-secondary underline underline-offset-4">
                {request.email}
              </a>
              <br />
              {request.phone}
            </p>
            <a
              href={`mailto:${request.email}?subject=Your%20Atelier%20Brod%C3%A9%20commission%20${request.request_number}`}
              className="btn-secondary mt-space-sm py-2.5"
            >
              Email the patron
            </a>
          </section>
        </div>

        <aside className="xl:col-span-4">
          <section className="border border-outline-variant/60 bg-surface-container-lowest p-space-md">
            <h2 className="mb-space-sm font-headline-sm text-headline-sm">Review & quote</h2>
            <p className="mb-3 font-body-sm text-[11px] text-on-surface-variant">
              Set a status and quotation. {request.quote_amount != null ? `Current quote ${formatINR(request.quote_amount)}.` : "No quotation sent yet."}
            </p>
            <RequestReviewForm request={request} />
          </section>
        </aside>
      </div>
    </div>
  );
}
