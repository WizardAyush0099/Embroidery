import type { MetadataRoute } from "next";
import { getCategories, getProducts } from "@/lib/catalog";
import { resolveSiteUrl } from "@/lib/config";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = resolveSiteUrl();
  const [products, categories] = await Promise.all([getProducts(), getCategories()]);

  const staticRoutes = ["", "/shop", "/custom", "/about", "/contact", "/track"].map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.7,
  }));

  const productRoutes = products.map((product) => ({
    url: `${base}/shop/${product.slug}`,
    lastModified: new Date(product.updated_at),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const categoryRoutes = categories.map((category) => ({
    url: `${base}/shop?category=${category.slug}`,
    lastModified: new Date(category.created_at),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...productRoutes, ...categoryRoutes];
}
