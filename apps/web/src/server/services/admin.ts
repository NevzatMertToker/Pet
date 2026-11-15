import {
  ORDER_STATUSES,
  PRODUCT_TYPES,
  SPECIES,
  addDays,
  todayInTurkey,
  type Order,
  type OrderStatus,
  type Product,
} from "@patipaket/shared";
import { and, asc, count, desc, eq, gte, inArray, lte, sql, sum } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "../db";
import { orders, products, subscriptions, users } from "../db/schema";
import { conflict, notFound } from "../errors";
import { isUuid, toOrder, toProduct } from "../mappers";
import { restoreOrderStock } from "./orders";

/** Geliri sayılan (tahsil edilmiş) sipariş durumları. */
const REVENUE_STATUSES: OrderStatus[] = ["paid", "preparing", "shipped", "delivered"];

export interface AdminStats {
  activeSubscriptions: number;
  pausedSubscriptions: number;
  renewalsNext7Days: number;
  ordersToFulfil: number;
  ordersLast30Days: number;
  revenueLast30Days: number;
  customers: number;
  lowStock: Product[];
}

export async function getAdminStats(today: string = todayInTurkey()): Promise<AdminStats> {
  const db = getDb();
  const since = new Date(Date.now() - 30 * 86_400_000);

  const [subscriptionCounts, [renewals], [toFulfil], [recent], [customers], lowStock] = await Promise.all([
    db.select({ status: subscriptions.status, total: count() }).from(subscriptions).groupBy(subscriptions.status),
    db
      .select({ total: count() })
      .from(subscriptions)
      .where(and(eq(subscriptions.status, "active"), lte(subscriptions.nextDeliveryDate, addDays(today, 7)))),
    db
      .select({ total: count() })
      .from(orders)
      .where(inArray(orders.status, ["paid", "preparing"])),
    db
      .select({ total: count(), revenue: sum(orders.total) })
      .from(orders)
      .where(and(inArray(orders.status, REVENUE_STATUSES), gte(orders.createdAt, since))),
    db.select({ total: count() }).from(users).where(eq(users.role, "customer")),
    db
      .select()
      .from(products)
      .where(and(eq(products.isActive, true), lte(products.stock, 10)))
      .orderBy(asc(products.stock))
      .limit(8),
  ]);

  const byStatus = new Map(subscriptionCounts.map((row) => [row.status, row.total]));
  return {
    activeSubscriptions: byStatus.get("active") ?? 0,
    pausedSubscriptions: byStatus.get("paused") ?? 0,
    renewalsNext7Days: renewals.total,
    ordersToFulfil: toFulfil.total,
    ordersLast30Days: recent.total,
    revenueLast30Days: Number(recent.revenue ?? 0),
    customers: customers.total,
    lowStock: lowStock.map(toProduct),
  };
}

export interface AdminOrder extends Order {
  customerName: string;
  customerEmail: string;
}

export async function listAllOrders(status?: OrderStatus): Promise<AdminOrder[]> {
  const rows = await getDb().query.orders.findMany({
    where: status ? eq(orders.status, status) : undefined,
    with: { items: true, user: true },
    orderBy: [desc(orders.createdAt)],
    limit: 200,
  });
  return rows.map((row) => ({
    ...toOrder(row, row.items),
    customerName: row.user.name,
    customerEmail: row.user.email,
  }));
}

export const orderUpdateSchema = z.object({
  status: z.enum(ORDER_STATUSES),
  trackingNumber: z.string().trim().max(60).optional(),
});

export async function updateOrderStatus(id: string, input: z.infer<typeof orderUpdateSchema>): Promise<void> {
  if (!isUuid(id)) throw notFound("Sipariş bulunamadı.");
  await getDb().transaction(async (tx) => {
    const [current] = await tx.select().from(orders).where(eq(orders.id, id)).for("update");
    if (!current) throw notFound("Sipariş bulunamadı.");
    if (current.status === "cancelled" || current.status === "payment_failed") {
      throw conflict("İptal edilmiş veya ödemesi alınamamış sipariş güncellenemez.");
    }
    // İptalde ayrılmış stok rafa döner. Para iadesi ödeme sağlayıcısının panelinden yapılır.
    if (input.status === "cancelled") await restoreOrderStock(tx, id);
    await tx
      .update(orders)
      .set({ status: input.status, trackingNumber: input.trackingNumber || current.trackingNumber })
      .where(eq(orders.id, id));
  });
}

export async function listAllProducts(): Promise<Product[]> {
  const rows = await getDb()
    .select()
    .from(products)
    .orderBy(asc(products.species), asc(products.type), asc(products.name));
  return rows.map(toProduct);
}

export const productInputSchema = z.object({
  name: z.string().trim().min(2, "Ürün adı girin").max(120),
  brand: z.string().trim().min(1, "Marka girin").max(60),
  description: z.string().trim().min(10, "Açıklama en az 10 karakter olmalı").max(2000),
  species: z.enum(SPECIES),
  type: z.enum(PRODUCT_TYPES),
  packageSize: z.string().trim().min(1, "Paket boyutu girin (örn. 10 kg)").max(40),
  /** Kuruş */
  price: z.number().int().min(100, "Fiyat en az 1 TL olmalı").max(100_000_00),
  compareAtPrice: z.number().int().min(100).max(100_000_00).nullable(),
  imageUrl: z.string().trim().url("Geçerli bir görsel adresi girin").max(500).nullable(),
  stock: z.number().int().min(0, "Stok negatif olamaz").max(1_000_000),
  subscribable: z.boolean(),
  suggestedIntervalWeeks: z.number().int().min(1).max(52).nullable(),
  isFeatured: z.boolean(),
  isActive: z.boolean(),
});
export type ProductInput = z.infer<typeof productInputSchema>;

const TURKISH_MAP: Record<string, string> = {
  ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u", â: "a", î: "i", û: "u",
};

export function slugify(text: string): string {
  return text
    .toLocaleLowerCase("tr")
    .replace(/[çğıöşüâîû]/g, (char) => TURKISH_MAP[char] ?? char)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export async function createProduct(input: ProductInput): Promise<Product> {
  const db = getDb();
  const base = slugify([input.brand, input.name, input.packageSize].join(" ")) || "urun";
  let slug = base;
  for (let attempt = 2; attempt < 50; attempt++) {
    const [taken] = await db.select({ id: products.id }).from(products).where(eq(products.slug, slug));
    if (!taken) break;
    slug = base + "-" + attempt;
  }
  const [row] = await db.insert(products).values({ ...input, slug }).returning();
  return toProduct(row);
}

export async function updateProduct(id: string, input: ProductInput): Promise<Product> {
  if (!isUuid(id)) throw notFound("Ürün bulunamadı.");
  const [row] = await getDb().update(products).set(input).where(eq(products.id, id)).returning();
  if (!row) throw notFound("Ürün bulunamadı.");
  return toProduct(row);
}

export async function getProductById(id: string): Promise<Product | null> {
  if (!isUuid(id)) return null;
  const [row] = await getDb().select().from(products).where(eq(products.id, id));
  return row ? toProduct(row) : null;
}

export interface AdminSubscription {
  id: string;
  status: "active" | "paused" | "cancelled";
  intervalWeeks: number;
  nextDeliveryDate: string;
  customerName: string;
  customerEmail: string;
  itemCount: number;
  lastRenewalError: string | null;
}

export async function listAllSubscriptions(): Promise<AdminSubscription[]> {
  const rows = await getDb().query.subscriptions.findMany({
    with: { user: true, items: true },
    orderBy: [sql`${subscriptions.status} asc`, asc(subscriptions.nextDeliveryDate)],
    limit: 300,
  });
  return rows.map((row) => ({
    id: row.id,
    status: row.status,
    intervalWeeks: row.intervalWeeks,
    nextDeliveryDate: row.nextDeliveryDate,
    customerName: row.user.name,
    customerEmail: row.user.email,
    itemCount: row.items.reduce((total, item) => total + item.quantity, 0),
    lastRenewalError: row.lastRenewalError,
  }));
}
