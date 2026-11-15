"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api";
import { Icon, type IconName } from "./icons";

const LINKS: { href: string; label: string; icon: IconName; exact?: boolean }[] = [
  { href: "/hesap", label: "Genel bakış", icon: "star", exact: true },
  { href: "/hesap/abonelikler", label: "Aboneliklerim", icon: "repeat" },
  { href: "/hesap/siparisler", label: "Siparişlerim", icon: "package" },
  { href: "/hesap/adresler", label: "Adreslerim", icon: "pin" },
  { href: "/hesap/odeme-yontemleri", label: "Ödeme yöntemlerim", icon: "card" },
  { href: "/hesap/dostlarim", label: "Dostlarım", icon: "heart" },
  { href: "/hesap/profil", label: "Profilim", icon: "user" },
];

export function AccountNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [leaving, setLeaving] = useState(false);

  async function logout() {
    setLeaving(true);
    try {
      await api.auth.logout();
    } finally {
      router.replace("/");
      router.refresh();
    }
  }

  return (
    <nav
      className="flex gap-1.5 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0 [&::-webkit-scrollbar]:hidden"
      aria-label="Hesap menüsü"
    >
      {LINKS.map((link) => {
        const active = link.exact ? pathname === link.href : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={
              "flex shrink-0 items-center gap-2.5 rounded-2xl px-3.5 py-2.5 text-sm font-semibold transition " +
              (active ? "bg-brand-600 text-white shadow-sm" : "text-ink/70 hover:bg-ink/5 hover:text-ink")
            }
          >
            <Icon name={link.icon} className="h-[18px] w-[18px]" />
            {link.label}
          </Link>
        );
      })}
      <button
        type="button"
        onClick={logout}
        disabled={leaving}
        className="flex shrink-0 cursor-pointer items-center gap-2.5 rounded-2xl px-3.5 py-2.5 text-left text-sm font-semibold text-ink/55 transition hover:bg-red-50 hover:text-red-700 lg:mt-2 lg:border-t lg:border-ink/10 lg:pt-4"
      >
        <Icon name="logout" className="h-[18px] w-[18px]" />
        Çıkış yap
      </button>
    </nav>
  );
}
