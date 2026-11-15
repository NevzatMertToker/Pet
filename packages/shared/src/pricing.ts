import {
  FREE_SHIPPING_THRESHOLD,
  SHIPPING_FEE,
  SUBSCRIPTION_DISCOUNT_PERCENT,
} from "./constants";
import type { Product, Quote, QuoteLine } from "./types";

export type PricedProduct = Pick<
  Product,
  "id" | "name" | "brand" | "packageSize" | "slug" | "species" | "type" | "imageUrl" | "price"
>;

export interface PricingInput {
  product: PricedProduct;
  quantity: number;
  intervalWeeks: number | null;
}

/** Abonelik indirimi uygulanmış birim fiyat (kuruş). */
export function subscriptionUnitPrice(listPrice: number): number {
  return Math.round((listPrice * (100 - SUBSCRIPTION_DISCOUNT_PERCENT)) / 100);
}

/**
 * Sepet/sipariş toplamlarını hesaplar. Sunucu, web ve mobil aynı fonksiyonu kullanır;
 * böylece ekranda görünen tutar ile karttan çekilen tutar hiçbir zaman ayrışmaz.
 */
export function computeQuote(inputs: PricingInput[]): Quote {
  const lines: QuoteLine[] = inputs.map(({ product, quantity, intervalWeeks }) => {
    const unitPrice = intervalWeeks ? subscriptionUnitPrice(product.price) : product.price;
    return {
      productId: product.id,
      name: product.name,
      brand: product.brand,
      packageSize: product.packageSize,
      slug: product.slug,
      species: product.species,
      type: product.type,
      imageUrl: product.imageUrl,
      quantity,
      intervalWeeks,
      listUnitPrice: product.price,
      unitPrice,
      lineTotal: unitPrice * quantity,
    };
  });

  const subtotal = lines.reduce((sum, l) => sum + l.listUnitPrice * l.quantity, 0);
  const discounted = lines.reduce((sum, l) => sum + l.lineTotal, 0);
  const subscriptionDiscount = subtotal - discounted;
  const hasSubscription = lines.some((l) => l.intervalWeeks !== null);

  const freeShipping = lines.length === 0 || hasSubscription || discounted >= FREE_SHIPPING_THRESHOLD;
  const shipping = freeShipping ? 0 : SHIPPING_FEE;

  return {
    lines,
    subtotal,
    subscriptionDiscount,
    shipping,
    total: discounted + shipping,
    hasSubscription,
    freeShippingRemaining: freeShipping ? 0 : FREE_SHIPPING_THRESHOLD - discounted,
  };
}

/** Kart numarası Luhn kontrolü. */
export function isValidCardNumber(input: string): boolean {
  const digits = input.replace(/[\s-]/g, "");
  if (!/^\d{13,19}$/.test(digits)) return false;
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = Number(digits[i]);
    if (double) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    double = !double;
  }
  return sum % 10 === 0;
}

export function cardBrand(input: string): string {
  const digits = input.replace(/[\s-]/g, "");
  if (/^4/.test(digits)) return "Visa";
  if (/^(5[1-5]|2[2-7])/.test(digits)) return "Mastercard";
  if (/^3[47]/.test(digits)) return "American Express";
  if (/^9792/.test(digits)) return "Troy";
  return "Kart";
}
