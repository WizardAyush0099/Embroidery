import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type {
  Category,
  CustomRequest,
  CustomRequestStatus,
  Order,
  OrderStatus,
  Product,
  StoreSettings,
} from "@/lib/types";
import { normaliseProduct, sortProductsForDisplay } from "@/lib/catalog";

export async function adminProducts(options: { search?: string; status?: string } = {}) {
  const admin = createSupabaseAdminClient();
  let query = admin
    .from("products")
    .select("*, categories(name, slug)")
    .order("created_at", { ascending: false });

  if (options.search) {
    query = query.ilike("name", `%${options.search.replace(/[%_]/g, "")}%`);
  }
  if (options.status === "published") query = query.eq("is_published", true);
  if (options.status === "draft") query = query.eq("is_published", false);
  if (options.status === "featured") query = query.eq("is_featured", true);

  const { data, error } = await query;
  if (error) {
    console.error("adminProducts failed", error);
    return [] as Product[];
  }
  return sortProductsForDisplay((data ?? []).map(normaliseProduct));
}

export async function adminProduct(id: string): Promise<Product | null> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("products")
    .select("*, categories(name, slug)")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return normaliseProduct(data);
}

export async function adminCategories(): Promise<Category[]> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.from("categories").select("*").order("sort_order");
  if (error) return [];
  return data ?? [];
}

export async function adminOrders(options: { status?: string; search?: string } = {}): Promise<Order[]> {
  const admin = createSupabaseAdminClient();
  let query = admin
    .from("orders")
    .select("*, order_items(*)")
    .order("created_at", { ascending: false })
    .limit(200);

  if (options.status && options.status !== "all") query = query.eq("status", options.status as OrderStatus);
  if (options.search) {
    const term = options.search.replace(/[%_,]/g, "").trim();
    query = query.or(
      `order_number.ilike.%${term}%,customer_name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%`,
    );
  }

  const { data, error } = await query;
  if (error) {
    console.error("adminOrders failed", error);
    return [];
  }
  return (data ?? []) as Order[];
}

export async function adminOrder(id: string): Promise<Order | null> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("orders")
    .select("*, order_items(*)")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return data as Order;
}

export async function adminRequests(options: { status?: string } = {}): Promise<CustomRequest[]> {
  const admin = createSupabaseAdminClient();
  let query = admin
    .from("custom_requests")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  if (options.status && options.status !== "all") {
    query = query.eq("status", options.status as CustomRequestStatus);
  }

  const { data, error } = await query;
  if (error) {
    console.error("adminRequests failed", error);
    return [];
  }
  return (data ?? []) as CustomRequest[];
}

export async function adminRequest(id: string): Promise<CustomRequest | null> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.from("custom_requests").select("*").eq("id", id).maybeSingle();
  if (error || !data) return null;
  return data as CustomRequest;
}

export async function adminSettings(): Promise<StoreSettings | null> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.from("store_settings").select("*").eq("id", 1).maybeSingle();
  if (error || !data) return null;
  return data as StoreSettings;
}

export type DashboardData = {
  revenue: number;
  paidRevenue: number;
  orderCount: number;
  pendingOrders: number;
  openRequests: number;
  lowStock: Product[];
  productCount: number;
  publishedCount: number;
  recentOrders: Order[];
  recentRequests: CustomRequest[];
  topProducts: Array<{ name: string; units: number; revenue: number }>;
  monthlyRevenue: Array<{ label: string; value: number }>;
};

export async function dashboardData(): Promise<DashboardData> {
  const admin = createSupabaseAdminClient();

  const [ordersRes, requestsRes, productsRes, itemsRes] = await Promise.all([
    admin.from("orders").select("*, order_items(*)").order("created_at", { ascending: false }).limit(200),
    admin
      .from("custom_requests")
      .select("*")
      .in("status", ["new", "reviewing", "quoted", "approved", "in_production"])
      .order("created_at", { ascending: false })
      .limit(50),
    admin.from("products").select("*, categories(name, slug)").order("stock"),
    admin.from("order_items").select("name, quantity, line_total").limit(1000),
  ]);

  const orders = (ordersRes.data ?? []) as Order[];
  const requests = (requestsRes.data ?? []) as CustomRequest[];
  const products = (productsRes.data ?? []).map(normaliseProduct);

  const activeOrders = orders.filter((order) => order.status !== "cancelled");
  const revenue = activeOrders.reduce((sum, order) => sum + Number(order.total ?? 0), 0);
  const paidRevenue = activeOrders
    .filter((order) => order.payment_status === "paid")
    .reduce((sum, order) => sum + Number(order.total ?? 0), 0);

  const pendingOrders = orders.filter((order) =>
    ["pending", "confirmed", "in_production"].includes(order.status),
  ).length;

  const lowStock = products.filter((product) => Number(product.stock) <= 3).slice(0, 8);

  const units = new Map<string, { units: number; revenue: number }>();
  for (const item of itemsRes.data ?? []) {
    const key = (item.name as string) ?? "Garment";
    const current = units.get(key) ?? { units: 0, revenue: 0 };
    current.units += Number(item.quantity ?? 0);
    current.revenue += Number(item.line_total ?? 0);
    units.set(key, current);
  }

  const topProducts = [...units.entries()]
    .map(([name, value]) => ({ name, ...value }))
    .sort((a, b) => b.units - a.units)
    .slice(0, 5);

  const monthlyRevenue = buildMonthlyRevenue(orders);

  return {
    revenue,
    paidRevenue,
    orderCount: orders.length,
    pendingOrders,
    openRequests: requests.length,
    lowStock,
    productCount: products.length,
    publishedCount: products.filter((product) => product.is_published).length,
    recentOrders: orders.slice(0, 6),
    recentRequests: requests.slice(0, 5),
    topProducts,
    monthlyRevenue,
  };
}

function buildMonthlyRevenue(orders: Order[]) {
  const buckets = new Map<string, number>();
  const now = new Date();
  for (let index = 5; index >= 0; index -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - index, 1);
    buckets.set(
      new Intl.DateTimeFormat("en-IN", { month: "short" }).format(date),
      0,
    );
  }
  for (const order of orders) {
    if (order.status === "cancelled") continue;
    const date = new Date(order.created_at);
    if (Number.isNaN(date.getTime())) continue;
    const label = new Intl.DateTimeFormat("en-IN", { month: "short" }).format(date);
    if (buckets.has(label)) buckets.set(label, (buckets.get(label) ?? 0) + Number(order.total ?? 0));
  }
  return [...buckets.entries()].map(([label, value]) => ({ label, value }));
}
