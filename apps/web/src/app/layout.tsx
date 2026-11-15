import { APP_NAME, APP_TAGLINE } from "@patipaket/shared";
import type { Metadata, Viewport } from "next";
import { DM_Sans, Fredoka } from "next/font/google";
import { CartHydrator } from "@/components/cart-provider";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

// latin-ext: ğ, ş, ı, İ gibi Türkçe harfler için gerekli.
const heading = Fredoka({ variable: "--font-heading", subsets: ["latin", "latin-ext"], display: "swap" });
const body = DM_Sans({ variable: "--font-body", subsets: ["latin", "latin-ext"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: APP_NAME + " — " + APP_TAGLINE,
    template: "%s · " + APP_NAME,
  },
  description:
    "Kedi maması, köpek maması, kuş yemi, kedi kumu ve sarf malzemelerinde abonelikle %10 indirim ve ücretsiz kargo. Dilediğiniz zaman atlayın, duraklatın veya iptal edin.",
  openGraph: {
    type: "website",
    locale: "tr_TR",
    siteName: APP_NAME,
  },
};

export const viewport: Viewport = {
  themeColor: "#185041",
};

// Fiyat ve stok her istekte güncel okunur; sayfalar sunucuda dinamik üretilir.
export const dynamic = "force-dynamic";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className={heading.variable + " " + body.variable + " h-full antialiased"}>
      <body className="flex min-h-full flex-col font-sans">
        <CartHydrator />
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
