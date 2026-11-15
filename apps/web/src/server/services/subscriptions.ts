import { randomUUID } from "node:crypto";
import {
  MAX_FAILED_RENEWALS,
  addDays,
  addWeeks,
  computeQuote,
  subscriptionUnitPrice,
  todayInTurkey,
  type Order,
  type Subscription,
  type SubscriptionAction,
  type SubscriptionItemsInput,
  type SubscriptionUpdateInput,
} from "@patipaket/shared";
import { and, asc, eq, gt, inArray, isNull, lt, lte, or, type SQL } from "drizzle-orm";
import { getDb, type DbExecutor } from "../db";
import {
  addresses,
  orders,
  paymentMethods,
  products,
  subscriptionItems,
  subscriptions,
} from "../db/schema";
import { HttpError, conflict, invalid, notFound, paymentFailed } from "../errors";
import {
  formatOrderNumber,
  isUuid,
  toAddress,
  toAddressSnapshot,
  toOrder,
  toPaymentMethod,
  toProduct,
} from "../mappers";
import { notify } from "../notifications";
import { getPaymentProvider } from "../payment";
import { getOwnedAddress, getOwnedPaymentMethod } from "./account";
import { quantitiesByProduct, reserveStock } from "./catalog";
import { insertOrder } from "./orders";

/** Teslimat tarihi en fazla bu kadar gün ileri atılabilir. */
const MAX_RESCHEDULE_DAYS = 180;

const STATUS_ORDER = { active: 0, paused: 1, cancelled: 2 } as const;

async function loadSubscriptions(executor: DbExecutor, where: SQL | undefined): Promise<Subscription[]> {
  const rows = await executor.query.subscriptions.findMany({
    where,
    with: { items: { with: { product: true } }, address: true, paymentMethod: true },
  });

  return rows
    .map((row): Subscription => {
      const items = row.items
        .map((item) => {
          const unitPrice = subscriptionUnitPrice(item.product.price);
          return {
            id: item.id,
            productId: item.productId,
            name: item.product.name,
            brand: item.product.brand,
            packageSize: item.product.packageSize,
            slug: item.product.slug,
            species: item.product.species,
            type: item.product.type,
            imageUrl: item.product.imageUrl,
            quantity: item.quantity,
            listUnitPrice: item.product.price,
            unitPrice,
            lineTotal: unitPrice * item.quantity,
            available: item.product.isActive && item.product.stock >= item.quantity,
          };
        })
        .sort((a, b) => a.name.localeCompare(b.name, "tr"));

      return {
        id: row.id,
        status: row.status,
        intervalWeeks: row.intervalWeeks,
        nextDeliveryDate: row.nextDeliveryDate,
        address: row.address ? toAddress(row.address) : null,
        paymentMethod: row.paymentMethod ? toPaymentMethod(row.paymentMethod) : null,
        items,
        estimatedTotal: items.filter((item) => item.available).reduce((sum, item) => sum + item.lineTotal, 0),
        pauseReason: row.pauseReason,
        lastRenewalError: row.lastRenewalError,
        createdAt: row.createdAt.toISOString(),
      };
    })
    .sort(
      (a, b) =>
        STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || a.nextDeliveryDate.localeCompare(b.nextDeliveryDate),
    );
}

export async function listSubscriptions(userId: string): Promise<Subscription[]> {
  return loadSubscriptions(getDb(), eq(subscriptions.userId, userId));
}

export async function getSubscription(
  userId: string,
  id: string,
  executor: DbExecutor = getDb(),
): Promise<Subscription> {
  if (!isUuid(id)) throw notFound("Abonelik bulunamadı.");
  const [subscription] = await loadSubscriptions(
    executor,
    and(eq(subscriptions.id, id), eq(subscriptions.userId, userId)),
  );
  if (!subscription) throw notFound("Abonelik bulunamadı.");
  return subscription;
}

export async function getSubscriptionsByIds(ids: string[]): Promise<Subscription[]> {
  if (ids.length === 0) return [];
  return loadSubscriptions(getDb(), inArray(subscriptions.id, ids));
}

/** Satırı kilitleyerek okur; başka kullanıcıya aitse veya yoksa 404. */
async function lockOwnedSubscription(tx: DbExecutor, userId: string, id: string) {
  if (!isUuid(id)) throw notFound("Abonelik bulunamadı.");
  const [row] = await tx
    .select()
    .from(subscriptions)
    .where(and(eq(subscriptions.id, id), eq(subscriptions.userId, userId)))
    .for("update");
  if (!row) throw notFound("Abonelik bulunamadı.");
  return row;
}

export async function updateSubscription(
  userId: string,
  id: string,
  input: SubscriptionUpdateInput,
  today: string = todayInTurkey(),
): Promise<Subscription> {
  await getDb().transaction(async (tx) => {
    const current = await lockOwnedSubscription(tx, userId, id);
    if (current.status === "cancelled") throw conflict("İptal edilmiş abonelik değiştirilemez.");

    const changes: Partial<typeof subscriptions.$inferInsert> = {};
    if (input.intervalWeeks !== undefined) changes.intervalWeeks = input.intervalWeeks;
    if (input.nextDeliveryDate !== undefined) {
      if (input.nextDeliveryDate <= today) {
        throw invalid("Teslimat tarihi en erken yarın olabilir.", { nextDeliveryDate: "En erken yarın" });
      }
      if (input.nextDeliveryDate > addDays(today, MAX_RESCHEDULE_DAYS)) {
        throw invalid("Teslimat en fazla 6 ay ileri alınabilir.", { nextDeliveryDate: "En fazla 6 ay sonrası" });
      }
      changes.nextDeliveryDate = input.nextDeliveryDate;
    }
    if (input.addressId !== undefined) {
      changes.addressId = (await getOwnedAddress(tx, userId, input.addressId)).id;
    }
    if (input.paymentMethodId !== undefined) {
      changes.paymentMethodId = (await getOwnedPaymentMethod(tx, userId, input.paymentMethodId)).id;
      // Yeni kartla birlikte önceki başarısız tahsilat geçmişi sıfırlanır.
      changes.failedRenewalCount = 0;
      changes.lastRenewalError = null;
      changes.lastRenewalAttemptDate = null;
    }
    await tx.update(subscriptions).set(changes).where(eq(subscriptions.id, id));
  });
  return getSubscription(userId, id);
}

export async function setSubscriptionItems(
  userId: string,
  id: string,
  input: SubscriptionItemsInput,
): Promise<Subscription> {
  await getDb().transaction(async (tx) => {
    const current = await lockOwnedSubscription(tx, userId, id);
    if (current.status === "cancelled") throw conflict("İptal edilmiş abonelik değiştirilemez.");

    const merged = quantitiesByProduct(input.items);
    const ids = [...merged.keys()];
    const found = await tx.select().from(products).where(inArray(products.id, ids));
    const existingItems = await tx
      .select({ productId: subscriptionItems.productId })
      .from(subscriptionItems)
      .where(eq(subscriptionItems.subscriptionId, id));
    const alreadyIn = new Set(existingItems.map((item) => item.productId));

    for (const productId of ids) {
      const product = found.find((row) => row.id === productId);
      // Abonelikte zaten olan ürün satıştan kalksa bile adedi değiştirilebilir; yeni ürün eklenemez.
      const addable = product && product.isActive && product.subscribable;
      if (!product || (!addable && !alreadyIn.has(productId))) {
        throw invalid("Seçilen ürünlerden biri aboneliğe eklenemiyor.");
      }
    }

    await tx.delete(subscriptionItems).where(eq(subscriptionItems.subscriptionId, id));
    await tx
      .insert(subscriptionItems)
      .values(ids.map((productId) => ({ subscriptionId: id, productId, quantity: merged.get(productId)! })));
  });
  return getSubscription(userId, id);
}

/* ---------------------------------------------------------------- yenileme */

export type RenewalOutcome =
  | { status: "renewed"; orderId: string }
  | { status: "payment_failed"; message: string; paused: boolean }
  | { status: "no_stock" }
  | { status: "skipped" };

class ChargeDeclinedError extends Error {}

/**
 * Tek bir aboneliğin teslimatını oluşturur: stok ayırır, kayıtlı karttan tahsil eder,
 * siparişi yazar ve bir sonraki teslimat tarihini ilerletir.
 *
 * Abonelik satırı kilitlendiği için aynı abonelik iki kez (ör. üst üste binen iki
 * zamanlanmış çalıştırma) işlenemez. Stok düşümü ve sipariş bir "savepoint" içindedir;
 * tahsilat reddedilirse bunlar geri alınır ama başarısızlık kaydı kalır.
 */
export async function renewSubscription(
  subscriptionId: string,
  today: string = todayInTurkey(),
  options: { manual?: boolean } = {},
): Promise<RenewalOutcome> {
  const manual = options.manual === true;

  return getDb().transaction(async (tx): Promise<RenewalOutcome> => {
    const [sub] = await tx
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.id, subscriptionId))
      .for("update", { skipLocked: true });
    if (!sub || sub.status !== "active") return { status: "skipped" };
    if (!manual && (sub.nextDeliveryDate > today || sub.lastRenewalAttemptDate === today)) {
      return { status: "skipped" };
    }

    const rows = await tx
      .select({ item: subscriptionItems, product: products })
      .from(subscriptionItems)
      .innerJoin(products, eq(subscriptionItems.productId, products.id))
      .where(eq(subscriptionItems.subscriptionId, sub.id));
    const available = rows.filter(({ item, product }) => product.isActive && product.stock >= item.quantity);

    const delayForStock = async (): Promise<RenewalOutcome> => {
      await tx
        .update(subscriptions)
        .set({
          nextDeliveryDate: addDays(today, 7),
          lastRenewalAttemptDate: today,
          lastRenewalError: "Abonelikteki ürünler şu anda stokta yok; teslimatınız bir hafta ertelendi.",
        })
        .where(eq(subscriptions.id, sub.id));
      notify({ type: "subscription_delayed_no_stock", userId: sub.userId, subscriptionId: sub.id });
      return { status: "no_stock" };
    };
    if (available.length === 0) return delayForStock();

    const [address] = await tx.select().from(addresses).where(eq(addresses.id, sub.addressId));
    const [method] = await tx.select().from(paymentMethods).where(eq(paymentMethods.id, sub.paymentMethodId));
    const quote = computeQuote(
      available.map(({ item, product }) => ({
        product: toProduct(product),
        quantity: item.quantity,
        intervalWeeks: sub.intervalWeeks,
      })),
    );

    try {
      const created = await tx.transaction(async (savepoint) => {
        await reserveStock(
          savepoint,
          quantitiesByProduct(available.map(({ item }) => ({ productId: item.productId, quantity: item.quantity }))),
        );
        const charge = await getPaymentProvider().charge({
          token: method.providerToken,
          amount: quote.total,
          currency: "TRY",
          description: "Abonelik teslimatı",
          idempotencyKey: manual
            ? ["sub", sub.id, "manual", randomUUID()].join(":")
            : ["sub", sub.id, today].join(":"),
        });
        if (!charge.ok) throw new ChargeDeclinedError(charge.message);
        return insertOrder(savepoint, {
          userId: sub.userId,
          status: "paid",
          quote,
          address: toAddressSnapshot(address),
          paymentMethod: method,
          paymentReference: charge.reference,
          subscriptionId: sub.id,
        });
      });

      await tx
        .update(subscriptions)
        .set({
          nextDeliveryDate: addWeeks(today, sub.intervalWeeks),
          failedRenewalCount: 0,
          lastRenewalAttemptDate: today,
          lastRenewalError: null,
        })
        .where(eq(subscriptions.id, sub.id));
      notify({
        type: "subscription_renewed",
        userId: sub.userId,
        subscriptionId: sub.id,
        orderNumber: formatOrderNumber(created.order.orderNumber),
        total: quote.total,
      });
      return { status: "renewed", orderId: created.order.id };
    } catch (error) {
      if (error instanceof HttpError && error.code === "out_of_stock") return delayForStock();
      if (!(error instanceof ChargeDeclinedError)) throw error;

      if (manual) {
        await tx
          .update(subscriptions)
          .set({ lastRenewalError: error.message })
          .where(eq(subscriptions.id, sub.id));
        return { status: "payment_failed", message: error.message, paused: false };
      }

      const failedRenewalCount = sub.failedRenewalCount + 1;
      const paused = failedRenewalCount >= MAX_FAILED_RENEWALS;
      await tx
        .update(subscriptions)
        .set({
          failedRenewalCount,
          lastRenewalAttemptDate: today,
          lastRenewalError: error.message,
          ...(paused ? { status: "paused" as const, pauseReason: "payment_failed" } : {}),
        })
        .where(eq(subscriptions.id, sub.id));
      notify({
        type: "subscription_payment_failed",
        userId: sub.userId,
        subscriptionId: sub.id,
        message: error.message,
        paused,
      });
      return { status: "payment_failed", message: error.message, paused };
    }
  });
}

export interface RenewalSummary {
  date: string;
  due: number;
  renewed: number;
  paymentFailed: number;
  paused: number;
  delayedForStock: number;
  skipped: number;
  errors: number;
}

/** Teslimat günü gelmiş tüm abonelikleri işler. Günde bir kez (veya daha sık) çağrılır. */
export async function processDueSubscriptions(today: string = todayInTurkey()): Promise<RenewalSummary> {
  const due = await getDb()
    .select({ id: subscriptions.id })
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.status, "active"),
        lte(subscriptions.nextDeliveryDate, today),
        or(isNull(subscriptions.lastRenewalAttemptDate), lt(subscriptions.lastRenewalAttemptDate, today)),
      ),
    )
    .orderBy(asc(subscriptions.nextDeliveryDate))
    .limit(1000);

  const summary: RenewalSummary = {
    date: today,
    due: due.length,
    renewed: 0,
    paymentFailed: 0,
    paused: 0,
    delayedForStock: 0,
    skipped: 0,
    errors: 0,
  };

  for (const { id } of due) {
    try {
      const outcome = await renewSubscription(id, today);
      if (outcome.status === "renewed") summary.renewed += 1;
      else if (outcome.status === "no_stock") summary.delayedForStock += 1;
      else if (outcome.status === "skipped") summary.skipped += 1;
      else {
        summary.paymentFailed += 1;
        if (outcome.paused) summary.paused += 1;
      }
    } catch (error) {
      // Tek bir aboneliğin hatası diğerlerini durdurmamalı.
      summary.errors += 1;
      console.error("[abonelik] yenileme hatası", id, error);
    }
  }
  return summary;
}

/* --------------------------------------------------------------- eylemler */

export async function performSubscriptionAction(
  userId: string,
  id: string,
  action: SubscriptionAction,
  today: string = todayInTurkey(),
): Promise<{ subscription: Subscription; order?: Order }> {
  if (action === "ship-now") {
    const current = await getSubscription(userId, id);
    if (current.status !== "active") {
      throw conflict("Yalnızca aktif abonelikler için hemen gönderim yapılabilir.");
    }
    // Çift tıklama / tekrar gönderimle mükerrer teslimat oluşmasın.
    const [recent] = await getDb()
      .select({ id: orders.id })
      .from(orders)
      .where(and(eq(orders.subscriptionId, id), gt(orders.createdAt, new Date(Date.now() - 10 * 60_000))))
      .limit(1);
    if (recent) throw conflict("Bu abonelik için az önce bir teslimat oluşturuldu.");

    const outcome = await renewSubscription(id, today, { manual: true });
    if (outcome.status === "payment_failed") throw paymentFailed(outcome.message);
    if (outcome.status === "no_stock") {
      throw conflict("Abonelikteki ürünler şu anda stokta yok.", "out_of_stock");
    }
    if (outcome.status === "skipped") throw conflict("Teslimat şu anda oluşturulamadı. Lütfen tekrar deneyin.");

    const row = await getDb().query.orders.findFirst({
      where: eq(orders.id, outcome.orderId),
      with: { items: true },
    });
    return { subscription: await getSubscription(userId, id), order: row ? toOrder(row, row.items) : undefined };
  }

  await getDb().transaction(async (tx) => {
    const current = await lockOwnedSubscription(tx, userId, id);
    if (current.status === "cancelled") throw conflict("Bu abonelik zaten iptal edilmiş.");

    if (action === "pause") {
      if (current.status !== "active") throw conflict("Abonelik zaten duraklatılmış.");
      await tx
        .update(subscriptions)
        .set({ status: "paused", pauseReason: "user" })
        .where(eq(subscriptions.id, id));
    } else if (action === "resume") {
      if (current.status !== "paused") throw conflict("Abonelik zaten aktif.");
      const tomorrow = addDays(today, 1);
      await tx
        .update(subscriptions)
        .set({
          status: "active",
          pauseReason: null,
          failedRenewalCount: 0,
          lastRenewalAttemptDate: null,
          lastRenewalError: null,
          nextDeliveryDate: current.nextDeliveryDate > tomorrow ? current.nextDeliveryDate : tomorrow,
        })
        .where(eq(subscriptions.id, id));
    } else if (action === "skip") {
      if (current.status !== "active") throw conflict("Yalnızca aktif aboneliklerde teslimat atlanabilir.");
      const base = current.nextDeliveryDate > today ? current.nextDeliveryDate : today;
      await tx
        .update(subscriptions)
        .set({ nextDeliveryDate: addWeeks(base, current.intervalWeeks) })
        .where(eq(subscriptions.id, id));
    } else {
      await tx
        .update(subscriptions)
        .set({ status: "cancelled", cancelledAt: new Date(), pauseReason: null })
        .where(eq(subscriptions.id, id));
    }
  });
  return { subscription: await getSubscription(userId, id) };
}
