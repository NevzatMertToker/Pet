import { CATEGORIES } from "@patipaket/shared";
import type { MetadataRoute } from "next";
import { productHref, productsHref } from "@/lib/routes";
import { listProducts } from "@/server/services/catalog";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await listProducts();
  return [
    { url: SITE_URL + "/", changeFrequency: "daily", priority: 1 },
    { url: SITE_URL + "/urunler", changeFrequency: "daily", priority: 0.9 },
    ...CATEGORIES.map((category) => ({
      url: SITE_URL + productsHref({ species: category.species, type: category.type }),
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    ...products.map((product) => ({
      url: SITE_URL + productHref(product.slug),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
