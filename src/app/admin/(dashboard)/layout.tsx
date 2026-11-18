import type { ReactNode } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/auth";
import { adminSettings } from "@/lib/admin-data";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await requireAdmin();
  const supabase = createSupabaseAdminClient();

  const [ordersCount, requestsCount, settings] = await Promise.all([
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .in("status", ["pending", "confirmed", "in_production"]),
    supabase
      .from("custom_requests")
      .select("id", { count: "exact", head: true })
      .in("status", ["new", "reviewing", "quoted"]),
    adminSettings(),
  ]);

  return (
    <AdminShell
      brandName={settings?.brand_name ?? "Atelier Brodé"}
      email={user.email ?? "admin"}
      pendingOrders={ordersCount.count ?? 0}
      pendingRequests={requestsCount.count ?? 0}
    >
      {children}
    </AdminShell>
  );
}
