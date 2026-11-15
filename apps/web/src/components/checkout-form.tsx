"use client";

import {
  ApiError,
  addWeeks,
  cartQuote,
  cartToLines,
  errorMessage,
  formatDate,
  formatPrice,
  intervalLabel,
  maskedCard,
  todayInTurkey,
  type Address,
  type PaymentMethod,
} from "@patipaket/shared";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api";
import { useCart } from "@/lib/cart";
import { AddressForm, CardForm } from "./account-forms";
import { OrderTotals } from "./cart-view";
import { Icon } from "./icons";
import { ProductArt } from "./product-art";
import { EmptyState, Notice } from "./ui";

function Step({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return (
    <section className="card p-5 sm:p-7">
      <h2 className="flex items-center gap-3 text-xl font-semibold">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-600 font-sans text-sm font-bold text-white">
          {number}
        </span>
        {title}
      </h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function ChoiceCard({
  selected,
  onSelect,
  children,
}: {
  selected: boolean;
  onSelect: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={
        "flex w-full cursor-pointer items-start gap-3 rounded-2xl border-2 p-4 text-left transition " +
        (selected ? "border-brand-600 bg-brand-50/60" : "border-ink/10 bg-white hover:border-ink/25")
      }
    >
      <span
        className={
          "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 " +
          (selected ? "border-brand-600" : "border-ink/25")
        }
      >
        {selected && <span className="h-2.5 w-2.5 rounded-full bg-brand-600" />}
      </span>
      <span className="min-w-0 flex-1 text-sm">{children}</span>
    </button>
  );
}

export function CheckoutForm({
  initialAddresses,
  initialPaymentMethods,
  testMode,
}: {
  initialAddresses: Address[];
  initialPaymentMethods: PaymentMethod[];
  testMode: boolean;
}) {
  const router = useRouter();
  const { items, hydrated, clear } = useCart();

  const [addresses, setAddresses] = useState(initialAddresses);
  const [addressId, setAddressId] = useState(
    (initialAddresses.find((address) => address.isDefault) ?? initialAddresses[0])?.id ?? null,
  );
  const [addingAddress, setAddingAddress] = useState(initialAddresses.length === 0);

  const [paymentMethods, setPaymentMethods] = useState(initialPaymentMethods);
  const [paymentMethodId, setPaymentMethodId] = useState(
    (initialPaymentMethods.find((method) => method.isDefault) ?? initialPaymentMethods[0])?.id ?? null,
  );
  const [addingCard, setAddingCard] = useState(initialPaymentMethods.length === 0);

  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState<{ message: string; cartChanged: boolean } | null>(null);

  if (!hydrated || completed) {
    return <div className="card h-72 animate-pulse bg-white/60" aria-busy="true" />;
  }
  if (items.length === 0) {
    return (
      <EmptyState
        icon="cart"
        title="Sepetiniz boş"
        text="Ödeme adımına geçmek için önce sepetinize ürün ekleyin."
        action={
          <Link href="/urunler" className="btn btn-primary">
            Ürünlere göz at
          </Link>
        }
      />
    );
  }

  const quote = cartQuote(items);
  const today = todayInTurkey();
  const intervals = [...new Set(items.flatMap((item) => (item.intervalWeeks ? [item.intervalWeeks] : [])))].sort(
    (a, b) => a - b,
  );
  const needsConsent = quote.hasSubscription;
  const ready = Boolean(addressId && paymentMethodId && (!needsConsent || consent));

  async function placeOrder() {
    if (!addressId || !paymentMethodId) return;
    setSubmitting(true);
    setError(null);
    try {
      const { order } = await api.checkout({ lines: cartToLines(items), addressId, paymentMethodId });
      setCompleted(true);
      clear();
      router.push("/odeme/tamamlandi/" + order.id);
    } catch (caught) {
      const cartChanged = caught instanceof ApiError && (caught.code === "cart_changed" || caught.code === "out_of_stock");
      setError({ message: errorMessage(caught), cartChanged });
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
      <div className="space-y-5">
        <Step number={1} title="Teslimat adresi">
          <div className="space-y-3">
            {addresses.map((address) => (
              <ChoiceCard
                key={address.id}
                selected={address.id === addressId}
                onSelect={() => setAddressId(address.id)}
              >
                <span className="font-semibold text-ink">{address.title}</span>
                <span className="mt-0.5 block text-ink/65">
                  {address.fullName} · {address.phone}
                </span>
                <span className="block text-ink/65">
                  {address.line}, {address.district} / {address.city}
                </span>
              </ChoiceCard>
            ))}
            {addingAddress ? (
              <div className="rounded-2xl border border-ink/10 bg-cream p-5">
                <p className="mb-4 font-semibold">Yeni adres</p>
                <AddressForm
                  onSaved={(address) => {
                    setAddresses((list) => [...list.filter((item) => item.id !== address.id), address]);
                    setAddressId(address.id);
                    setAddingAddress(false);
                  }}
                  onCancel={addresses.length > 0 ? () => setAddingAddress(false) : undefined}
                />
              </div>
            ) : (
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setAddingAddress(true)}>
                <Icon name="plus" className="h-4 w-4" />
                Yeni adres ekle
              </button>
            )}
          </div>
        </Step>

        <Step number={2} title="Ödeme yöntemi">
          <div className="space-y-3">
            {paymentMethods.map((method) => (
              <ChoiceCard
                key={method.id}
                selected={method.id === paymentMethodId}
                onSelect={() => setPaymentMethodId(method.id)}
              >
                <span className="flex items-center gap-2 font-semibold text-ink">
                  <Icon name="card" className="h-4 w-4 text-ink/50" />
                  {maskedCard(method.brand, method.last4)}
                </span>
                <span className="mt-0.5 block text-ink/65">
                  {method.cardHolder} · {String(method.expMonth).padStart(2, "0")}/{String(method.expYear).slice(-2)}
                </span>
              </ChoiceCard>
            ))}
            {addingCard ? (
              <div className="rounded-2xl border border-ink/10 bg-cream p-5">
                <p className="mb-4 font-semibold">Yeni kart</p>
                <CardForm
                  testMode={testMode}
                  onSaved={(method) => {
                    setPaymentMethods((list) => [...list, method]);
                    setPaymentMethodId(method.id);
                    setAddingCard(false);
                  }}
                  onCancel={paymentMethods.length > 0 ? () => setAddingCard(false) : undefined}
                />
              </div>
            ) : (
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setAddingCard(true)}>
                <Icon name="plus" className="h-4 w-4" />
                Yeni kart ekle
              </button>
            )}
          </div>
        </Step>

        {intervals.length > 0 && (
          <Step number={3} title="Teslimat planı">
            <ul className="space-y-3">
              {intervals.map((weeks) => {
                const names = items
                  .filter((item) => item.intervalWeeks === weeks)
                  .map((item) => item.product.name + " ×" + item.quantity);
                return (
                  <li key={weeks} className="flex gap-3 rounded-2xl bg-brand-50/70 p-4">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-brand-700">
                      <Icon name="repeat" />
                    </span>
                    <div className="text-sm">
                      <p className="font-semibold text-ink">{intervalLabel(weeks)}</p>
                      <p className="mt-0.5 text-ink/65">{names.join(", ")}</p>
                      <p className="mt-1.5 text-ink/65">
                        İlk teslimat bu siparişle · sonraki teslimat{" "}
                        <strong className="text-ink">{formatDate(addWeeks(today, weeks))}</strong>
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
            <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl border border-ink/10 p-4 text-sm text-ink/75">
              <input
                type="checkbox"
                checked={consent}
                onChange={(event) => setConsent(event.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 rounded accent-brand-600"
              />
              <span>
                Abonelik ürünleri için seçtiğim sıklıkta sipariş oluşturulmasını ve tutarın her teslimat günü kayıtlı
                kartımdan otomatik tahsil edilmesini onaylıyorum. Aboneliği dilediğim an ücretsiz iptal edebilirim.
              </span>
            </label>
          </Step>
        )}
      </div>

      <aside className="lg:sticky lg:top-28 lg:self-start">
        <div className="card p-6">
          <h2 className="text-xl font-semibold">Sipariş özeti</h2>
          <ul className="mt-4 space-y-3">
            {quote.lines.map((line) => (
              <li key={line.productId + ":" + line.intervalWeeks} className="flex items-center gap-3">
                <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl">
                  <ProductArt product={line} />
                </span>
                <span className="min-w-0 flex-1 text-sm">
                  <span className="block truncate font-semibold">{line.name}</span>
                  <span className="block text-ink/55">
                    {line.quantity} adet · {line.intervalWeeks ? intervalLabel(line.intervalWeeks) : "Tek seferlik"}
                  </span>
                </span>
                <span className="text-sm font-semibold">{formatPrice(line.lineTotal)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-5 border-t border-ink/10 pt-5">
            <OrderTotals quote={quote} />
          </div>

          {error && (
            <Notice tone="error" className="mt-5">
              <p>{error.message}</p>
              {error.cartChanged && (
                <Link href="/sepet" className="mt-1 inline-block font-semibold underline">
                  Sepeti gözden geçir
                </Link>
              )}
            </Notice>
          )}

          <button
            type="button"
            className="btn btn-lg btn-primary mt-5 w-full"
            disabled={!ready || submitting}
            onClick={placeOrder}
          >
            {submitting ? "Ödeme alınıyor…" : "Siparişi tamamla · " + formatPrice(quote.total)}
          </button>
          {!ready && (
            <p className="mt-3 text-center text-[13px] text-ink/50">
              {!addressId
                ? "Devam etmek için teslimat adresi ekleyin."
                : !paymentMethodId
                  ? "Devam etmek için bir kart ekleyin."
                  : "Devam etmek için abonelik onayını işaretleyin."}
            </p>
          )}
          <p className="mt-4 flex items-center justify-center gap-1.5 text-[13px] text-ink/50">
            <Icon name="shield" className="h-4 w-4" />
            Güvenli ödeme
          </p>
        </div>
      </aside>
    </div>
  );
}
