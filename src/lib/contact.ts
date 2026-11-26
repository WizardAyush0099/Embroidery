/**
 * The atelier's direct line. Kept in one place so the footer, the contact page,
 * the custom studio and the commission CTAs always point at the same number.
 */
export const STUDIO_PHONE_DISPLAY = "+91 83530 11030";
export const STUDIO_PHONE_TEL = "+918353011030";
export const STUDIO_WHATSAPP = "918353011030";

const DEFAULT_WHATSAPP_MESSAGE =
  "Hello Atelier Brodé, I would like to start a bespoke embroidery project.";

export function studioWhatsAppUrl(message: string = DEFAULT_WHATSAPP_MESSAGE) {
  return `https://wa.me/${STUDIO_WHATSAPP}?text=${encodeURIComponent(message)}`;
}

/** Build a wa.me link from a settings phone value, falling back to the studio line. */
export function whatsAppUrlFromPhone(phone: string | null | undefined, message?: string) {
  const digits = (phone ?? "").replace(/[^\d]/g, "");
  if (digits.length >= 10) {
    const normalised = digits.length === 10 ? `91${digits}` : digits;
    return `https://wa.me/${normalised}${message ? `?text=${encodeURIComponent(message)}` : ""}`;
  }
  return studioWhatsAppUrl(message);
}
