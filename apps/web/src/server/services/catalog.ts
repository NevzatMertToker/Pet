import {
  MAX_QUANTITY_PER_LINE,
  computeQuote,
  type CartLine,
  type Product,
  type ProductListParams,
  type Quote,
  type QuoteIssue,
} from "@patipaket/shared";
import { and, asc, desc, eq, gte, ilike, inArray, or, sql, type SQL } from "drizzle-orm";
import { getDb, type DbExecutor } from "../db";
import { products } from "../db/schema";
import { conflict } from "../errors";
import { toProduct, type ProductRow } from "../mappers";

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (char) => "\\" + char);
}

export async function listProducts(
  params: ProductListParams = {},
  options: { includeInactive?: boolean } = {},
): Promise<Product[]> {
  const filters: (SQL | undefined)[] = [];
  if (!options.includeInactive) filters.push(eq(products.isActive, true));
  if (params.species) filters.push(eq(products.species, params.species));
  if (params.type) filters.push(eq(products.type, params.type));
  if (params.featured) filters.push(eq(products.isFeatured, true));
  if (params.q) {
    const pattern = "%" + escapeLike(params.q) + "%";
    filters.push(
      or(ilike(products.name, pattern), ilike(products.brand, pattern), ilike(products.description, pattern)),
    );
  }

  const orderBy =
    params.sort === "price_asc"
      ? [asc(products.price), asc(products.name)]
      : params.sort === "price_desc"
        ? [desc(products.price), asc(products.name)]
        : params.sort === "name"
          ? [asc(products.name)]
          : [desc(products.isFeatured), asc(products.name)];

  const rows = await getDb()
    .select()
    .from(products)
    .where(and(...filters))
    .orderBy(...orderBy);
  return rows.map(toProduct);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const [row] = await getDb()
    .select()
    .from(products)
    .where(and(eq(products.slug, slug), eq(products.isActive, true)));
  return row ? toProduct(row) : null;
}

export interface PricedLine {
  product: ProductRow;
  quantity: number;
  intervalWeeks: number | null;
}

export interface QuoteResult {
  quote: Quote;
  issues: QuoteIssue[];
  priced: PricedLine[];
}

/**
 * Sepeti güncel fiyat ve stokla fiyatlar. İstemcinin gönderdiği fiyatlara asla
 * güvenilmez; yalnızca ürün kimliği, adet ve sıklık alınır.
 */
export async function buildQuote(lines: CartLine[], executor: DbExecutor = getDb()): Promise<QuoteResult> {
  const merged = new Map<string, CartLine>();
  for (const line of lines) {
    const key = line.productId + ":" + (line.intervalWeeks ?? 0);
    const existing = merged.get(key);
    if (existing) {
      existing.quantity = Math.min(existing.quantity + line.quantity, MAX_QUANTITY_PER_LINE);
    } else {
      merged.set(key, { ...line });
    }
  }

  const ids = [...new Set([...merged.values()].map((line) => line.productId))];
  const rows = ids.length ? await executor.select().from(products).where(inArray(products.id, ids)) : [];
  const byId = new Map(rows.map((row) => [row.id, row]));
  const remaining = new Map(rows.map((row) => [row.id, row.stock]));

  const issues: QuoteIssue[] = [];
  const priced: PricedLine[] = [];

  for (const line of merged.values()) {
    const product = byId.get(line.productId);
    if (!product) {
      issues.push({
        productId: line.productId,
        reason: "not_found",
        message: "Sepetinizdeki bir ürün artık satışta değil.",
      });
      continue;
    }
    if (!product.isActive) {
      issues.push({ productId: product.id, reason: "inactive", message: product.name + " artık satışta değil." });
      continue;
    }

    let intervalWeeks = line.intervalWeeks;
    if (intervalWeeks && !product.subscribable) {
      issues.push({
        productId: product.id,
        reason: "not_subscribable",
        message: product.name + " abonelikle satılmıyor.",
      });
      intervalWeeks = null;
    }

    const left = remaining.get(product.id) ?? 0;
    let quantity = line.quantity;
    if (left < quantity) {
      issues.push({
        productId: product.id,
        reason: "out_of_stock",
        availableStock: left,
        message:
          left === 0
            ? product.name + " stokta kalmadı."
            : product.name + " için stokta yalnızca " + left + " adet var.",
      });
      quantity = left;
    }
    if (quantity <= 0) continue;

    remaining.set(product.id, left - quantity);
    priced.push({ product, quantity, intervalWeeks });
  }

  const quote = computeQuote(
    priced.map((line) => ({
      product: toProduct(line.product),
      quantity: line.quantity,
      intervalWeeks: line.intervalWeeks,
    })),
  );
  return { quote, issues, priced };
}

/** Ürün başına toplam adet (aynı ürün hem tek seferlik hem abonelik satırında olabilir). */
export function quantitiesByProduct(lines: { productId: string; quantity: number }[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const line of lines) {
    totals.set(line.productId, (totals.get(line.productId) ?? 0) + line.quantity);
  }
  return totals;
}

/**
 * Stoku atomik olarak düşer. "stock >= adet" koşulu UPDATE'in içinde olduğundan
 * eşzamanlı iki sipariş aynı son ürünü alamaz. Kilitlenme (deadlock) olmaması
 * için ürünler her zaman aynı sırayla güncellenir.
 */
export async function reserveStock(executor: DbExecutor, quantities: Map<string, number>): Promise<void> {
  const sorted = [...quantities.entries()].sort(([a], [b]) => a.localeCompare(b));
  for (const [productId, quantity] of sorted) {
    const updated = await executor
      .update(products)
      .set({ stock: sql`${products.stock} - ${quantity}` })
      .where(and(eq(products.id, productId), eq(products.isActive, true), gte(products.stock, quantity)))
      .returning({ id: products.id });
    if (updated.length === 0) {
      throw conflict("Sepetinizdeki bazı ürünlerin stoku az önce tükendi. Lütfen sepetinizi kontrol edin.", "out_of_stock");
    }
  }
}

export async function restoreStock(executor: DbExecutor, quantities: Map<string, number>): Promise<void> {
  const sorted = [...quantities.entries()].sort(([a], [b]) => a.localeCompare(b));
  for (const [productId, quantity] of sorted) {
    await executor
      .update(products)
      .set({ stock: sql`${products.stock} + ${quantity}` })
      .where(eq(products.id, productId));
  }
}
