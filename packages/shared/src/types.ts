import type { OrderStatus, ProductType, Species, SubscriptionStatus } from "./constants";

/** API'nin döndürdüğü veri şekilleri. Tüm tutarlar kuruş, tüm tarihler ISO metindir. */

export interface Product {
  id: string;
  slug: string;
  name: string;
  brand: string;
  description: string;
  species: Species;
  type: ProductType;
  /** Örn. "10 kg", "100 adet" */
  packageSize: string;
  price: number;
  compareAtPrice: number | null;
  imageUrl: string | null;
  stock: number;
  subscribable: boolean;
  /** Bu paket ortalama kaç haftada biter — abonelik sıklığı önerisi. */
  suggestedIntervalWeeks: number | null;
  isFeatured: boolean;
  isActive: boolean;
}

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: "customer" | "admin";
}

export interface AuthResult {
  token: string;
  user: User;
}

export interface Address {
  id: string;
  title: string;
  fullName: string;
  phone: string;
  city: string;
  district: string;
  line: string;
  postalCode: string | null;
  isDefault: boolean;
}

export interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  cardHolder: string;
  isDefault: boolean;
}

export interface Pet {
  id: string;
  name: string;
  species: Species;
  breed: string | null;
  birthDate: string | null;
  weightKg: number | null;
}

/** Sepet satırı: intervalWeeks null ise tek seferlik, sayı ise abonelik. */
export interface CartLine {
  productId: string;
  quantity: number;
  intervalWeeks: number | null;
}

export interface QuoteLine {
  productId: string;
  name: string;
  brand: string;
  packageSize: string;
  slug: string;
  species: Species;
  type: ProductType;
  imageUrl: string | null;
  quantity: number;
  intervalWeeks: number | null;
  /** İndirimsiz birim fiyat */
  listUnitPrice: number;
  /** Uygulanan birim fiyat (abonelikse indirimli) */
  unitPrice: number;
  lineTotal: number;
}

export interface Quote {
  lines: QuoteLine[];
  /** İndirimsiz ara toplam */
  subtotal: number;
  subscriptionDiscount: number;
  shipping: number;
  total: number;
  hasSubscription: boolean;
  /** Ücretsiz kargoya kalan tutar (zaten ücretsizse 0) */
  freeShippingRemaining: number;
}

export interface QuoteIssue {
  productId: string;
  reason: "not_found" | "inactive" | "out_of_stock" | "not_subscribable";
  message: string;
  availableStock?: number;
}

export interface QuoteResponse {
  quote: Quote;
  issues: QuoteIssue[];
}

export interface AddressSnapshot {
  fullName: string;
  phone: string;
  city: string;
  district: string;
  line: string;
  postalCode: string | null;
}

export interface OrderItem {
  id: string;
  productId: string | null;
  name: string;
  packageSize: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  isSubscription: boolean;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  address: AddressSnapshot;
  paymentSummary: string | null;
  subscriptionId: string | null;
  trackingNumber: string | null;
  createdAt: string;
  items: OrderItem[];
}

export interface SubscriptionItem {
  id: string;
  productId: string;
  name: string;
  brand: string;
  packageSize: string;
  slug: string;
  species: Species;
  type: ProductType;
  imageUrl: string | null;
  quantity: number;
  listUnitPrice: number;
  unitPrice: number;
  lineTotal: number;
  available: boolean;
}

export interface Subscription {
  id: string;
  status: SubscriptionStatus;
  intervalWeeks: number;
  /** YYYY-AA-GG */
  nextDeliveryDate: string;
  address: Address | null;
  paymentMethod: PaymentMethod | null;
  items: SubscriptionItem[];
  /** Bir sonraki teslimatın tahmini tutarı */
  estimatedTotal: number;
  pauseReason: string | null;
  lastRenewalError: string | null;
  createdAt: string;
}

export interface CheckoutResult {
  order: Order;
  subscriptions: Subscription[];
}

export interface ProductListParams {
  species?: Species;
  type?: ProductType;
  q?: string;
  sort?: "featured" | "price_asc" | "price_desc" | "name";
  featured?: boolean;
}
