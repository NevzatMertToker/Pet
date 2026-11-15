import type {
  Address,
  AddressSnapshot,
  Order,
  OrderItem,
  PaymentMethod,
  Pet,
  Product,
  User,
} from "@patipaket/shared";
import type { addresses, orderItems, orders, paymentMethods, pets, products, users } from "./db/schema";

export type UserRow = typeof users.$inferSelect;
export type ProductRow = typeof products.$inferSelect;
export type AddressRow = typeof addresses.$inferSelect;
export type PaymentMethodRow = typeof paymentMethods.$inferSelect;
export type PetRow = typeof pets.$inferSelect;
export type OrderRow = typeof orders.$inferSelect;
export type OrderItemRow = typeof orderItems.$inferSelect;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Yol parametresi geçerli bir UUID değilse veritabanına hiç sorulmaz. */
export function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

export function toUser(row: UserRow): User {
  return { id: row.id, email: row.email, name: row.name, phone: row.phone, role: row.role };
}

export function toProduct(row: ProductRow): Product {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    brand: row.brand,
    description: row.description,
    species: row.species,
    type: row.type,
    packageSize: row.packageSize,
    price: row.price,
    compareAtPrice: row.compareAtPrice,
    imageUrl: row.imageUrl,
    stock: row.stock,
    subscribable: row.subscribable,
    suggestedIntervalWeeks: row.suggestedIntervalWeeks,
    isFeatured: row.isFeatured,
    isActive: row.isActive,
  };
}

export function toAddress(row: AddressRow): Address {
  return {
    id: row.id,
    title: row.title,
    fullName: row.fullName,
    phone: row.phone,
    city: row.city,
    district: row.district,
    line: row.line,
    postalCode: row.postalCode,
    isDefault: row.isDefault,
  };
}

export function toAddressSnapshot(row: AddressRow): AddressSnapshot {
  return {
    fullName: row.fullName,
    phone: row.phone,
    city: row.city,
    district: row.district,
    line: row.line,
    postalCode: row.postalCode,
  };
}

export function toPaymentMethod(row: PaymentMethodRow): PaymentMethod {
  return {
    id: row.id,
    brand: row.brand,
    last4: row.last4,
    expMonth: row.expMonth,
    expYear: row.expYear,
    cardHolder: row.cardHolder,
    isDefault: row.isDefault,
  };
}

export function toPet(row: PetRow): Pet {
  return {
    id: row.id,
    name: row.name,
    species: row.species,
    breed: row.breed,
    birthDate: row.birthDate,
    weightKg: row.weightKg,
  };
}

export function formatOrderNumber(orderNumber: number): string {
  return "PP-" + orderNumber;
}

export function toOrderItem(row: OrderItemRow): OrderItem {
  return {
    id: row.id,
    productId: row.productId,
    name: row.name,
    packageSize: row.packageSize,
    quantity: row.quantity,
    unitPrice: row.unitPrice,
    lineTotal: row.lineTotal,
    isSubscription: row.isSubscription,
  };
}

export function toOrder(row: OrderRow, items: OrderItemRow[]): Order {
  return {
    id: row.id,
    orderNumber: formatOrderNumber(row.orderNumber),
    status: row.status,
    subtotal: row.subtotal,
    discount: row.discount,
    shipping: row.shipping,
    total: row.total,
    address: row.address,
    paymentSummary: row.paymentSummary,
    subscriptionId: row.subscriptionId,
    trackingNumber: row.trackingNumber,
    createdAt: row.createdAt.toISOString(),
    items: items.map(toOrderItem),
  };
}
