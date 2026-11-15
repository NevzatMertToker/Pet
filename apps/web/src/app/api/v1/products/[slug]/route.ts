import { notFound } from "@/server/errors";
import { route } from "@/server/http";
import { getProductBySlug } from "@/server/services/catalog";

export const GET = route(async (_request, context: { params: Promise<{ slug: string }> }) => {
  const { slug } = await context.params;
  const product = await getProductBySlug(slug);
  if (!product) throw notFound("Ürün bulunamadı.");
  return { product };
});
