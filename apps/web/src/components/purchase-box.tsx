"use client";

import {
  DEFAULT_SUBSCRIPTION_INTERVAL,
  MAX_QUANTITY_PER_LINE,
  SUBSCRIPTION_DISCOUNT_PERCENT,
  SUBSCRIPTION_INTERVALS,
  formatPrice,
  intervalHint,
  intervalLabel,
  subscriptionUnitPrice,
  toCartProduct,
  type Product,
} from "@patipaket/shared";
import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/lib/cart";
import { Icon } from "./icons";
import { QuantityStepper } from "./ui";

const PERKS = ["Her teslimatta ücretsiz kargo", "Dilediğinde atla, ertele veya iptal et", "Taahhüt ve cayma bedeli yok"];

export function PurchaseBox({ product }: { product: Product }) {
  const add = useCart((state) => state.add);
  const suggested =
    product.suggestedIntervalWeeks &&
    (SUBSCRIPTION_INTERVALS as readonly number[]).includes(product.suggestedIntervalWeeks)
      ? product.suggestedIntervalWeeks
      : null;

  const [mode, setMode] = useState<"subscribe" | "once">(product.subscribable ? "subscribe" : "once");
  const [intervalWeeks, setIntervalWeeks] = useState<number>(suggested ?? DEFAULT_SUBSCRIPTION_INTERVAL);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const soldOut = product.stock <= 0;
  const subscribing = mode === "subscribe" && product.subscribable;
  const unitPrice = subscribing ? subscriptionUnitPrice(product.price) : product.price;
  const maxQuantity = Math.max(1, Math.min(MAX_QUANTITY_PER_LINE, product.stock));

  function handleAdd() {
    add(toCartProduct(product), quantity, subscribing ? intervalWeeks : null);
    setAdded(true);
  }

  const optionClass = (active: boolean) =>
    "block w-full cursor-pointer rounded-3xl border-2 p-5 text-left transition " +
    (active ? "border-brand-600 bg-brand-50/60 shadow-soft" : "border-ink/10 bg-white hover:border-ink/25");

  const radio = (active: boolean) => (
    <span
      className={
        "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 " +
        (active ? "border-brand-600" : "border-ink/25")
      }
    >
      {active && <span className="h-2.5 w-2.5 rounded-full bg-brand-600" />}
    </span>
  );

  return (
    <div className="space-y-3">
      {product.subscribable && (
        <div className={optionClass(subscribing)}>
          <button
            type="button"
            className="flex w-full cursor-pointer items-start gap-3 text-left"
            onClick={() => setMode("subscribe")}
            aria-pressed={subscribing}
          >
            {radio(subscribing)}
            <span className="flex-1">
              <span className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-ink">Düzenli gönder</span>
                <span className="badge badge-accent">%{SUBSCRIPTION_DISCOUNT_PERCENT} indirim</span>
              </span>
              <span className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-ink">{formatPrice(subscriptionUnitPrice(product.price))}</span>
                <span className="text-sm text-ink/45 line-through">{formatPrice(product.price)}</span>
              </span>
            </span>
          </button>

          {subscribing && (
            <div className="mt-4 border-t border-brand-600/15 pt-4">
              <p className="text-sm font-semibold text-ink/80">Ne sıklıkla gelsin?</p>
              <div className="mt-2.5 flex flex-wrap gap-2" role="radiogroup" aria-label="Teslimat sıklığı">
                {SUBSCRIPTION_INTERVALS.map((weeks) => {
                  const active = weeks === intervalWeeks;
                  return (
                    <button
                      key={weeks}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setIntervalWeeks(weeks)}
                      className={
                        "relative cursor-pointer rounded-full border px-3.5 py-2 text-sm font-semibold transition " +
                        (active
                          ? "border-brand-600 bg-brand-600 text-white"
                          : "border-ink/15 bg-white text-ink/75 hover:border-ink/35")
                      }
                    >
                      {intervalLabel(weeks)}
                      {weeks === suggested && (
                        <span className="absolute -top-2 -right-1 rounded-full bg-accent-400 px-1.5 text-[10px] leading-4 font-bold text-ink">
                          önerilen
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              <p className="mt-2.5 text-[13px] text-ink/55">{intervalHint(intervalWeeks)}. Sıklığı sonradan değiştirebilirsin.</p>
              <ul className="mt-4 space-y-1.5">
                {PERKS.map((perk) => (
                  <li key={perk} className="flex items-center gap-2 text-sm text-ink/75">
                    <Icon name="check" className="h-4 w-4 text-brand-600" />
                    {perk}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <button type="button" className={optionClass(!subscribing)} onClick={() => setMode("once")} aria-pressed={!subscribing}>
        <span className="flex items-start gap-3">
          {radio(!subscribing)}
          <span className="flex-1">
            <span className="font-semibold text-ink">Tek seferlik satın al</span>
            <span className="mt-1 block text-2xl font-bold text-ink">{formatPrice(product.price)}</span>
          </span>
        </span>
      </button>

      <div className="flex flex-wrap items-center gap-3 pt-3">
        <QuantityStepper value={quantity} onChange={setQuantity} max={maxQuantity} />
        <button type="button" className="btn btn-lg btn-primary min-w-52 flex-1" onClick={handleAdd} disabled={soldOut}>
          {soldOut ? (
            "Stokta yok"
          ) : (
            <>
              <Icon name="cart" />
              Sepete ekle · {formatPrice(unitPrice * quantity)}
            </>
          )}
        </button>
      </div>

      {added && (
        <div
          role="status"
          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm"
        >
          <span className="flex items-center gap-2 font-medium text-brand-900">
            <Icon name="check" className="h-4 w-4" />
            Sepete eklendi
          </span>
          <Link href="/sepet" className="btn btn-sm btn-primary">
            Sepete git
            <Icon name="arrow-right" className="h-4 w-4" />
          </Link>
        </div>
      )}

      {!soldOut && product.stock <= 5 && (
        <p className="text-sm font-medium text-accent-700">Son {product.stock} adet — acele edin.</p>
      )}
    </div>
  );
}
