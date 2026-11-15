import { APP_NAME, CATEGORIES } from "@patipaket/shared";
import Link from "next/link";
import { productsHref } from "@/lib/routes";
import { Icon } from "./icons";
import { Logo } from "./site-header";

const ACCOUNT_LINKS = [
  { href: "/hesap/abonelikler", label: "Aboneliklerim" },
  { href: "/hesap/siparisler", label: "Siparişlerim" },
  { href: "/hesap/adresler", label: "Adreslerim" },
  { href: "/hesap/dostlarim", label: "Dostlarım" },
];

const HELP_LINKS = [
  { href: "/#nasil-calisir", label: "Nasıl çalışır?" },
  { href: "/#sss", label: "Sık sorulan sorular" },
  { href: "/gizlilik", label: "Gizlilik ve KVKK" },
  { href: "/mesafeli-satis", label: "Mesafeli satış sözleşmesi" },
];

function Column({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-bold tracking-[0.1em] text-white/50 uppercase">{title}</p>
      <ul className="mt-4 space-y-2.5 text-sm">{children}</ul>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link href={href} className="text-white/80 transition hover:text-white">
        {children}
      </Link>
    </li>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-24 bg-brand-900 text-white">
      <div className="container-page grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Logo light />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/70">
            Kedi, köpek ve kuşunuzun maması, kumu ve sarf malzemeleri; sizin belirlediğiniz sıklıkta kapınızda.
          </p>
          <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold text-white/85">
            <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5">
              <Icon name="truck" className="h-4 w-4" /> Ücretsiz kargo
            </span>
            <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5">
              <Icon name="shield" className="h-4 w-4" /> Taahhütsüz
            </span>
          </div>
        </div>

        <Column title="Alışveriş">
          {CATEGORIES.map((category) => (
            <FooterLink key={category.label} href={productsHref({ species: category.species, type: category.type })}>
              {category.label}
            </FooterLink>
          ))}
        </Column>

        <Column title="Hesabım">
          {ACCOUNT_LINKS.map((link) => (
            <FooterLink key={link.href} href={link.href}>
              {link.label}
            </FooterLink>
          ))}
        </Column>

        <Column title="Yardım">
          {HELP_LINKS.map((link) => (
            <FooterLink key={link.href} href={link.href}>
              {link.label}
            </FooterLink>
          ))}
        </Column>
      </div>
      <div className="border-t border-white/10">
        <div className="container-page flex flex-col gap-2 py-5 text-xs text-white/55 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {APP_NAME}. Tüm hakları saklıdır.
          </p>
          <p>iOS ve Android uygulamasıyla aboneliğinizi cebinizden yönetin.</p>
        </div>
      </div>
    </footer>
  );
}
