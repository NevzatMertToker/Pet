import type { Metadata } from "next";
import { AccountNav } from "@/components/account-nav";
import { requireCurrentUser } from "@/lib/session";

export const metadata: Metadata = { title: "Hesabım" };

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await requireCurrentUser("/hesap");

  return (
    <div className="container-page grid gap-8 py-10 lg:grid-cols-[240px_1fr]">
      <aside className="lg:sticky lg:top-28 lg:self-start">
        <div className="mb-4 flex items-center gap-3 px-1">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-brand-100 font-display text-lg font-semibold text-brand-800">
            {user.name.trim().charAt(0).toLocaleUpperCase("tr")}
          </span>
          <div className="min-w-0">
            <p className="truncate font-semibold">{user.name}</p>
            <p className="truncate text-[13px] text-ink/55">{user.email}</p>
          </div>
        </div>
        <AccountNav />
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
