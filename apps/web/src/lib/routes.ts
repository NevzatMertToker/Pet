import type { ProductListParams, ProductType, Species } from "@patipaket/shared";

/** Adres çubuğunda Türkçe, okunaklı parametreler kullanılır: /urunler?hayvan=kedi&kategori=mama */
export const SPECIES_SLUGS: Record<Species, string> = { cat: "kedi", dog: "kopek", bird: "kus" };
export const TYPE_SLUGS: Record<ProductType, string> = { food: "mama", litter: "kum", supplies: "sarf" };

const SORT_SLUGS = {
  featured: "onerilen",
  price_asc: "fiyat-artan",
  price_desc: "fiyat-azalan",
  name: "ad",
} as const;

type Sort = keyof typeof SORT_SLUGS;

function fromSlug<K extends string>(map: Record<K, string>, slug: string | undefined): K | undefined {
  if (!slug) return undefined;
  return (Object.keys(map) as K[]).find((key) => map[key] === slug);
}

export const speciesFromSlug = (slug?: string) => fromSlug(SPECIES_SLUGS, slug);
export const typeFromSlug = (slug?: string) => fromSlug(TYPE_SLUGS, slug);
export const sortFromSlug = (slug?: string) => fromSlug<Sort>(SORT_SLUGS, slug);
export const sortSlug = (sort: Sort) => SORT_SLUGS[sort];

export function productsHref(params: ProductListParams = {}): string {
  const query = new URLSearchParams();
  if (params.species) query.set("hayvan", SPECIES_SLUGS[params.species]);
  if (params.type) query.set("kategori", TYPE_SLUGS[params.type]);
  if (params.q) query.set("ara", params.q);
  if (params.sort && params.sort !== "featured") query.set("sirala", SORT_SLUGS[params.sort]);
  const text = query.toString();
  return text ? "/urunler?" + text : "/urunler";
}

export const productHref = (slug: string) => "/urunler/" + slug;

/** Giriş sonrası yalnızca site içi adreslere yönlendirilir (açık yönlendirme engeli). */
export function safeRedirectPath(value: string | string[] | undefined, fallback = "/hesap"): string {
  const path = Array.isArray(value) ? value[0] : value;
  if (!path || !path.startsWith("/") || path.startsWith("//") || path.includes("\\")) return fallback;
  return path;
}
