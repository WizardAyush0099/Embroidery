import type { CustomRequestStatus, OrderStatus, PaymentStatus } from "@/lib/types";

const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const inrFormatterWithPaise = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatINR(value: number | string | null | undefined) {
  const amount = typeof value === "string" ? Number(value) : value;
  if (amount == null || Number.isNaN(amount)) return "—";
  return Number.isInteger(amount) ? inrFormatter.format(amount) : inrFormatterWithPaise.format(amount);
}

export function formatDate(value: string | Date | null | undefined, withTime = false) {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(date);
}

export const orderStatusLabels: Record<OrderStatus, string> = {
  pending: "Awaiting confirmation",
  confirmed: "Confirmed",
  in_production: "In the atelier",
  shipped: "Dispatched",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const paymentStatusLabels: Record<PaymentStatus, string> = {
  pending: "Payment pending",
  paid: "Paid",
  failed: "Payment failed",
  refunded: "Refunded",
};

export const requestStatusLabels: Record<CustomRequestStatus, string> = {
  new: "New inquiry",
  reviewing: "Under review",
  quoted: "Quotation sent",
  approved: "Approved",
  in_production: "In production",
  completed: "Completed",
  declined: "Declined",
};

export const orderStatusOptions: OrderStatus[] = [
  "pending",
  "confirmed",
  "in_production",
  "shipped",
  "delivered",
  "cancelled",
];

export const requestStatusOptions: CustomRequestStatus[] = [
  "new",
  "reviewing",
  "quoted",
  "approved",
  "in_production",
  "completed",
  "declined",
];

export function statusTone(status: string) {
  switch (status) {
    case "paid":
    case "delivered":
    case "completed":
    case "approved":
      return "bg-[#e7efe4] text-[#3d5a38] border-[#c5d8bf]";
    case "shipped":
    case "in_production":
    case "confirmed":
      return "bg-[#f3ecdd] text-[#7a5a1e] border-[#ddcfae]";
    case "quoted":
    case "reviewing":
      return "bg-[#f6e7e0] text-[#8a3f27] border-[#e5c5b8]";
    case "cancelled":
    case "failed":
    case "declined":
      return "bg-[#f7e3e1] text-[#8f1f1f] border-[#e5bdb8]";
    default:
      return "bg-surface-container text-on-surface-variant border-outline-variant/60";
  }
}
