import { APP_NAME, SPECIES, SPECIES_LABELS, SUBSCRIPTION_DISCOUNT_PERCENT } from "@patipaket/shared";
import Link from "next/link";
import { productsHref } from "@/lib/routes";
import { getCurrentUser } from "@/lib/session";
import { CartButton } from "./cart-provider";
import { Icon } from "./icons";
import { PawMark } from "./product-art";

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5" aria-label={APP_NAME + " ana sayfa"}>
      <span className="grid h-10 w-10 place-items-center rounded-2xl bg-brand-600 shadow-sm">
        <PawMark className="h-6 w-6" />
      </span>
      <span className={"font-display text-[22px] font-semibold tracking-tight " + (light ? "text-white" : "text-ink")}>
        Pati<span className={light ? "text-accent-300" : "text-brand-600"}>Paket</span>
      </span>
    </Link>
  );
}

const NAV = [
  ...SPECIES.map((species) => ({ href: productsHref({ species }), label: SPECIES_LABELS[species] })),
  { href: "/urunler", label: "Tüm ürünler" },
  { href: "/#nasil-calisir", label: "Nasıl çalışır?" },
];

export async function SiteHeader() {
  const user = await getCurrentUser();

  return (
    <>
      <div className="bg-brand-800 px-4 py-2 text-center text-[13px] font-medium text-white">
        Abonelikte her teslimatta <span className="font-bold text-accent-300">%{SUBSCRIPTION_DISCOUNT_PERCENT} indirim</span>{" "}
        ve ücretsiz kargo
      </div>
      <header className="sticky top-0 z-40 border-b border-ink/[0.06] bg-cream/90 backdrop-blur-md">
        <div className="container-page flex h-[68px] items-center gap-4">
          <Logo />
          <nav className="ml-6 hidden items-center gap-1 md:flex" aria-label="Ana menü">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full px-3.5 py-2 text-sm font-semibold text-ink/70 transition hover:bg-ink/5 hover:text-ink"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-1">
            {user?.role === "admin" && (
              <Link href="/yonetim" className="btn btn-sm btn-outline hidden sm:inline-flex">
                <Icon name="settings" className="h-4 w-4" />
                Yönetim
              </Link>
            )}
            {user ? (
              <Link
                href="/hesap"
                className="flex h-11 items-center gap-2 rounded-full px-3 text-sm font-semibold text-ink/80 transition hover:bg-ink/5 hover:text-ink"
              >
                <Icon name="user" className="h-[22px] w-[22px]" />
                <span className="hidden max-w-32 truncate sm:inline">{user.name.split(" ")[0]}</span>
              </Link>
            ) : (
              <Link
                href="/giris"
                className="flex h-11 items-center gap-2 rounded-full px-3 text-sm font-semibold text-ink/80 transition hover:bg-ink/5 hover:text-ink"
              >
                <Icon name="user" className="h-[22px] w-[22px]" />
                <span className="hidden sm:inline">Giriş yap</span>
              </Link>
            )}
            <CartButton />
          </div>
        </div>

        <nav
          className="container-page flex gap-2 overflow-x-auto pb-3 md:hidden [&::-webkit-scrollbar]:hidden"
          aria-label="Kategoriler"
        >
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="shrink-0 rounded-full border border-ink/10 bg-white px-3.5 py-1.5 text-[13px] font-semibold text-ink/75"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
    </>
  );
}
