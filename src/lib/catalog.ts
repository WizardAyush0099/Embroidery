import "server-only";

import { isSupabaseConfigured } from "@/lib/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Category, Product, StoreSettings } from "@/lib/types";

export const defaultSettings: StoreSettings = {
  id: 1,
  brand_name: "Atelier Brodé",
  contact_email: "concierge@atelierbrode.in",
  contact_phone: "+91 98200 00000",
  address: "Atelier House, Kala Ghoda, Mumbai 400001, India",
  instagram: "@atelierbrode",
  shipping_fee: 250,
  free_shipping_threshold: 25000,
  announcement:
    "Complimentary bespoke hand monogramming on orders above ₹25,000 · Pure handcraft by master karigars",
  cod_enabled: true,
  updated_at: new Date(0).toISOString(),
};

export type ProductFilters = {
  q?: string;
  category?: string;
  size?: string;
  color?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sort?: string;
};

function safeSearchTerm(value: string) {
  return value.replace(/[,()%*]/g, " ").trim();
}

/**
 * The atelier's own ordering: an explicit display number wins, and garments
 * sharing a number fall back to newest-first. Sorting in memory keeps the
 * storefront working even if the sort_order migration has not been applied yet.
 */
export function sortProductsForDisplay(products: Product[]): Product[] {
  return [...products].sort((a, b) => {
    const byOrder = (a.sort_order ?? 0) - (b.sort_order ?? 0);
    if (byOrder !== 0) return byOrder;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

export function normaliseProduct(row: Record<string, unknown>): Product {
  const category = row.categories as Product["categories"] | null;
  return {
    ...(row as unknown as Product),
    price: Number(row.price ?? 0),
    compare_at_price: row.compare_at_price == null ? null : Number(row.compare_at_price),
    images: Array.isArray(row.images) ? (row.images as string[]) : [],
    sizes: Array.isArray(row.sizes) ? (row.sizes as string[]) : [],
    colors: Array.isArray(row.colors) ? (row.colors as Product["colors"]) : [],
    size_stock: (row.size_stock as Record<string, number>) ?? {},
    stock: Number(row.stock ?? 0),
    sort_order: Number(row.sort_order ?? 0),
    is_featured: Boolean(row.is_featured),
    is_new_arrival: Boolean(row.is_new_arrival),
    is_published: Boolean(row.is_published),
    is_customisable: Boolean(row.is_customisable),
    categories: category ?? null,
  };
}

export async function getProducts(filters: ProductFilters = {}): Promise<Product[]> {
  if (!isSupabaseConfigured) return [];

  try {
    const supabase = await createSupabaseServerClient();
    let query = supabase
      .from("products")
      .select("*, categories(name, slug)")
      .eq("is_published", true);

    if (filters.q) {
      const term = safeSearchTerm(filters.q);
      if (term) {
        query = query.or(
          `name.ilike.%${term}%,description.ilike.%${term}%,technique.ilike.%${term}%,fabric_label.ilike.%${term}%`,
        );
      }
    }

    if (filters.category) {
      const { data: category } = await supabase
        .from("categories")
        .select("id")
        .eq("slug", filters.category)
        .maybeSingle();
      if (!category) return [];
      query = query.eq("category_id", category.id);
    }

    if (filters.size) query = query.contains("sizes", [filters.size]);
    // supabase-js stringifies plain object arrays as "[object Object]", so the
    // jsonb containment value must be pre-serialised.
    if (filters.color) {
      query = query.contains("colors", JSON.stringify([{ name: filters.color }]));
    }
    if (filters.minPrice != null) query = query.gte("price", filters.minPrice);
    if (filters.maxPrice != null) query = query.lte("price", filters.maxPrice);
    if (filters.inStock) query = query.gt("stock", 0);

    switch (filters.sort) {
      case "price-asc":
        query = query.order("price", { ascending: true });
        break;
      case "price-desc":
        query = query.order("price", { ascending: false });
        break;
      case "newest":
        query = query.order("created_at", { ascending: false });
        break;
      case "name":
        query = query.order("name", { ascending: true });
        break;
      default:
        // Narrow the page to the most recent rows first; the atelier's own
        // display numbers are then applied in memory below.
        query = query.order("created_at", { ascending: false });
    }

    const { data, error } = await query.limit(120);
    if (error) throw error;
    const products = (data ?? []).map(normaliseProduct);
    return !filters.sort || filters.sort === "featured" ? sortProductsForDisplay(products) : products;
  } catch (error) {
    console.error("getProducts failed", error);
    return [];
  }
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("products")
      .select("*, categories(name, slug)")
      .eq("slug", slug)
      .eq("is_published", true)
      .maybeSingle();
    if (error || !data) return null;
    return normaliseProduct(data);
  } catch (error) {
    console.error("getProductBySlug failed", error);
    return null;
  }
}

export async function getFeaturedProducts(limit = 4): Promise<Product[]> {
  if (!isSupabaseConfigured) return [];
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("products")
      .select("*, categories(name, slug)")
      .eq("is_published", true)
      .eq("is_featured", true)
      .order("created_at", { ascending: false })
      .limit(Math.max(limit * 4, 24));
    if (error) throw error;
    return sortProductsForDisplay((data ?? []).map(normaliseProduct)).slice(0, limit);
  } catch (error) {
    console.error("getFeaturedProducts failed", error);
    return [];
  }
}

export async function getNewArrivals(limit = 4): Promise<Product[]> {
  if (!isSupabaseConfigured) return [];
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("products")
      .select("*, categories(name, slug)")
      .eq("is_published", true)
      .eq("is_new_arrival", true)
      .order("created_at", { ascending: false })
      .limit(Math.max(limit * 4, 24));
    if (error) throw error;
    return sortProductsForDisplay((data ?? []).map(normaliseProduct)).slice(0, limit);
  } catch (error) {
    console.error("getNewArrivals failed", error);
    return [];
  }
}

export async function getRelatedProducts(
  categoryId: string | null,
  excludeId: string,
  limit = 3,
): Promise<Product[]> {
  if (!isSupabaseConfigured) return [];
  try {
    const supabase = await createSupabaseServerClient();
    let query = supabase
      .from("products")
      .select("*, categories(name, slug)")
      .eq("is_published", true)
      .neq("id", excludeId)
      .order("created_at", { ascending: false })
      .limit(Math.max(limit * 3, 12));

    if (categoryId) query = query.eq("category_id", categoryId);

    const { data, error } = await query;
    if (error) throw error;
    return sortProductsForDisplay((data ?? []).map(normaliseProduct)).slice(0, limit);
  } catch (error) {
    console.error("getRelatedProducts failed", error);
    return [];
  }
}

export async function getProductsForFilters(): Promise<{ sizes: string[]; colors: string[] }> {
  if (!isSupabaseConfigured) return { sizes: [], colors: [] };
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("products")
      .select("sizes, colors")
      .eq("is_published", true);
    if (error) throw error;

    const sizes = new Set<string>();
    const colors = new Set<string>();
    for (const row of data ?? []) {
      (Array.isArray(row.sizes) ? row.sizes : []).forEach((size: string) => size && sizes.add(size));
      (Array.isArray(row.colors) ? row.colors : []).forEach(
        (color: { name?: string }) => color?.name && colors.add(color.name),
      );
    }

    const sizeOrder = ["XS", "S", "M", "L", "XL", "XXL", "One Size"];
    return {
      sizes: [...sizes].sort((a, b) => {
        const ai = sizeOrder.indexOf(a);
        const bi = sizeOrder.indexOf(b);
        return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi) || a.localeCompare(b);
      }),
      colors: [...colors].sort(),
    };
  } catch {
    return { sizes: [], colors: [] };
  }
}

export async function getCategories(): Promise<Category[]> {
  if (!isSupabaseConfigured) return [];
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return data ?? [];
  } catch (error) {
    console.error("getCategories failed", error);
    return [];
  }
}

export async function getCategoryCounts(): Promise<Record<string, number>> {
  if (!isSupabaseConfigured) return {};
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("products")
      .select("category_id")
      .eq("is_published", true);
    if (error) throw error;
    return (data ?? []).reduce<Record<string, number>>((acc, row) => {
      const key = (row.category_id as string) ?? "uncategorised";
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});
  } catch {
    return {};
  }
}

export async function getStoreSettings(): Promise<StoreSettings> {
  if (!isSupabaseConfigured) return defaultSettings;
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("store_settings")
      .select("*")
      .eq("id", 1)
      .maybeSingle();
    if (error || !data) return defaultSettings;
    return {
      ...defaultSettings,
      ...data,
      shipping_fee: Number(data.shipping_fee ?? defaultSettings.shipping_fee),
      free_shipping_threshold: Number(
        data.free_shipping_threshold ?? defaultSettings.free_shipping_threshold,
      ),
    };
  } catch {
    return defaultSettings;
  }
}

export async function getCustomisableProducts(): Promise<Product[]> {
  if (!isSupabaseConfigured) return [];
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("products")
      .select("*, categories(name, slug)")
      .eq("is_published", true)
      .eq("is_customisable", true)
      .order("price", { ascending: true });
    if (error) throw error;
    return (data ?? []).map(normaliseProduct);
  } catch (error) {
    console.error("getCustomisableProducts failed", error);
    return [];
  }
}
