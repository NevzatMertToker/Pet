import { sql } from "drizzle-orm";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { getDb } from "../db";
import { products } from "../db/schema";
import { setPaymentProvider } from "../payment";
import { createAddress, createPaymentMethod, registerUser } from "../services/account";

export const GOOD_CARD = {
  cardHolder: "Deniz Örnek",
  cardNumber: "4242424242424242",
  expMonth: 12,
  expYear: 2040,
  cvc: "123",
};
export const DECLINING_CARD = { ...GOOD_CARD, cardNumber: "4000000000000002" };

export async function migrateTestDb(): Promise<void> {
  await migrate(getDb(), { migrationsFolder: "./drizzle" });
}

export async function resetTestDb(): Promise<void> {
  await getDb().execute(
    sql`TRUNCATE order_items, orders, subscription_items, subscriptions, payment_methods, addresses, pets, products, users RESTART IDENTITY CASCADE`,
  );
  // Her test temiz bir ödeme sağlayıcısıyla başlar.
  setPaymentProvider(undefined);
}

let productCounter = 0;

export async function createTestProduct(overrides: Partial<typeof products.$inferInsert> = {}) {
  productCounter += 1;
  const [row] = await getDb()
    .insert(products)
    .values({
      slug: "test-urun-" + productCounter,
      name: "Test Ürünü " + productCounter,
      brand: "Test",
      description: "Test amaçlı ürün açıklaması.",
      species: "cat",
      type: "food",
      packageSize: "1 kg",
      price: 20000,
      stock: 10,
      ...overrides,
    })
    .returning();
  return row;
}

let userCounter = 0;

/** Adresi ve kayıtlı kartı olan bir müşteri oluşturur. */
export async function createTestCustomer(card = GOOD_CARD) {
  userCounter += 1;
  const { user } = await registerUser({
    name: "Test Müşteri",
    email: "musteri" + userCounter + "@example.com",
    password: "gizli-sifre-123",
  });
  const address = await createAddress(user.id, {
    title: "Ev",
    fullName: "Test Müşteri",
    phone: "05551112233",
    city: "İstanbul",
    district: "Kadıköy",
    line: "Moda Mahallesi, Örnek Sokak No: 1 Daire: 2",
  });
  const paymentMethod = await createPaymentMethod(user.id, card);
  return { user, address, paymentMethod };
}

export async function stockOf(productId: string): Promise<number> {
  const rows = await getDb().execute<{ stock: number }>(sql`SELECT stock FROM products WHERE id = ${productId}`);
  return rows.rows[0].stock;
}
