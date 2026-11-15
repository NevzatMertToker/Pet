import {
  CATEGORIES,
  PRODUCT_TYPES,
  PRODUCT_TYPE_LABELS,
  SPECIES,
  SPECIES_LABELS,
  categoryLabel,
  type ProductListParams,
} from "@patipaket/shared";
import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { ProductGrid } from "@/components/product-card";
import { EmptyState } from "@/components/ui";
import {
  SPECIES_SLUGS,
  TYPE_SLUGS,
  productsHref,
  sortFromSlug,
  speciesFromSlug,
  typeFromSlug,
} from "@/lib/routes";
import { listProducts } from "@/server/services/catalog";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const SORTS: { value: NonNullable<ProductListParams["sort"]>; label: string }[] = [
  { value: "featured", label: "Önerilen" },
  { value: "price_asc", label: "Fiyat: artan" },
  { value: "price_desc", label: "Fiyat: azalan" },
  { value: "name", label: "A–Z" },
];

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

async function readParams(searchParams: SearchParams): Promise<ProductListParams> {
  const query = await searchParams;
  return {
    species: speciesFromSlug(first(query.hayvan)),
    type: typeFromSlug(first(query.kategori)),
    q: first(query.ara)?.trim().slice(0, 80) || undefined,
    sort: sortFromSlug(first(query.sirala)) ?? "featured",
  };
}

function titleFor(params: ProductListParams): string {
  if (params.species && params.type) return categoryLabel(params.species, params.type);
  if (params.species) return SPECIES_LABELS[params.species] + " Ürünleri";
  if (params.type) return PRODUCT_TYPE_LABELS[params.type];
  return "Tüm Ürünler";
}

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const params = await readParams(searchParams);
  return { title: params.q ? "“" + params.q + "” araması" : titleFor(params) };
}

function Chip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={
        "shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition " +
        (active
          ? "border-brand-600 bg-brand-600 text-white"
          : "border-ink/12 bg-white text-ink/70 hover:border-ink/30 hover:text-ink")
      }
    >
      {children}
    </Link>
  );
}

export default async function ProductsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await readParams(searchParams);
  const products = await listProducts(params);

  // Köpek kumu gibi var olmayan kombinasyonlar için kategori çipi gösterilmez.
  const availableTypes = PRODUCT_TYPES.filter(
    (type) => !params.species || CATEGORIES.some((c) => c.species === params.species && c.type === type),
  );

  return (
    <div className="container-page py-10">
      <nav className="flex items-center gap-1.5 text-sm text-ink/50" aria-label="Sayfa yolu">
        <Link href="/" className="hover:text-ink">
          Ana sayfa
        </Link>
        <Icon name="chevron-right" className="h-3.5 w-3.5" />
        <span className="font-medium text-ink/80">{titleFor(params)}</span>
      </nav>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-semibold">{params.q ? "“" + params.q + "”" : titleFor(params)}</h1>
          <p className="mt-1.5 text-ink/60">{products.length} ürün · abonelikte %10 indirim ve ücretsiz kargo</p>
        </div>
        <form action="/urunler" className="relative w-full sm:w-80" role="search">
          {params.species && <input type="hidden" name="hayvan" value={SPECIES_SLUGS[params.species]} />}
          {params.type && <input type="hidden" name="kategori" value={TYPE_SLUGS[params.type]} />}
          <Icon name="search" className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-ink/40" />
          <input
            type="search"
            name="ara"
            defaultValue={params.q}
            placeholder="Ürün veya marka ara"
            aria-label="Ürün ara"
            className="input rounded-full pl-10"
          />
        </form>
      </div>

      <div className="mt-7 space-y-3">
        <div className="flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden">
          <Chip href={productsHref({ ...params, species: undefined, type: undefined })} active={!params.species}>
            Tümü
          </Chip>
          {SPECIES.map((species) => (
            <Chip
              key={species}
              href={productsHref({
                ...params,
                species,
                // Seçili kategori yeni türde yoksa (ör. köpek kumu) sıfırlanır.
                type: CATEGORIES.some((c) => c.species === species && c.type === params.type) ? params.type : undefined,
              })}
              active={params.species === species}
            >
              {SPECIES_LABELS[species]}
            </Chip>
          ))}
          <span className="mx-1 w-px shrink-0 self-stretch bg-ink/10" />
          {availableTypes.map((type) => (
            <Chip
              key={type}
              href={productsHref({ ...params, type: params.type === type ? undefined : type })}
              active={params.type === type}
            >
              {params.species ? categoryLabel(params.species, type) : PRODUCT_TYPE_LABELS[type]}
            </Chip>
          ))}
        </div>

        <div className="flex items-center gap-1 overflow-x-auto text-sm [&::-webkit-scrollbar]:hidden">
          <span className="mr-1 shrink-0 text-ink/50">Sırala:</span>
          {SORTS.map((sort) => (
            <Link
              key={sort.value}
              href={productsHref({ ...params, sort: sort.value })}
              className={
                "shrink-0 rounded-full px-3 py-1.5 font-semibold transition " +
                (params.sort === sort.value ? "bg-ink text-white" : "text-ink/60 hover:bg-ink/5 hover:text-ink")
              }
            >
              {sort.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-8">
        {products.length > 0 ? (
          <ProductGrid products={products} />
        ) : (
          <EmptyState
            icon="search"
            title="Aradığınız ürünü bulamadık"
            text="Farklı bir arama yapmayı ya da filtreleri temizlemeyi deneyin."
            action={
              <Link href="/urunler" className="btn btn-primary">
                Tüm ürünleri göster
              </Link>
            }
          />
        )}
      </div>
    </div>
  );
}
