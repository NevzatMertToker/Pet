import Link from "next/link";
import { SpeciesArt } from "@/components/product-art";

export default function NotFound() {
  return (
    <div className="container-page flex flex-col items-center py-20 text-center">
      <div className="h-40 w-40 overflow-hidden rounded-[2.5rem] shadow-lift ring-4 ring-white">
        <SpeciesArt species="cat" />
      </div>
      <p className="mt-8 text-sm font-bold tracking-[0.12em] text-brand-600 uppercase">404</p>
      <h1 className="mt-2 text-4xl font-semibold">Bu sayfayı bulamadık</h1>
      <p className="mt-3 max-w-md text-ink/60">
        Aradığınız sayfa taşınmış ya da hiç var olmamış olabilir. Kediler bazen bir şeyleri masadan düşürür.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/" className="btn btn-primary">
          Ana sayfaya dön
        </Link>
        <Link href="/urunler" className="btn btn-outline">
          Ürünlere göz at
        </Link>
      </div>
    </div>
  );
}
