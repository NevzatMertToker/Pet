import { relations, sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import type { AddressSnapshot } from "@patipaket/shared";

export const speciesEnum = pgEnum("species", ["cat", "dog", "bird"]);
export const productTypeEnum = pgEnum("product_type", ["food", "litter", "supplies"]);
export const userRoleEnum = pgEnum("user_role", ["customer", "admin"]);
export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "paid",
  "preparing",
  "shipped",
  "delivered",
  "cancelled",
  "payment_failed",
]);
export const subscriptionStatusEnum = pgEnum("subscription_status", ["active", "paused", "cancelled"]);

const id = () => uuid("id").primaryKey().defaultRandom();
const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

export const users = pgTable(
  "users",
  {
    id: id(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    name: text("name").notNull(),
    phone: text("phone"),
    role: userRoleEnum("role").notNull().default("customer"),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("users_email_idx").on(t.email)],
);

export const addresses = pgTable(
  "addresses",
  {
    id: id(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    fullName: text("full_name").notNull(),
    phone: text("phone").notNull(),
    city: text("city").notNull(),
    district: text("district").notNull(),
    line: text("line").notNull(),
    postalCode: text("postal_code"),
    isDefault: boolean("is_default").notNull().default(false),
    /** Silinen adres aboneliklerde kullanılıyor olabileceğinden yumuşak silinir. */
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [index("addresses_user_idx").on(t.userId)],
);

export const paymentMethods = pgTable(
  "payment_methods",
  {
    id: id(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    provider: text("provider").notNull(),
    /** Ödeme sağlayıcısının kart saklama jetonu — kart numarası asla saklanmaz. */
    providerToken: text("provider_token").notNull(),
    brand: text("brand").notNull(),
    last4: text("last4").notNull(),
    expMonth: integer("exp_month").notNull(),
    expYear: integer("exp_year").notNull(),
    cardHolder: text("card_holder").notNull(),
    isDefault: boolean("is_default").notNull().default(false),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [index("payment_methods_user_idx").on(t.userId)],
);

export const pets = pgTable(
  "pets",
  {
    id: id(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    species: speciesEnum("species").notNull(),
    breed: text("breed"),
    birthDate: date("birth_date", { mode: "string" }),
    weightKg: numeric("weight_kg", { precision: 5, scale: 2, mode: "number" }),
    createdAt: createdAt(),
  },
  (t) => [index("pets_user_idx").on(t.userId)],
);

export const products = pgTable(
  "products",
  {
    id: id(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    brand: text("brand").notNull(),
    description: text("description").notNull(),
    species: speciesEnum("species").notNull(),
    type: productTypeEnum("type").notNull(),
    packageSize: text("package_size").notNull(),
    /** Kuruş */
    price: integer("price").notNull(),
    compareAtPrice: integer("compare_at_price"),
    imageUrl: text("image_url"),
    stock: integer("stock").notNull().default(0),
    subscribable: boolean("subscribable").notNull().default(true),
    suggestedIntervalWeeks: integer("suggested_interval_weeks"),
    isFeatured: boolean("is_featured").notNull().default(false),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex("products_slug_idx").on(t.slug),
    index("products_category_idx").on(t.species, t.type),
    // Eşzamanlı siparişlerde stokun eksiye düşmesine karşı son emniyet.
    check("products_stock_non_negative", sql`${t.stock} >= 0`),
  ],
);

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: id(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: subscriptionStatusEnum("status").notNull().default("active"),
    intervalWeeks: integer("interval_weeks").notNull(),
    nextDeliveryDate: date("next_delivery_date", { mode: "string" }).notNull(),
    addressId: uuid("address_id")
      .notNull()
      .references(() => addresses.id),
    paymentMethodId: uuid("payment_method_id")
      .notNull()
      .references(() => paymentMethods.id),
    failedRenewalCount: integer("failed_renewal_count").notNull().default(0),
    /** Aynı gün içinde ikinci kez tahsilat denenmesini engeller. */
    lastRenewalAttemptDate: date("last_renewal_attempt_date", { mode: "string" }),
    lastRenewalError: text("last_renewal_error"),
    pauseReason: text("pause_reason"),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [
    index("subscriptions_user_idx").on(t.userId),
    index("subscriptions_due_idx").on(t.status, t.nextDeliveryDate),
  ],
);

export const subscriptionItems = pgTable(
  "subscription_items",
  {
    id: id(),
    subscriptionId: uuid("subscription_id")
      .notNull()
      .references(() => subscriptions.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id),
    quantity: integer("quantity").notNull(),
  },
  (t) => [uniqueIndex("subscription_items_unique_idx").on(t.subscriptionId, t.productId)],
);

export const orders = pgTable(
  "orders",
  {
    id: id(),
    orderNumber: integer("order_number").notNull().generatedAlwaysAsIdentity({ startWith: 100001 }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    status: orderStatusEnum("status").notNull().default("pending"),
    subtotal: integer("subtotal").notNull(),
    discount: integer("discount").notNull().default(0),
    shipping: integer("shipping").notNull().default(0),
    total: integer("total").notNull(),
    address: jsonb("address").$type<AddressSnapshot>().notNull(),
    paymentMethodId: uuid("payment_method_id").references(() => paymentMethods.id),
    paymentSummary: text("payment_summary"),
    paymentReference: text("payment_reference"),
    /** Abonelik yenilemesiyle oluşan siparişlerde dolu olur. */
    subscriptionId: uuid("subscription_id").references(() => subscriptions.id, { onDelete: "set null" }),
    trackingNumber: text("tracking_number"),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex("orders_number_idx").on(t.orderNumber),
    index("orders_user_idx").on(t.userId, t.createdAt),
  ],
);

export const orderItems = pgTable(
  "order_items",
  {
    id: id(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: uuid("product_id").references(() => products.id, { onDelete: "set null" }),
    /** Ürün sonradan değişse bile sipariş anındaki bilgiler korunur. */
    name: text("name").notNull(),
    packageSize: text("package_size").notNull(),
    quantity: integer("quantity").notNull(),
    unitPrice: integer("unit_price").notNull(),
    lineTotal: integer("line_total").notNull(),
    isSubscription: boolean("is_subscription").notNull().default(false),
  },
  (t) => [index("order_items_order_idx").on(t.orderId)],
);

export const usersRelations = relations(users, ({ many }) => ({
  addresses: many(addresses),
  paymentMethods: many(paymentMethods),
  pets: many(pets),
  orders: many(orders),
  subscriptions: many(subscriptions),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, { fields: [orders.userId], references: [users.id] }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one, many }) => ({
  user: one(users, { fields: [subscriptions.userId], references: [users.id] }),
  address: one(addresses, { fields: [subscriptions.addressId], references: [addresses.id] }),
  paymentMethod: one(paymentMethods, {
    fields: [subscriptions.paymentMethodId],
    references: [paymentMethods.id],
  }),
  items: many(subscriptionItems),
}));

export const subscriptionItemsRelations = relations(subscriptionItems, ({ one }) => ({
  subscription: one(subscriptions, {
    fields: [subscriptionItems.subscriptionId],
    references: [subscriptions.id],
  }),
  product: one(products, { fields: [subscriptionItems.productId], references: [products.id] }),
}));
