import { MAX_QUANTITY_PER_LINE } from "./constants";
import { computeQuote, type PricedProduct } from "./pricing";
import type { CartLine, Product, Quote } from "./types";

/** Sepette saklanan ürün özeti (ekranda göstermek için yeterli alanlar). */
export type CartProduct = PricedProduct & Pick<Product, "subscribable" | "stock">;

export interface CartItem {
  product: CartProduct;
  quantity: number;
  /** null = tek seferlik, sayı = abonelik sıklığı (hafta) */
  intervalWeeks: number | null;
}

export function toCartProduct(product: Product): CartProduct {
  return {
    id: product.id,
    name: product.name,
    brand: product.brand,
    packageSize: product.packageSize,
    slug: product.slug,
    species: product.species,
    type: product.type,
    imageUrl: product.imageUrl,
    price: product.price,
    subscribable: product.subscribable,
    stock: product.stock,
  };
}

/** Aynı ürün hem tek seferlik hem abonelik olarak sepette ayrı satır olabilir. */
export function cartLineKey(productId: string, intervalWeeks: number | null): string {
  return productId + ":" + (intervalWeeks ?? 0);
}

export function cartItemKey(item: CartItem): string {
  return cartLineKey(item.product.id, item.intervalWeeks);
}

function clampQuantity(quantity: number): number {
  return Math.max(1, Math.min(MAX_QUANTITY_PER_LINE, Math.round(quantity)));
}

/** Aynı anahtara sahip satırları birleştirir, sırayı korur. */
function mergeItems(items: CartItem[]): CartItem[] {
  const merged = new Map<string, CartItem>();
  for (const item of items) {
    const key = cartItemKey(item);
    const existing = merged.get(key);
    merged.set(
      key,
      existing ? { ...existing, quantity: clampQuantity(existing.quantity + item.quantity) } : item,
    );
  }
  return [...merged.values()];
}

export function addToCart(
  items: CartItem[],
  product: CartProduct,
  quantity: number,
  intervalWeeks: number | null,
): CartItem[] {
  const interval = product.subscribable ? intervalWeeks : null;
  return mergeItems([...items, { product, quantity: clampQuantity(quantity), intervalWeeks: interval }]);
}

export function setCartQuantity(items: CartItem[], key: string, quantity: number): CartItem[] {
  if (quantity <= 0) return removeFromCart(items, key);
  return items.map((item) => (cartItemKey(item) === key ? { ...item, quantity: clampQuantity(quantity) } : item));
}

export function setCartInterval(items: CartItem[], key: string, intervalWeeks: number | null): CartItem[] {
  return mergeItems(
    items.map((item) =>
      cartItemKey(item) === key
        ? { ...item, intervalWeeks: item.product.subscribable ? intervalWeeks : null }
        : item,
    ),
  );
}

export function removeFromCart(items: CartItem[], key: string): CartItem[] {
  return items.filter((item) => cartItemKey(item) !== key);
}

export function cartCount(items: CartItem[]): number {
  return items.reduce((total, item) => total + item.quantity, 0);
}

export function cartToLines(items: CartItem[]): CartLine[] {
  return items.map((item) => ({
    productId: item.product.id,
    quantity: item.quantity,
    intervalWeeks: item.intervalWeeks,
  }));
}

/** Sepetteki ürün özetleriyle hesaplanan toplam; kesin tutarı sunucu belirler. */
export function cartQuote(items: CartItem[]): Quote {
  return computeQuote(
    items.map((item) => ({ product: item.product, quantity: item.quantity, intervalWeeks: item.intervalWeeks })),
  );
}
