"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "./icons";

const LINKS: { href: string; label: string; icon: IconName; exact?: boolean }[] = [
  { href: "/yonetim", label: "Özet", icon: "chart", exact: true },
  { href: "/yonetim/siparisler", label: "Siparişler", icon: "package" },
  { href: "/yonetim/abonelikler", label: "Abonelikler", icon: "repeat" },
  { href: "/yonetim/urunler", label: "Ürünler", icon: "star" },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1.5 overflow-x-auto [&::-webkit-scrollbar]:hidden" aria-label="Yönetim menüsü">
      {LINKS.map((link) => {
        const active = link.exact ? pathname === link.href : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={
              "flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition " +
              (active ? "bg-ink text-white" : "text-ink/65 hover:bg-ink/5 hover:text-ink")
            }
          >
            <Icon name={link.icon} className="h-4 w-4" />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
