import type { Metadata } from "next";
import { AdminNav } from "@/components/admin-nav";
import { requireAdminUser } from "@/lib/session";

export const metadata: Metadata = { title: "Yönetim paneli", robots: { index: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdminUser();
  return (
    <div className="container-page py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold tracking-[0.12em] text-brand-600 uppercase">Mağaza yönetimi</p>
          <h1 className="mt-1 text-3xl font-semibold">Yönetim paneli</h1>
        </div>
        <AdminNav />
      </div>
      <div className="mt-8">{children}</div>
    </div>
  );
}
