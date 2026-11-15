import { SPECIES_LABELS, categoryLabel, intervalLabel } from "@patipaket/shared";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/icons";
import { ProductArt } from "@/components/product-art";
import { ProductGrid } from "@/components/product-card";
import { PurchaseBox } from "@/components/purchase-box";
import { productsHref } from "@/lib/routes";
import { getProductBySlug, listProducts } from "@/server/services/catalog";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Ürün bulunamadı" };
  return {
    title: product.brand + " " + product.name + " " + product.packageSize,
    description: product.description,
  };
}

export default async function ProductPage({ params }: { params: Params }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const related = (await listProducts({ species: product.species, type: product.type }))
    .filter((item) => item.id !== product.id)
    .slice(0, 4);

  return (
    <div className="container-page py-10">
      <nav className="flex flex-wrap items-center gap-1.5 text-sm text-ink/50" aria-label="Sayfa yolu">
        <Link href="/" className="hover:text-ink">
          Ana sayfa
        </Link>
        <Icon name="chevron-right" className="h-3.5 w-3.5" />
        <Link href={productsHref({ species: product.species })} className="hover:text-ink">
          {SPECIES_LABELS[product.species]}
        </Link>
        <Icon name="chevron-right" className="h-3.5 w-3.5" />
        <Link href={productsHref({ species: product.species, type: product.type })} className="hover:text-ink">
          {categoryLabel(product.species, product.type)}
        </Link>
      </nav>

      <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_1.05fr] lg:gap-14">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <div className="aspect-square overflow-hidden rounded-[2.25rem] shadow-soft ring-1 ring-ink/5">
            <ProductArt product={product} alt={product.brand + " " + product.name} />
          </div>
        </div>

        <div>
          <p className="text-sm font-bold tracking-[0.1em] text-brand-600 uppercase">{product.brand}</p>
          <h1 className="mt-2 text-3xl leading-tight font-semibold sm:text-4xl">{product.name}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="badge badge-muted">{product.packageSize}</span>
            <span className="badge badge-muted">{categoryLabel(product.species, product.type)}</span>
            {product.suggestedIntervalWeeks && (
              <span className="badge badge-brand">
                <Icon name="clock" className="h-3.5 w-3.5" />
                Ortalama {intervalLabel(product.suggestedIntervalWeeks).toLocaleLowerCase("tr")} biter
              </span>
            )}
          </div>
          <p className="mt-5 leading-relaxed text-ink/70">{product.description}</p>

          <div className="mt-8">
            <PurchaseBox product={product} />
          </div>

          <dl className="mt-8 grid gap-3 sm:grid-cols-3">
            {[
              { icon: "truck" as const, title: "Kapına teslim", text: "Abonelik siparişlerinde kargo ücretsiz" },
              { icon: "repeat" as const, title: "Esnek abonelik", text: "Sıklığı ve tarihi dilediğin an değiştir" },
              { icon: "shield" as const, title: "Güvenli ödeme", text: "Kart bilgilerin bizde saklanmaz" },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl bg-sand/70 p-4">
                <Icon name={item.icon} className="h-5 w-5 text-brand-700" />
                <dt className="mt-2 text-sm font-semibold">{item.title}</dt>
                <dd className="mt-0.5 text-[13px] leading-snug text-ink/60">{item.text}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {related.length > 0 && (
        <section className="pt-20">
          <h2 className="section-title">Benzer ürünler</h2>
          <div className="mt-6">
            <ProductGrid products={related} />
          </div>
        </section>
      )}
    </div>
  );
}
