export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function totalStock(sizeStock: Record<string, number> | null | undefined, fallback = 0) {
  if (!sizeStock) return fallback;
  const values = Object.values(sizeStock).filter((value) => typeof value === "number");
  if (values.length === 0) return fallback;
  return values.reduce((sum, value) => sum + value, 0);
}

export function firstImage(images: string[] | null | undefined, fallback = "/images/stitch/s03-editorial-close-up-fashion-photograph-of-an.jpg") {
  return images?.[0] || fallback;
}

export function truncate(value: string | null | undefined, length = 120) {
  if (!value) return "";
  return value.length > length ? `${value.slice(0, length).trimEnd()}…` : value;
}
