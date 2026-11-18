"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { placeOrder } from "@/lib/actions/checkout";
import { formatINR } from "@/lib/format";
import { loadRazorpayScript, openRazorpay } from "@/lib/razorpay-client";

type Props = {
  shippingFee: number;
  freeShippingThreshold: number;
  razorpayEnabled: boolean;
  codEnabled: boolean;
  defaultName: string;
  defaultEmail: string;
};

const states = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat",
  "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh",
  "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh",
  "Uttarakhand", "West Bengal", "Delhi", "Jammu & Kashmir", "Ladakh", "Puducherry",
  "Chandigarh", "Andaman & Nicobar Islands", "Dadra & Nagar Haveli and Daman & Diu", "Lakshadweep",
];

export function CheckoutForm({
  shippingFee,
  freeShippingThreshold,
  razorpayEnabled,
  codEnabled,
  defaultName,
  defaultEmail,
}: Props) {
  const { lines, subtotal, hydrated, clear } = useCart();
  const router = useRouter();

  const [form, setForm] = useState({
    name: defaultName,
    email: defaultEmail,
    phone: "",
    line1: "",
    line2: "",
    city: "",
    state: "Maharashtra",
    postal_code: "",
    notes: "",
  });
  const [proofPreference, setProofPreference] = useState<"digital" | "trust_artisan">("digital");
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "razorpay">(
    razorpayEnabled ? "razorpay" : "cod",
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const shipping = useMemo(
    () => (freeShippingThreshold > 0 && subtotal >= freeShippingThreshold ? 0 : shippingFee),
    [subtotal, shippingFee, freeShippingThreshold],
  );
  const total = subtotal + shipping;

  function update(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (lines.length === 0) {
      setError("Your bag is empty.");
      return;
    }
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) {
      setError("Add your name, email and phone so the atelier can reach you.");
      return;
    }
    if (!form.line1.trim() || !form.city.trim() || !form.postal_code.trim()) {
      setError("Complete your shipping address.");
      return;
    }

    setPending(true);
    try {
      const result = await placeOrder({
        name: form.name,
        email: form.email,
        phone: form.phone,
        address: {
          line1: form.line1,
          line2: form.line2,
          city: form.city,
          state: form.state,
          postal_code: form.postal_code,
          country: "India",
        },
        items: lines.map((line) => ({
          productId: line.productId,
          size: line.size,
          color: line.color,
          quantity: line.quantity,
        })),
        paymentMethod,
        proofPreference,
        notes: form.notes,
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      if (result.razorpay) {
        const loaded = await loadRazorpayScript();
        if (!loaded) {
          clear();
          router.push(`/orders/${result.orderId}?email=${encodeURIComponent(form.email)}&payment=unavailable`);
          return;
        }

        const outcome = await openRazorpay({
          keyId: result.razorpay.keyId,
          razorpayOrderId: result.razorpay.razorpayOrderId,
          amount: result.razorpay.amount,
          currency: result.razorpay.currency,
          name: result.razorpay.brandName,
          description: `Commission ${result.orderNumber}`,
          prefill: {
            name: result.razorpay.name,
            email: result.razorpay.email,
            contact: result.razorpay.phone,
          },
        });

        if (outcome.status === "paid") {
          const verify = await fetch("/api/payment/razorpay/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              orderId: result.orderId,
              razorpay_order_id: outcome.response.razorpay_order_id,
              razorpay_payment_id: outcome.response.razorpay_payment_id,
              razorpay_signature: outcome.response.razorpay_signature,
            }),
          });

          clear();
          if (!verify.ok) {
            router.push(`/orders/${result.orderId}?email=${encodeURIComponent(form.email)}&payment=verify-failed`);
            return;
          }
          router.push(`/orders/${result.orderId}?email=${encodeURIComponent(form.email)}&payment=success`);
          return;
        }

        clear();
        router.push(`/orders/${result.orderId}?email=${encodeURIComponent(form.email)}&payment=cancelled`);
        return;
      }

      clear();
      router.push(`/orders/${result.orderId}?email=${encodeURIComponent(form.email)}`);
    } catch (submitError) {
      console.error(submitError);
      setError("Checkout could not be completed. Please try again.");
    } finally {
      setPending(false);
    }
  }

  if (hydrated && lines.length === 0) {
    return (
      <div className="border border-outline-variant/70 bg-surface-container-lowest px-space-lg py-space-2xl text-center">
        <span className="material-symbols-outlined text-[30px] text-secondary">shopping_bag</span>
        <h2 className="mt-2 font-headline-md text-headline-md">There is nothing to check out</h2>
        <p className="mx-auto mt-2 max-w-md font-body-md text-body-md text-on-surface-variant">
          Add a garment to your bag, or commission a custom piece in the studio.
        </p>
        <div className="mt-space-md flex flex-col items-center justify-center gap-space-sm sm:flex-row">
          <Link href="/shop" className="btn-primary">
            Shop the collection
          </Link>
          <Link href="/custom" className="btn-secondary">
            Custom studio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-gutter lg:grid-cols-12">
      <div className="flex flex-col gap-space-lg lg:col-span-7">
        <section className="border border-outline-variant/70 bg-surface-container-lowest p-space-lg">
          <div className="mb-space-md flex items-center justify-between">
            <h2 className="font-headline-md text-headline-md">1. Contact & stitch dispatch</h2>
            <Link href="/login" className="font-label-sm text-[10px] uppercase tracking-widest text-secondary underline underline-offset-4">
              Log in
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-space-md sm:grid-cols-2">
            <label className="sm:col-span-2">
              <span className="atelier-label">Full name</span>
              <input required value={form.name} onChange={(event) => update("name", event.target.value)} className="atelier-input" autoComplete="name" />
            </label>
            <label>
              <span className="atelier-label">Email</span>
              <input required type="email" value={form.email} onChange={(event) => update("email", event.target.value)} className="atelier-input" autoComplete="email" />
            </label>
            <label>
              <span className="atelier-label">Mobile with +91</span>
              <input required value={form.phone} onChange={(event) => update("phone", event.target.value)} placeholder="+91 98200 00000" className="atelier-input" autoComplete="tel" inputMode="tel" />
            </label>
          </div>
          <p className="mt-2 font-body-sm text-[12px] text-flax-grey">
            We share proof updates and dispatch tracking on this number. No marketing messages.
          </p>
        </section>

        <section className="border border-outline-variant/70 bg-surface-container-lowest p-space-lg">
          <h2 className="mb-space-md font-headline-md text-headline-md">2. Atelier shipping address</h2>
          <div className="grid grid-cols-1 gap-space-md sm:grid-cols-2">
            <label className="sm:col-span-2">
              <span className="atelier-label">Address line 1</span>
              <input required value={form.line1} onChange={(event) => update("line1", event.target.value)} className="atelier-input" autoComplete="address-line1" />
            </label>
            <label className="sm:col-span-2">
              <span className="atelier-label">Apartment, studio, landmark (optional)</span>
              <input value={form.line2} onChange={(event) => update("line2", event.target.value)} className="atelier-input" autoComplete="address-line2" />
            </label>
            <label>
              <span className="atelier-label">City</span>
              <input required value={form.city} onChange={(event) => update("city", event.target.value)} className="atelier-input" autoComplete="address-level2" />
            </label>
            <label>
              <span className="atelier-label">State</span>
              <select value={form.state} onChange={(event) => update("state", event.target.value)} className="atelier-input" autoComplete="address-level1">
                {states.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="atelier-label">PIN code</span>
              <input required value={form.postal_code} onChange={(event) => update("postal_code", event.target.value)} className="atelier-input" autoComplete="postal-code" inputMode="numeric" />
            </label>
            <label>
              <span className="atelier-label">Country</span>
              <input value="India" readOnly className="atelier-input bg-surface-container" />
            </label>
          </div>
        </section>

        <section className="border border-outline-variant/70 bg-surface-container-lowest p-space-lg">
          <h2 className="mb-space-md font-headline-md text-headline-md">3. Digital needlework proofing</h2>
          <div className="flex flex-col gap-space-sm">
            <label className={`flex cursor-pointer items-start gap-3 border p-3 ${proofPreference === "digital" ? "border-primary bg-surface-container-low" : "border-outline-variant"}`}>
              <input
                type="radio"
                name="proof"
                checked={proofPreference === "digital"}
                onChange={() => setProofPreference("digital")}
                className="mt-1 accent-secondary"
              />
              <span>
                <span className="block font-label-md text-label-md uppercase tracking-wider">Require digital proof approval (recommended)</span>
                <span className="mt-1 block font-body-sm text-body-sm text-on-surface-variant">
                  A macro proof with thread direction and stitch density is emailed before production begins.
                </span>
              </span>
            </label>
            <label className={`flex cursor-pointer items-start gap-3 border p-3 ${proofPreference === "trust_artisan" ? "border-primary bg-surface-container-low" : "border-outline-variant"}`}>
              <input
                type="radio"
                name="proof"
                checked={proofPreference === "trust_artisan"}
                onChange={() => setProofPreference("trust_artisan")}
                className="mt-1 accent-secondary"
              />
              <span>
                <span className="block font-label-md text-label-md uppercase tracking-wider">Trust the master embroiderers</span>
                <span className="mt-1 block font-body-sm text-body-sm text-on-surface-variant">
                  Skip email approval and save 24–48 hours. Needlework follows your brief at the digitizer&apos;s discretion.
                </span>
              </span>
            </label>
          </div>
        </section>

        <section className="border border-outline-variant/70 bg-surface-container-lowest p-space-lg">
          <h2 className="mb-space-md font-headline-md text-headline-md">4. Secure payment</h2>
          <div className="flex flex-col gap-space-sm">
            <label className={`flex cursor-pointer items-start gap-3 border p-3 ${paymentMethod === "razorpay" ? "border-primary bg-surface-container-low" : "border-outline-variant"} ${!razorpayEnabled ? "opacity-50" : ""}`}>
              <input
                type="radio"
                name="payment"
                checked={paymentMethod === "razorpay"}
                onChange={() => setPaymentMethod("razorpay")}
                disabled={!razorpayEnabled}
                className="mt-1 accent-secondary"
              />
              <span>
                <span className="block font-label-md text-label-md uppercase tracking-wider">Pay online · Razorpay</span>
                <span className="mt-1 block font-body-sm text-body-sm text-on-surface-variant">
                  UPI, cards, netbanking and wallets. Payments are captured only after an encrypted HMAC signature is verified on the server.
                </span>
                {!razorpayEnabled && (
                  <span className="mt-1 block font-label-sm text-[10px] uppercase tracking-wider text-secondary">
                    Online payments are being activated — choose pay on delivery
                  </span>
                )}
              </span>
            </label>
            <label className={`flex cursor-pointer items-start gap-3 border p-3 ${paymentMethod === "cod" ? "border-primary bg-surface-container-low" : "border-outline-variant"} ${!codEnabled ? "opacity-50" : ""}`}>
              <input
                type="radio"
                name="payment"
                checked={paymentMethod === "cod"}
                onChange={() => setPaymentMethod("cod")}
                disabled={!codEnabled}
                className="mt-1 accent-secondary"
              />
              <span>
                <span className="block font-label-md text-label-md uppercase tracking-wider">Pay on delivery / bank transfer</span>
                <span className="mt-1 block font-body-sm text-body-sm text-on-surface-variant">
                  Your commission is confirmed once the concierge verifies your address. Payment on white-glove handover.
                </span>
              </span>
            </label>
          </div>

          {error && (
            <p role="alert" className="mt-space-md border border-error/30 bg-error-container px-3 py-2 font-body-sm text-body-sm text-on-error-container">
              {error}
            </p>
          )}

          <button type="submit" disabled={pending} className="btn-primary mt-space-md w-full py-4">
            {pending ? "Threading your order…" : `Place order · ${formatINR(total)}`}
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
          <p className="mt-2 text-center font-label-sm text-[9px] uppercase tracking-wider text-outline">
            Stock is reserved against your order at the moment of confirmation
          </p>
        </section>
      </div>

      <aside className="lg:col-span-5">
        <div className="sticky top-32 border border-outline-variant/70 bg-surface-container-lowest p-space-lg shadow-tactile">
          <div className="flex items-center justify-between">
            <h2 className="font-headline-md text-headline-md">Order review</h2>
            <Link href="/cart" className="font-label-sm text-[10px] uppercase tracking-widest text-secondary underline underline-offset-4">
              Edit bag
            </Link>
          </div>

          <div className="mt-space-md flex flex-col gap-3 border-b border-outline-variant/70 pb-space-md">
            {lines.map((line) => (
              <div key={`${line.productId}-${line.size}-${line.color}`} className="flex gap-3">
                <div className="relative h-16 w-14 shrink-0 overflow-hidden bg-surface-container">
                  <Image src={line.image} alt={line.name} fill sizes="56px" className="object-cover" />
                </div>
                <div className="flex flex-1 flex-col">
                  <span className="font-body-sm text-body-sm font-semibold">{line.name}</span>
                  <span className="font-label-sm text-[9px] uppercase tracking-wider text-outline">
                    {line.size}
                    {line.color ? ` · ${line.color}` : ""} · Qty {line.quantity}
                  </span>
                </div>
                <span className="font-body-sm text-body-sm font-semibold tabular-nums">
                  {formatINR(line.price * line.quantity)}
                </span>
              </div>
            ))}
          </div>

          <div className="space-y-2 py-space-md font-body-sm text-body-sm">
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Garments subtotal</span>
              <span className="font-semibold tabular-nums">{formatINR(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-on-surface-variant">White-glove delivery</span>
              <span className="font-semibold tabular-nums">{shipping === 0 ? "Complimentary" : formatINR(shipping)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Digital proofing</span>
              <span className="font-semibold">Included</span>
            </div>
          </div>

          <div className="flex items-baseline justify-between border-t border-outline-variant/70 pt-space-md">
            <span className="font-headline-sm text-headline-sm">Total due</span>
            <span className="font-display text-headline-lg font-semibold tabular-nums">{formatINR(total)}</span>
          </div>

          <div className="mt-space-md rounded border border-outline-variant/70 bg-surface-container-low p-3">
            <p className="font-label-sm text-[9px] uppercase tracking-wider text-sage">
              100% embroidery quality guarantee
            </p>
            <p className="mt-1 font-body-sm text-[12px] text-on-surface-variant">
              Digital proofs protect the garment. Lifetime thread repair is included on every atelier piece.
            </p>
          </div>
        </div>
      </aside>
    </form>
  );
}
