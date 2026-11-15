import { addWeeks, todayInTurkey, type CheckoutInput, type CheckoutResult } from "@patipaket/shared";
import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { orders, subscriptionItems, subscriptions } from "../db/schema";
import { conflict, paymentFailed } from "../errors";
import { formatOrderNumber, toAddressSnapshot, toOrder } from "../mappers";
import { notify } from "../notifications";
import { getPaymentProvider } from "../payment";
import { getOwnedAddress, getOwnedPaymentMethod } from "./account";
import { buildQuote, quantitiesByProduct, reserveStock } from "./catalog";
import { insertOrder, restoreOrderStock } from "./orders";
import { getSubscriptionsByIds } from "./subscriptions";

/**
 * Sepeti siparişe çevirir.
 *
 *  1. Fiyat ve stok sunucuda yeniden hesaplanır.
 *  2. Tek transaction içinde stok ayrılır ve sipariş "pending" olarak yazılır.
 *  3. Karttan tahsilat yapılır (transaction dışında — dış servise giderken
 *     veritabanı kilidi tutulmaz).
 *  4. Başarılıysa sipariş "paid" olur ve abonelikler oluşturulur; başarısızsa
 *     stok geri verilir ve sipariş "payment_failed" olarak işaretlenir.
 *
 * Abonelik satırları teslimat sıklığına göre gruplanır: aynı sıklıktaki ürünler
 * tek abonelikte toplanır ve tek pakette gönderilir.
 */
export async function checkout(
  userId: string,
  input: CheckoutInput,
  today: string = todayInTurkey(),
): Promise<CheckoutResult> {
  const db = getDb();
  const address = await getOwnedAddress(db, userId, input.addressId);
  const paymentMethod = await getOwnedPaymentMethod(db, userId, input.paymentMethodId);

  const { quote, issues, priced } = await buildQuote(input.lines);
  if (issues.length > 0) throw conflict(issues[0].message, "cart_changed");
  if (priced.length === 0) throw conflict("Sepetiniz boş.", "cart_empty");

  const stockNeeded = quantitiesByProduct(
    priced.map((line) => ({ productId: line.product.id, quantity: line.quantity })),
  );

  const pending = await db.transaction(async (tx) => {
    await reserveStock(tx, stockNeeded);
    return insertOrder(tx, {
      userId,
      status: "pending",
      quote,
      address: toAddressSnapshot(address),
      paymentMethod,
    });
  });

  const orderNumber = formatOrderNumber(pending.order.orderNumber);
  let charge;
  try {
    charge = await getPaymentProvider().charge({
      token: paymentMethod.providerToken,
      amount: quote.total,
      currency: "TRY",
      description: "Sipariş " + orderNumber,
      idempotencyKey: "order:" + pending.order.id,
    });
  } catch (error) {
    console.error("[ödeme] sağlayıcı hatası", error);
    charge = { ok: false as const, message: "Ödeme şu anda alınamadı. Lütfen biraz sonra tekrar deneyin." };
  }

  if (!charge.ok) {
    await db.transaction(async (tx) => {
      await restoreOrderStock(tx, pending.order.id);
      await tx.update(orders).set({ status: "payment_failed" }).where(eq(orders.id, pending.order.id));
    });
    throw paymentFailed(charge.message);
  }

  const paymentReference = charge.reference;
  const subscriptionIds = await db.transaction(async (tx) => {
    await tx
      .update(orders)
      .set({ status: "paid", paymentReference })
      .where(eq(orders.id, pending.order.id));

    const byInterval = new Map<number, Map<string, number>>();
    for (const line of priced) {
      if (line.intervalWeeks === null) continue;
      const items = byInterval.get(line.intervalWeeks) ?? new Map<string, number>();
      items.set(line.product.id, (items.get(line.product.id) ?? 0) + line.quantity);
      byInterval.set(line.intervalWeeks, items);
    }

    const created: string[] = [];
    for (const [intervalWeeks, items] of byInterval) {
      const [subscription] = await tx
        .insert(subscriptions)
        .values({
          userId,
          intervalWeeks,
          // İlk teslimat bu siparişin kendisidir; bir sonraki, sıklık kadar sonradır.
          nextDeliveryDate: addWeeks(today, intervalWeeks),
          addressId: address.id,
          paymentMethodId: paymentMethod.id,
        })
        .returning({ id: subscriptions.id });
      await tx.insert(subscriptionItems).values(
        [...items].map(([productId, quantity]) => ({
          subscriptionId: subscription.id,
          productId,
          quantity,
        })),
      );
      created.push(subscription.id);
    }
    return created;
  });

  notify({ type: "order_confirmed", userId, orderNumber, total: quote.total });

  return {
    order: toOrder({ ...pending.order, status: "paid", paymentReference }, pending.items),
    subscriptions: await getSubscriptionsByIds(subscriptionIds),
  };
}
