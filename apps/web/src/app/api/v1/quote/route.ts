import { quoteSchema } from "@patipaket/shared";
import { parseBody, route } from "@/server/http";
import { buildQuote } from "@/server/services/catalog";

/** Sepeti güncel fiyat ve stokla fiyatlar; giriş gerektirmez. */
export const POST = route(async (request) => {
  const { lines } = await parseBody(request, quoteSchema);
  const { quote, issues } = await buildQuote(lines);
  return { quote, issues };
});
