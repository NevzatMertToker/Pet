import { SHIPPING_FEE, addDays, addWeeks } from "@patipaket/shared";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { closeDb, getDb } from "../db";
import { orders, subscriptions } from "../db/schema";
import { HttpError } from "../errors";
import {
  DECLINING_CARD,
  createTestCustomer,
  createTestProduct,
  migrateTestDb,
  resetTestDb,
  stockOf,
} from "../test/helpers";
import { createPaymentMethod, deleteAddress, deletePaymentMethod, loginUser, registerUser } from "./account";
import { buildQuote } from "./catalog";
import { checkout } from "./checkout";
import { listOrders, releaseStalePendingOrders } from "./orders";
import {
  getSubscription,
  listSubscriptions,
  performSubscriptionAction,
  processDueSubscriptions,
  setSubscriptionItems,
  updateSubscription,
} from "./subscriptions";

const TODAY = "2026-11-15";

async function expectHttpError(promise: Promise<unknown>, status: number, code?: string) {
  const error = await promise.then(
    () => null,
    (caught: unknown) => caught,
  );
  expect(error).toBeInstanceOf(HttpError);
  expect((error as HttpError).status).toBe(status);
  if (code) expect((error as HttpError).code).toBe(code);
}

beforeAll(migrateTestDb);
beforeEach(resetTestDb);
afterAll(closeDb);

describe("hesap", () => {
  it("kayıt olur, giriş yapar, yinelenen e-postayı ve yanlış şifreyi reddeder", async () => {
    const input = { name: "Ayşe Yılmaz", email: "ayse@example.com", password: "gizli-sifre-123" };
    const registered = await registerUser(input);
    expect(registered.user.role).toBe("customer");
    expect(registered.token.split(".")).toHaveLength(3);

    await expectHttpError(registerUser(input), 409, "email_taken");

    const loggedIn = await loginUser({ email: input.email, password: input.password });
    expect(loggedIn.user.id).toBe(registered.user.id);
    await expectHttpError(loginUser({ email: input.email, password: "yanlis-sifre" }), 401, "invalid_credentials");
    await expectHttpError(loginUser({ email: "yok@example.com", password: "x" }), 401, "invalid_credentials");
  });

  it("abonelikte kullanılan adres ve kart silinemez", async () => {
    const { user, address, paymentMethod } = await createTestCustomer();
    const product = await createTestProduct();
    await checkout(
      user.id,
      {
        lines: [{ productId: product.id, quantity: 1, intervalWeeks: 4 }],
        addressId: address.id,
        paymentMethodId: paymentMethod.id,
      },
      TODAY,
    );
    await expectHttpError(deleteAddress(user.id, address.id), 409, "address_in_use");
    await expectHttpError(deletePaymentMethod(user.id, paymentMethod.id), 409, "payment_method_in_use");
  });
});

describe("sepet fiyatlama", () => {
  it("stok yetersizse adedi kısar ve sorunu bildirir", async () => {
    const product = await createTestProduct({ stock: 2 });
    const inactive = await createTestProduct({ isActive: false });
    const { quote, issues } = await buildQuote([
      { productId: product.id, quantity: 5, intervalWeeks: null },
      { productId: inactive.id, quantity: 1, intervalWeeks: null },
    ]);
    expect(quote.lines).toHaveLength(1);
    expect(quote.lines[0].quantity).toBe(2);
    expect(issues.map((issue) => issue.reason).sort()).toEqual(["inactive", "out_of_stock"]);
    expect(issues.find((issue) => issue.reason === "out_of_stock")?.availableStock).toBe(2);
  });

  it("abonelikle satılmayan ürünü tek seferlik fiyatlar", async () => {
    const product = await createTestProduct({ subscribable: false });
    const { quote, issues } = await buildQuote([{ productId: product.id, quantity: 1, intervalWeeks: 4 }]);
    expect(issues[0].reason).toBe("not_subscribable");
    expect(quote.lines[0].intervalWeeks).toBeNull();
    expect(quote.subscriptionDiscount).toBe(0);
  });
});

describe("ödeme (checkout)", () => {
  it("tek seferlik sipariş: stok düşer, kargo ücreti eklenir, abonelik oluşmaz", async () => {
    const { user, address, paymentMethod } = await createTestCustomer();
    const product = await createTestProduct({ price: 20000, stock: 10 });

    const result = await checkout(
      user.id,
      {
        lines: [{ productId: product.id, quantity: 2, intervalWeeks: null }],
        addressId: address.id,
        paymentMethodId: paymentMethod.id,
      },
      TODAY,
    );

    expect(result.order.status).toBe("paid");
    expect(result.order.orderNumber).toBe("PP-100001");
    expect(result.order.total).toBe(40000 + SHIPPING_FEE);
    expect(result.order.paymentSummary).toBe("Visa •••• 4242");
    expect(result.order.address.city).toBe("İstanbul");
    expect(result.subscriptions).toHaveLength(0);
    expect(await stockOf(product.id)).toBe(8);
  });

  it("abonelik satırları sıklığa göre gruplanır, %10 indirim ve ücretsiz kargo uygulanır", async () => {
    const { user, address, paymentMethod } = await createTestCustomer();
    const food = await createTestProduct({ price: 30000 });
    const litter = await createTestProduct({ price: 10000, type: "litter" });
    const treat = await createTestProduct({ price: 5000, type: "supplies" });

    const result = await checkout(
      user.id,
      {
        lines: [
          { productId: food.id, quantity: 1, intervalWeeks: 4 },
          { productId: litter.id, quantity: 2, intervalWeeks: 4 },
          { productId: treat.id, quantity: 1, intervalWeeks: 8 },
          { productId: treat.id, quantity: 1, intervalWeeks: null },
        ],
        addressId: address.id,
        paymentMethodId: paymentMethod.id,
      },
      TODAY,
    );

    // 30000*0.9 + 2*10000*0.9 + 5000*0.9 + 5000 = 27000 + 18000 + 4500 + 5000
    expect(result.order.total).toBe(54500);
    expect(result.order.discount).toBe(5500);
    expect(result.order.shipping).toBe(0);
    expect(result.order.items.filter((item) => item.isSubscription)).toHaveLength(3);

    expect(result.subscriptions).toHaveLength(2);
    const monthly = result.subscriptions.find((sub) => sub.intervalWeeks === 4)!;
    const bimonthly = result.subscriptions.find((sub) => sub.intervalWeeks === 8)!;
    expect(monthly.items).toHaveLength(2);
    expect(monthly.nextDeliveryDate).toBe(addWeeks(TODAY, 4));
    expect(monthly.estimatedTotal).toBe(45000);
    expect(bimonthly.items).toHaveLength(1);
    expect(bimonthly.nextDeliveryDate).toBe(addWeeks(TODAY, 8));
    expect(await stockOf(treat.id)).toBe(8);
  });

  it("kart reddedilirse stok geri verilir ve abonelik oluşmaz", async () => {
    const { user, address, paymentMethod } = await createTestCustomer(DECLINING_CARD);
    const product = await createTestProduct({ stock: 5 });

    await expectHttpError(
      checkout(
        user.id,
        {
          lines: [{ productId: product.id, quantity: 2, intervalWeeks: 4 }],
          addressId: address.id,
          paymentMethodId: paymentMethod.id,
        },
        TODAY,
      ),
      402,
      "payment_failed",
    );

    expect(await stockOf(product.id)).toBe(5);
    expect(await listSubscriptions(user.id)).toHaveLength(0);
    const [order] = await listOrders(user.id);
    expect(order.status).toBe("payment_failed");
  });

  it("stok yetersizse sipariş oluşturmaz", async () => {
    const { user, address, paymentMethod } = await createTestCustomer();
    const product = await createTestProduct({ stock: 1 });
    await expectHttpError(
      checkout(
        user.id,
        {
          lines: [{ productId: product.id, quantity: 2, intervalWeeks: null }],
          addressId: address.id,
          paymentMethodId: paymentMethod.id,
        },
        TODAY,
      ),
      409,
      "cart_changed",
    );
    expect(await listOrders(user.id)).toHaveLength(0);
    expect(await stockOf(product.id)).toBe(1);
  });

  it("son ürün için yarışan iki siparişten yalnızca biri başarılı olur", async () => {
    const first = await createTestCustomer();
    const second = await createTestCustomer();
    const product = await createTestProduct({ stock: 1 });
    const order = (customer: typeof first) =>
      checkout(
        customer.user.id,
        {
          lines: [{ productId: product.id, quantity: 1, intervalWeeks: null }],
          addressId: customer.address.id,
          paymentMethodId: customer.paymentMethod.id,
        },
        TODAY,
      );

    const results = await Promise.allSettled([order(first), order(second)]);
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((result) => result.status === "rejected")).toHaveLength(1);
    expect(await stockOf(product.id)).toBe(0);
  });

  it("başkasının adresi veya kartıyla sipariş verilemez", async () => {
    const owner = await createTestCustomer();
    const other = await createTestCustomer();
    const product = await createTestProduct();
    await expectHttpError(
      checkout(
        other.user.id,
        {
          lines: [{ productId: product.id, quantity: 1, intervalWeeks: null }],
          addressId: owner.address.id,
          paymentMethodId: other.paymentMethod.id,
        },
        TODAY,
      ),
      422,
    );
    await expectHttpError(
      checkout(
        other.user.id,
        {
          lines: [{ productId: product.id, quantity: 1, intervalWeeks: null }],
          addressId: other.address.id,
          paymentMethodId: owner.paymentMethod.id,
        },
        TODAY,
      ),
      422,
    );
  });

  it("yarıda kalmış ödeme bekleyen siparişlerin stoku serbest bırakılır", async () => {
    const { user, address, paymentMethod } = await createTestCustomer();
    const product = await createTestProduct({ stock: 5 });
    const { order } = await checkout(
      user.id,
      {
        lines: [{ productId: product.id, quantity: 2, intervalWeeks: null }],
        addressId: address.id,
        paymentMethodId: paymentMethod.id,
      },
      TODAY,
    );
    // Sunucunun tahsilat adımında çöktüğü durumu taklit et.
    await getDb()
      .update(orders)
      .set({ status: "pending", createdAt: new Date(Date.now() - 60 * 60_000) })
      .where(eq(orders.id, order.id));

    expect(await releaseStalePendingOrders()).toBe(1);
    expect(await stockOf(product.id)).toBe(5);
    expect((await listOrders(user.id))[0].status).toBe("cancelled");
    expect(await releaseStalePendingOrders()).toBe(0);
  });
});

describe("abonelik yenileme", () => {
  async function subscribe(options: { stock?: number; intervalWeeks?: number; quantity?: number } = {}) {
    const customer = await createTestCustomer();
    const product = await createTestProduct({ price: 20000, stock: options.stock ?? 10 });
    const { subscriptions: created } = await checkout(
      customer.user.id,
      {
        lines: [
          { productId: product.id, quantity: options.quantity ?? 1, intervalWeeks: options.intervalWeeks ?? 4 },
        ],
        addressId: customer.address.id,
        paymentMethodId: customer.paymentMethod.id,
      },
      TODAY,
    );
    return { ...customer, product, subscription: created[0] };
  }

  it("günü gelmeden tahsilat yapmaz; günü gelince sipariş oluşturur ve tarihi ilerletir", async () => {
    const { user, product, subscription } = await subscribe();
    const dueDate = subscription.nextDeliveryDate;

    const early = await processDueSubscriptions(addDays(dueDate, -1));
    expect(early.due).toBe(0);
    expect(await listOrders(user.id)).toHaveLength(1);

    const summary = await processDueSubscriptions(dueDate);
    expect(summary).toMatchObject({ due: 1, renewed: 1, paymentFailed: 0, errors: 0 });

    const userOrders = await listOrders(user.id);
    expect(userOrders).toHaveLength(2);
    const renewal = userOrders.find((order) => order.subscriptionId === subscription.id)!;
    expect(renewal.status).toBe("paid");
    expect(renewal.total).toBe(18000);
    expect(renewal.shipping).toBe(0);
    expect(await stockOf(product.id)).toBe(8);

    const after = await getSubscription(user.id, subscription.id);
    expect(after.nextDeliveryDate).toBe(addWeeks(dueDate, 4));
    expect(after.lastRenewalError).toBeNull();
  });

  it("aynı gün ikinci kez çalıştırılırsa mükerrer sipariş oluşturmaz", async () => {
    const { user, subscription } = await subscribe();
    const dueDate = subscription.nextDeliveryDate;
    const [first, second] = await Promise.all([processDueSubscriptions(dueDate), processDueSubscriptions(dueDate)]);
    expect(first.renewed + second.renewed).toBe(1);
    expect((await processDueSubscriptions(dueDate)).due).toBe(0);
    expect(await listOrders(user.id)).toHaveLength(2);
  });

  it("kart reddedilirse günde bir kez dener ve üçüncü başarısızlıkta aboneliği duraklatır", async () => {
    const { user, product, subscription } = await subscribe();
    const badCard = await createPaymentMethod(user.id, DECLINING_CARD);
    await updateSubscription(user.id, subscription.id, { paymentMethodId: badCard.id }, TODAY);
    const dueDate = subscription.nextDeliveryDate;

    const day1 = await processDueSubscriptions(dueDate);
    expect(day1).toMatchObject({ due: 1, renewed: 0, paymentFailed: 1, paused: 0 });
    // Aynı gün tekrar denenmez.
    expect((await processDueSubscriptions(dueDate)).due).toBe(0);

    const day2 = await processDueSubscriptions(addDays(dueDate, 1));
    expect(day2).toMatchObject({ paymentFailed: 1, paused: 0 });
    const day3 = await processDueSubscriptions(addDays(dueDate, 2));
    expect(day3).toMatchObject({ paymentFailed: 1, paused: 1 });

    const after = await getSubscription(user.id, subscription.id);
    expect(after.status).toBe("paused");
    expect(after.pauseReason).toBe("payment_failed");
    expect(after.lastRenewalError).toContain("reddedildi");
    expect(await listOrders(user.id)).toHaveLength(1);
    expect(await stockOf(product.id)).toBe(9);
    expect((await processDueSubscriptions(addDays(dueDate, 3))).due).toBe(0);
  });

  it("ürün stokta yoksa teslimatı bir hafta erteler ve tahsilat yapmaz", async () => {
    const { user, subscription } = await subscribe({ stock: 1 });
    const dueDate = subscription.nextDeliveryDate;
    const summary = await processDueSubscriptions(dueDate);
    expect(summary).toMatchObject({ due: 1, renewed: 0, delayedForStock: 1 });
    const after = await getSubscription(user.id, subscription.id);
    expect(after.nextDeliveryDate).toBe(addDays(dueDate, 7));
    expect(after.items[0].available).toBe(false);
    expect(await listOrders(user.id)).toHaveLength(1);
  });

  it("duraklatılan veya iptal edilen abonelik yenilenmez; devam ettirilince yenilenir", async () => {
    const { user, subscription } = await subscribe();
    const dueDate = subscription.nextDeliveryDate;

    await performSubscriptionAction(user.id, subscription.id, "pause", TODAY);
    expect((await processDueSubscriptions(dueDate)).due).toBe(0);

    const lateResume = addDays(dueDate, 10);
    const resumed = await performSubscriptionAction(user.id, subscription.id, "resume", lateResume);
    expect(resumed.subscription.status).toBe("active");
    // Geçmişte kalmış teslimat tarihi yarına çekilir; devam ettirir ettirmez tahsilat yapılmaz.
    expect(resumed.subscription.nextDeliveryDate).toBe(addDays(lateResume, 1));
    expect((await processDueSubscriptions(lateResume)).due).toBe(0);
    expect((await processDueSubscriptions(addDays(lateResume, 1))).renewed).toBe(1);

    await performSubscriptionAction(user.id, subscription.id, "cancel", lateResume);
    expect((await processDueSubscriptions(addDays(lateResume, 60))).due).toBe(0);
    await expectHttpError(performSubscriptionAction(user.id, subscription.id, "resume", lateResume), 409);
  });

  it("teslimat atlanınca tarih bir dönem ilerler", async () => {
    const { user, subscription } = await subscribe({ intervalWeeks: 2 });
    const { subscription: skipped } = await performSubscriptionAction(user.id, subscription.id, "skip", TODAY);
    expect(skipped.nextDeliveryDate).toBe(addWeeks(subscription.nextDeliveryDate, 2));
    expect((await processDueSubscriptions(subscription.nextDeliveryDate)).due).toBe(0);
  });

  it("hemen gönder: sipariş oluşturur, tarihi bugünden itibaren ilerletir, mükerrer isteği engeller", async () => {
    const { user, subscription } = await subscribe();
    const shipDay = addDays(TODAY, 5);
    const result = await performSubscriptionAction(user.id, subscription.id, "ship-now", shipDay);
    expect(result.order?.status).toBe("paid");
    expect(result.order?.subscriptionId).toBe(subscription.id);
    expect(result.subscription.nextDeliveryDate).toBe(addWeeks(shipDay, 4));
    await expectHttpError(performSubscriptionAction(user.id, subscription.id, "ship-now", shipDay), 409);
    expect(await listOrders(user.id)).toHaveLength(2);
  });

  it("sıklık, tarih ve ürünler güncellenebilir; geçersiz tarih reddedilir", async () => {
    const { user, subscription, product } = await subscribe();
    const extra = await createTestProduct({ price: 10000 });

    const updated = await updateSubscription(
      user.id,
      subscription.id,
      { intervalWeeks: 8, nextDeliveryDate: addDays(TODAY, 3) },
      TODAY,
    );
    expect(updated.intervalWeeks).toBe(8);
    expect(updated.nextDeliveryDate).toBe(addDays(TODAY, 3));

    await expectHttpError(updateSubscription(user.id, subscription.id, { nextDeliveryDate: TODAY }, TODAY), 422);
    await expectHttpError(
      updateSubscription(user.id, subscription.id, { nextDeliveryDate: addDays(TODAY, 400) }, TODAY),
      422,
    );

    const withItems = await setSubscriptionItems(user.id, subscription.id, {
      items: [
        { productId: product.id, quantity: 3 },
        { productId: extra.id, quantity: 1 },
      ],
    });
    expect(withItems.items).toHaveLength(2);
    expect(withItems.estimatedTotal).toBe(3 * 18000 + 9000);

    const summary = await processDueSubscriptions(addDays(TODAY, 3));
    expect(summary.renewed).toBe(1);
    expect((await getSubscription(user.id, subscription.id)).nextDeliveryDate).toBe(addWeeks(addDays(TODAY, 3), 8));
  });

  it("başka kullanıcının aboneliğine erişilemez", async () => {
    const { subscription } = await subscribe();
    const stranger = await createTestCustomer();
    await expectHttpError(getSubscription(stranger.user.id, subscription.id), 404);
    await expectHttpError(performSubscriptionAction(stranger.user.id, subscription.id, "cancel", TODAY), 404);
    await expectHttpError(updateSubscription(stranger.user.id, subscription.id, { intervalWeeks: 2 }, TODAY), 404);
    const [row] = await getDb().select().from(subscriptions).where(eq(subscriptions.id, subscription.id));
    expect(row.status).toBe("active");
  });
});
