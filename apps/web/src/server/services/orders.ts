import { maskedCard, type AddressSnapshot, type Order, type OrderStatus, type Quote } from "@patipaket/shared";
import { and, desc, eq, lt } from "drizzle-orm";
import { getDb, type DbExecutor } from "../db";
import { orderItems, orders } from "../db/schema";
import { notFound } from "../errors";
import { isUuid, toOrder, type OrderItemRow, type OrderRow, type PaymentMethodRow } from "../mappers";
import { quantitiesByProduct, restoreStock } from "./catalog";

export interface NewOrder {
  userId: string;
  status: OrderStatus;
  quote: Quote;
  address: AddressSnapshot;
  paymentMethod: PaymentMethodRow;
  paymentReference?: string | null;
  subscriptionId?: string | null;
}

export async function insertOrder(
  executor: DbExecutor,
  input: NewOrder,
): Promise<{ order: OrderRow; items: OrderItemRow[] }> {
  const { quote } = input;
  const [order] = await executor
    .insert(orders)
    .values({
      userId: input.userId,
      status: input.status,
      subtotal: quote.subtotal,
      discount: quote.subscriptionDiscount,
      shipping: quote.shipping,
      total: quote.total,
      address: input.address,
      paymentMethodId: input.paymentMethod.id,
      paymentSummary: maskedCard(input.paymentMethod.brand, input.paymentMethod.last4),
      paymentReference: input.paymentReference ?? null,
      subscriptionId: input.subscriptionId ?? null,
    })
    .returning();

  const items = await executor
    .insert(orderItems)
    .values(
      quote.lines.map((line) => ({
        orderId: order.id,
        productId: line.productId,
        name: line.brand + " " + line.name,
        packageSize: line.packageSize,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        lineTotal: line.lineTotal,
        isSubscription: line.intervalWeeks !== null,
      })),
    )
    .returning();

  return { order, items };
}

export async function listOrders(userId: string): Promise<Order[]> {
  const rows = await getDb().query.orders.findMany({
    where: eq(orders.userId, userId),
    with: { items: true },
    orderBy: [desc(orders.createdAt)],
    limit: 100,
  });
  return rows.map((row) => toOrder(row, row.items));
}

export async function getOrder(userId: string, id: string): Promise<Order> {
  if (!isUuid(id)) throw notFound("Sipariş bulunamadı.");
  const row = await getDb().query.orders.findFirst({
    where: and(eq(orders.id, id), eq(orders.userId, userId)),
    with: { items: true },
  });
  if (!row) throw notFound("Sipariş bulunamadı.");
  return toOrder(row, row.items);
}

/** Siparişteki ürünlerin stokunu geri verir (iptal / başarısız ödeme). */
export async function restoreOrderStock(executor: DbExecutor, orderId: string): Promise<void> {
  const items = await executor.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  const lines = items.flatMap((item) =>
    item.productId ? [{ productId: item.productId, quantity: item.quantity }] : [],
  );
  await restoreStock(executor, quantitiesByProduct(lines));
}

/**
 * Ödeme adımında yarıda kalmış (ör. sunucu yeniden başladı) siparişleri iptal edip
 * ayrılan stoku serbest bırakır. Zamanlanmış görev tarafından çağrılır.
 */
export async function releaseStalePendingOrders(olderThanMinutes = 30): Promise<number> {
  const cutoff = new Date(Date.now() - olderThanMinutes * 60_000);
  const db = getDb();
  const stale = await db
    .select({ id: orders.id })
    .from(orders)
    .where(and(eq(orders.status, "pending"), lt(orders.createdAt, cutoff)));

  let released = 0;
  for (const { id } of stale) {
    await db.transaction(async (tx) => {
      const [locked] = await tx
        .select({ id: orders.id })
        .from(orders)
        .where(and(eq(orders.id, id), eq(orders.status, "pending")))
        .for("update", { skipLocked: true });
      if (!locked) return;
      await restoreOrderStock(tx, id);
      await tx.update(orders).set({ status: "cancelled" }).where(eq(orders.id, id));
      released += 1;
    });
  }
  return released;
}
