"use client";

import {
  FREE_SHIPPING_THRESHOLD,
  SUBSCRIPTION_DISCOUNT_PERCENT,
  SUBSCRIPTION_INTERVALS,
  cartItemKey,
  cartQuote,
  cartToLines,
  formatPrice,
  intervalLabel,
  type CartItem,
  type Quote,
  type QuoteIssue,
} from "@patipaket/shared";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { useCart } from "@/lib/cart";
import { productHref } from "@/lib/routes";
import { Icon } from "./icons";
import { ProductArt } from "./product-art";
import { EmptyState, Notice, QuantityStepper } from "./ui";

export function OrderTotals({ quote }: { quote: Quote }) {
  return (
    <dl className="space-y-2.5 text-sm">
      <div className="flex justify-between">
        <dt className="text-ink/60">Ara toplam</dt>
        <dd className="font-medium">{formatPrice(quote.subtotal)}</dd>
      </div>
      {quote.subscriptionDiscount > 0 && (
        <div className="flex justify-between text-brand-700">
          <dt>Abonelik indirimi (%{SUBSCRIPTION_DISCOUNT_PERCENT})</dt>
          <dd className="font-semibold">−{formatPrice(quote.subscriptionDiscount)}</dd>
        </div>
      )}
      <div className="flex justify-between">
        <dt className="text-ink/60">Kargo</dt>
        <dd className={quote.shipping === 0 ? "font-semibold text-brand-700" : "font-medium"}>
          {quote.shipping === 0 ? "Ücretsiz" : formatPrice(quote.shipping)}
        </dd>
      </div>
      <div className="flex items-baseline justify-between border-t border-ink/10 pt-3">
        <dt className="font-semibold">Toplam</dt>
        <dd className="text-2xl font-bold">{formatPrice(quote.total)}</dd>
      </div>
    </dl>
  );
}

export function CartView() {
  const { items, hydrated, setQuantity, setInterval, remove, replace } = useCart();
  const [issues, setIssues] = useState<QuoteIssue[]>([]);
  const synced = useRef(false);

  // Sepet açıldığında fiyat ve stok bir kez sunucudan tazelenir.
  useEffect(() => {
    if (!hydrated || synced.current) return;
    synced.current = true;
    const current = useCart.getState().items;
    if (current.length === 0) return;

    api
      .quote(cartToLines(current))
      .then(({ quote, issues: found }) => {
        const byId = new Map(current.map((item) => [item.product.id, item.product]));
        const next: CartItem[] = quote.lines.flatMap((line) => {
          const known = byId.get(line.productId);
          if (!known) return [];
          return [
            {
              product: { ...known, name: line.name, brand: line.brand, packageSize: line.packageSize, price: line.listUnitPrice },
              quantity: line.quantity,
              intervalWeeks: line.intervalWeeks,
            },
          ];
        });
        replace(next);
        setIssues(found);
      })
      .catch(() => {
        // Çevrimdışıysa yerel sepetle devam edilir; kesin doğrulama ödeme adımında yapılır.
      });
  }, [hydrated, replace]);

  if (!hydrated) {
    return <div className="card h-64 animate-pulse bg-white/60" aria-busy="true" />;
  }

  if (items.length === 0) {
    return (
      <div className="space-y-4">
        {issues.length > 0 && (
          <Notice tone="warn">
            {issues.map((issue) => (
              <p key={issue.productId + issue.reason}>{issue.message}</p>
            ))}
          </Notice>
        )}
        <EmptyState
          icon="cart"
          title="Sepetiniz boş"
          text="Dostunuzun ihtiyaçlarını ekleyin; abonelikle her teslimatta %10 kazanın."
          action={
            <Link href="/urunler" className="btn btn-primary">
              Ürünlere göz at
            </Link>
          }
        />
      </div>
    );
  }

  const quote = cartQuote(items);
  const progress = Math.min(100, Math.round(((quote.total - quote.shipping) / FREE_SHIPPING_THRESHOLD) * 100));

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div className="space-y-4">
        {issues.length > 0 && (
          <Notice tone="warn">
            <p className="font-semibold">Sepetiniz güncellendi:</p>
            {issues.map((issue) => (
              <p key={issue.productId + issue.reason}>{issue.message}</p>
            ))}
          </Notice>
        )}

        <ul className="card divide-y divide-ink/[0.07]">
          {items.map((item) => {
            const key = cartItemKey(item);
            const line = quote.lines.find(
              (candidate) => candidate.productId === item.product.id && candidate.intervalWeeks === item.intervalWeeks,
            )!;
            return (
              <li key={key} className="flex gap-4 p-4 sm:p-5">
                <Link
                  href={productHref(item.product.slug)}
                  className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl sm:h-24 sm:w-24"
                >
                  <ProductArt product={item.product} />
                </Link>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold tracking-[0.08em] text-ink/45 uppercase">
                        {item.product.brand}
                      </p>
                      <Link href={productHref(item.product.slug)} className="font-semibold text-ink hover:underline">
                        {item.product.name}
                      </Link>
                      <p className="text-sm text-ink/55">{item.product.packageSize}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-bold">{formatPrice(line.lineTotal)}</p>
                      {line.unitPrice !== line.listUnitPrice && (
                        <p className="text-xs text-ink/40 line-through">
                          {formatPrice(line.listUnitPrice * line.quantity)}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2.5">
                    <QuantityStepper
                      size="sm"
                      value={item.quantity}
                      onChange={(value) => setQuantity(key, value)}
                      min={0}
                      max={Math.max(1, Math.min(20, item.product.stock))}
                    />
                    {item.product.subscribable && (
                      <div className="relative">
                        <Icon
                          name="repeat"
                          className={
                            "pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 " +
                            (item.intervalWeeks ? "text-brand-700" : "text-ink/40")
                          }
                        />
                        <select
                          aria-label="Teslimat sıklığı"
                          value={item.intervalWeeks ?? 0}
                          onChange={(event) => setInterval(key, Number(event.target.value) || null)}
                          className={
                            "cursor-pointer appearance-none rounded-full border py-2 pr-4 pl-9 text-[13px] font-semibold focus:ring-4 focus:ring-brand-500/15 focus:outline-none " +
                            (item.intervalWeeks
                              ? "border-brand-300 bg-brand-50 text-brand-800"
                              : "border-ink/15 bg-white text-ink/70")
                          }
                        >
                          <option value={0}>Tek seferlik</option>
                          {SUBSCRIPTION_INTERVALS.map((weeks) => (
                            <option key={weeks} value={weeks}>
                              {intervalLabel(weeks)} · %{SUBSCRIPTION_DISCOUNT_PERCENT} indirim
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => remove(key)}
                      className="ml-auto grid h-9 w-9 place-items-center rounded-full text-ink/40 transition hover:bg-red-50 hover:text-red-600"
                      aria-label={item.product.name + " ürününü sepetten çıkar"}
                    >
                      <Icon name="trash" className="h-[18px] w-[18px]" />
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <aside className="lg:sticky lg:top-28 lg:self-start">
        <div className="card p-6">
          <h2 className="text-xl font-semibold">Sipariş özeti</h2>

          {quote.freeShippingRemaining > 0 ? (
            <div className="mt-4 rounded-2xl bg-sand/70 p-3.5">
              <p className="text-[13px] leading-snug text-ink/70">
                Ücretsiz kargo için <strong className="text-ink">{formatPrice(quote.freeShippingRemaining)}</strong> daha
                ekleyin ya da bir ürünü aboneliğe çevirin.
              </p>
              <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-ink/10">
                <div className="h-full rounded-full bg-brand-500" style={{ width: progress + "%" }} />
              </div>
            </div>
          ) : (
            <p className="mt-4 flex items-center gap-2 rounded-2xl bg-brand-50 p-3.5 text-[13px] font-semibold text-brand-800">
              <Icon name="truck" className="h-4 w-4" />
              Kargonuz ücretsiz
            </p>
          )}

          <div className="mt-5">
            <OrderTotals quote={quote} />
          </div>

          <Link href="/odeme" className="btn btn-lg btn-primary mt-6 w-full">
            Ödemeye geç
            <Icon name="arrow-right" className="h-5 w-5" />
          </Link>

          {quote.hasSubscription && (
            <p className="mt-4 text-[13px] leading-relaxed text-ink/55">
              Abonelik ürünlerinin ilk teslimatı bu siparişle gelir; sonrakiler seçtiğiniz sıklıkta otomatik oluşturulur.
              Dilediğiniz an değiştirebilir veya iptal edebilirsiniz.
            </p>
          )}
        </div>
      </aside>
    </div>
  );
}
