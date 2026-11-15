import { productListSchema } from "@patipaket/shared";
import { parseInput, route } from "@/server/http";
import { listProducts } from "@/server/services/catalog";

export const GET = route(async (request) => {
  const query = new URL(request.url).searchParams;
  const params = parseInput(productListSchema, {
    species: query.get("species") || undefined,
    type: query.get("type") || undefined,
    q: query.get("q") || undefined,
    sort: query.get("sort") || undefined,
    featured: query.get("featured") === "true" ? true : undefined,
  });
  return { products: await listProducts(params) };
});
