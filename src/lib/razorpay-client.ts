"use client";

type RazorpaySuccess = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

type RazorpayInstance = { open: () => void; close?: () => void };

type RazorpayConstructor = new (options: Record<string, unknown>) => RazorpayInstance;

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor;
  }
}

export function loadRazorpayScript(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);

  return new Promise((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-razorpay="checkout"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(Boolean(window.Razorpay)));
      existing.addEventListener("error", () => resolve(false));
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.dataset.razorpay = "checkout";
    script.onload = () => resolve(Boolean(window.Razorpay));
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function openRazorpay(options: {
  keyId: string;
  razorpayOrderId: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  prefill: { name: string; email: string; contact: string };
}): Promise<{ status: "paid"; response: RazorpaySuccess } | { status: "dismissed" | "failed" }> {
  return new Promise((resolve) => {
    if (!window.Razorpay) {
      resolve({ status: "failed" });
      return;
    }

    let settled = false;
    const finish = (value: { status: "paid"; response: RazorpaySuccess } | { status: "dismissed" | "failed" }) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };

    const checkout = new window.Razorpay({
      key: options.keyId,
      order_id: options.razorpayOrderId,
      amount: options.amount,
      currency: options.currency,
      name: options.name,
      description: options.description,
      prefill: options.prefill,
      theme: { color: "#1c1b1a" },
      modal: {
        ondismiss: () => finish({ status: "dismissed" }),
      },
      handler: (response: RazorpaySuccess) => finish({ status: "paid", response }),
    });

    checkout.open();
  });
}
