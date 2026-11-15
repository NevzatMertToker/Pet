import { describe, expect, it } from "vitest";
import {
  FREE_SHIPPING_THRESHOLD,
  MAX_QUANTITY_PER_LINE,
  SHIPPING_FEE,
  addDays,
  addToCart,
  addWeeks,
  cardBrand,
  cardSchema,
  cartCount,
  cartLineKey,
  cartQuote,
  cartToLines,
  checkoutSchema,
  computeQuote,
  removeFromCart,
  setCartInterval,
  setCartQuantity,
  type CartProduct,
  daysBetween,
  formatDate,
  formatPrice,
  isValidCardNumber,
  isValidISODate,
  registerSchema,
  subscriptionUnitPrice,
  todayInTurkey,
  type PricedProduct,
} from "./index";

function product(id: string, price: number): PricedProduct {
  return {
    id,
    name: `Ürün ${id}`,
    brand: "Marka",
    packageSize: "1 kg",
    slug: `urun-${id}`,
    species: "cat",
    type: "food",
    imageUrl: null,
    price,
  };
}

describe("formatPrice", () => {
  it("kuruşu Türk lirası biçiminde yazar", () => {
    expect(formatPrice(124990)).toBe("1.249,90 ₺");
    expect(formatPrice(500)).toBe("5,00 ₺");
    expect(formatPrice(0)).toBe("0,00 ₺");
    expect(formatPrice(123456789)).toBe("1.234.567,89 ₺");
    expect(formatPrice(-1050)).toBe("-10,50 ₺");
  });
});

describe("tarih yardımcıları", () => {
  it("hafta ekler ve ay/yıl sınırını doğru geçer", () => {
    expect(addWeeks("2026-11-15", 4)).toBe("2026-12-13");
    expect(addWeeks("2026-12-20", 2)).toBe("2027-01-03");
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
  });

  it("geçersiz tarihi reddeder", () => {
    expect(isValidISODate("2026-02-30")).toBe(false);
    expect(isValidISODate("2026-2-3")).toBe(false);
    expect(isValidISODate("2026-02-28")).toBe(true);
  });

  it("Türkiye saatine göre bugünü verir", () => {
    // UTC 21:30 -> Türkiye'de ertesi gün 00:30
    expect(todayInTurkey(new Date("2026-11-15T21:30:00Z"))).toBe("2026-11-16");
    expect(todayInTurkey(new Date("2026-11-15T20:59:00Z"))).toBe("2026-11-15");
  });

  it("gün farkı ve biçimlendirme", () => {
    expect(daysBetween("2026-11-15", "2026-11-18")).toBe(3);
    expect(formatDate("2026-11-05")).toBe("5 Kasım 2026");
    expect(formatDate("2026-01-31T10:00:00.000Z")).toBe("31 Ocak 2026");
  });
});

describe("computeQuote", () => {
  it("tek seferlik siparişte eşik altında kargo ücreti alır", () => {
    const quote = computeQuote([{ product: product("a", 20000), quantity: 2, intervalWeeks: null }]);
    expect(quote.subtotal).toBe(40000);
    expect(quote.subscriptionDiscount).toBe(0);
    expect(quote.shipping).toBe(SHIPPING_FEE);
    expect(quote.total).toBe(40000 + SHIPPING_FEE);
    expect(quote.freeShippingRemaining).toBe(FREE_SHIPPING_THRESHOLD - 40000);
  });

  it("eşik üzerinde kargo ücretsizdir", () => {
    const quote = computeQuote([{ product: product("a", 40000), quantity: 2, intervalWeeks: null }]);
    expect(quote.shipping).toBe(0);
    expect(quote.total).toBe(80000);
    expect(quote.freeShippingRemaining).toBe(0);
  });

  it("abonelik satırına %10 indirim uygular ve kargoyu ücretsiz yapar", () => {
    const quote = computeQuote([
      { product: product("a", 20000), quantity: 1, intervalWeeks: 4 },
      { product: product("b", 10000), quantity: 2, intervalWeeks: null },
    ]);
    expect(quote.lines[0].unitPrice).toBe(18000);
    expect(quote.lines[1].unitPrice).toBe(10000);
    expect(quote.subtotal).toBe(40000);
    expect(quote.subscriptionDiscount).toBe(2000);
    expect(quote.shipping).toBe(0);
    expect(quote.total).toBe(38000);
    expect(quote.hasSubscription).toBe(true);
  });

  it("kuruş yuvarlaması tutarlıdır", () => {
    expect(subscriptionUnitPrice(12995)).toBe(11696);
    const quote = computeQuote([{ product: product("a", 12995), quantity: 3, intervalWeeks: 2 }]);
    expect(quote.total).toBe(11696 * 3);
    expect(quote.subtotal - quote.subscriptionDiscount + quote.shipping).toBe(quote.total);
  });

  it("boş sepette her şey sıfırdır", () => {
    const quote = computeQuote([]);
    expect(quote.total).toBe(0);
    expect(quote.shipping).toBe(0);
  });
});

describe("sepet işlemleri", () => {
  const cartProduct = (id: string, price: number, subscribable = true): CartProduct => ({
    ...product(id, price),
    subscribable,
    stock: 50,
  });

  it("aynı ürün ve sıklık tek satırda birleşir, farklı sıklık ayrı satır olur", () => {
    let items = addToCart([], cartProduct("a", 10000), 1, null);
    items = addToCart(items, cartProduct("a", 10000), 2, null);
    items = addToCart(items, cartProduct("a", 10000), 1, 4);
    expect(items).toHaveLength(2);
    expect(items[0].quantity).toBe(3);
    expect(cartCount(items)).toBe(4);
    expect(cartToLines(items)).toEqual([
      { productId: "a", quantity: 3, intervalWeeks: null },
      { productId: "a", quantity: 1, intervalWeeks: 4 },
    ]);
  });

  it("adet üst sınırı aşılamaz, sıfır adet satırı siler", () => {
    let items = addToCart([], cartProduct("a", 10000), 15, null);
    items = addToCart(items, cartProduct("a", 10000), 15, null);
    expect(items[0].quantity).toBe(MAX_QUANTITY_PER_LINE);
    items = setCartQuantity(items, cartLineKey("a", null), 0);
    expect(items).toHaveLength(0);
  });

  it("sıklık değişince çakışan satırlar birleşir", () => {
    let items = addToCart([], cartProduct("a", 10000), 1, null);
    items = addToCart(items, cartProduct("a", 10000), 2, 4);
    items = setCartInterval(items, cartLineKey("a", null), 4);
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ quantity: 3, intervalWeeks: 4 });
    expect(cartQuote(items).total).toBe(27000);
  });

  it("abonelikle satılmayan ürün aboneliğe çevrilemez", () => {
    let items = addToCart([], cartProduct("a", 10000, false), 1, 4);
    expect(items[0].intervalWeeks).toBeNull();
    items = setCartInterval(items, cartLineKey("a", null), 8);
    expect(items[0].intervalWeeks).toBeNull();
    expect(removeFromCart(items, cartLineKey("a", null))).toHaveLength(0);
  });
});

describe("kart doğrulama", () => {
  it("Luhn kontrolü yapar", () => {
    expect(isValidCardNumber("4242 4242 4242 4242")).toBe(true);
    expect(isValidCardNumber("4000000000000002")).toBe(true);
    expect(isValidCardNumber("4242 4242 4242 4241")).toBe(false);
    expect(isValidCardNumber("1234")).toBe(false);
  });

  it("kart markasını tanır", () => {
    expect(cardBrand("4242424242424242")).toBe("Visa");
    expect(cardBrand("5555555555554444")).toBe("Mastercard");
    expect(cardBrand("9792030000000000")).toBe("Troy");
  });

  it("kart şeması boşlukları temizler ve 2 haneli yılı tamamlar", () => {
    const parsed = cardSchema.parse({
      cardHolder: "Ayşe Yılmaz",
      cardNumber: "4242 4242 4242 4242",
      expMonth: 12,
      expYear: 30,
      cvc: "123",
    });
    expect(parsed.cardNumber).toBe("4242424242424242");
    expect(parsed.expYear).toBe(2030);
  });
});

describe("form şemaları", () => {
  it("e-postayı küçük harfe çevirir ve kısa şifreyi reddeder", () => {
    const ok = registerSchema.parse({ name: "Ayşe Yılmaz", email: "  Ayse@Example.com ", password: "gizli-sifre" });
    expect(ok.email).toBe("ayse@example.com");
    expect(registerSchema.safeParse({ name: "Ayşe", email: "ayse@example.com", password: "kisa" }).success).toBe(false);
    expect(registerSchema.safeParse({ name: "Ayşe", email: "gecersiz", password: "gizli-sifre" }).success).toBe(false);
  });

  it("geçersiz abonelik sıklığını reddeder", () => {
    const base = {
      addressId: "3f1c2b1a-5d6e-4f70-8a9b-0c1d2e3f4a5b",
      paymentMethodId: "3f1c2b1a-5d6e-4f70-8a9b-0c1d2e3f4a5c",
    };
    const line = { productId: "3f1c2b1a-5d6e-4f70-8a9b-0c1d2e3f4a5d", quantity: 1 };
    expect(checkoutSchema.safeParse({ ...base, lines: [{ ...line, intervalWeeks: 4 }] }).success).toBe(true);
    expect(checkoutSchema.safeParse({ ...base, lines: [{ ...line, intervalWeeks: 3 }] }).success).toBe(false);
    expect(checkoutSchema.safeParse({ ...base, lines: [] }).success).toBe(false);
  });
});
