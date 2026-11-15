"use client";

import {
  SUBSCRIPTION_INTERVALS,
  addDays,
  errorMessage,
  formatDate,
  formatPrice,
  intervalLabel,
  maskedCard,
  todayInTurkey,
  type Address,
  type PaymentMethod,
  type Subscription,
  type SubscriptionAction,
} from "@patipaket/shared";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api";
import { productHref } from "@/lib/routes";
import { Icon, type IconName } from "./icons";
import { SubscriptionStatusBadge } from "./order-summary";
import { ProductArt } from "./product-art";
import { Notice, QuantityStepper } from "./ui";

function Section({ icon, title, children }: { icon: IconName; title: string; children: React.ReactNode }) {
  return (
    <section className="card p-5 sm:p-6">
      <h2 className="flex items-center gap-2.5 text-lg font-semibold">
        <Icon name={icon} className="h-5 w-5 text-brand-600" />
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function SubscriptionManager({
  initial,
  addresses,
  paymentMethods,
}: {
  initial: Subscription;
  addresses: Address[];
  paymentMethods: PaymentMethod[];
}) {
  const router = useRouter();
  const [subscription, setSubscription] = useState(initial);
  const [pending, setPending] = useState<string | null>(null);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [date, setDate] = useState(initial.nextDeliveryDate);
  const [quantities, setQuantities] = useState<Record<string, number>>(
    Object.fromEntries(initial.items.map((item) => [item.productId, item.quantity])),
  );

  const today = todayInTurkey();
  const active = subscription.status === "active";
  const paused = subscription.status === "paused";
  const cancelled = subscription.status === "cancelled";
  const busy = pending !== null;

  function adopt(next: Subscription) {
    setSubscription(next);
    setDate(next.nextDeliveryDate);
    setQuantities(Object.fromEntries(next.items.map((item) => [item.productId, item.quantity])));
  }

  /** Bir API çağrısını çalıştırır, dönen aboneliği ekrana yansıtır ve sonucu bildirir. */
  async function run(key: string, call: () => Promise<{ subscription: Subscription }>, success: string) {
    setPending(key);
    setMessage(null);
    try {
      const result = await call();
      adopt(result.subscription);
      setMessage({ tone: "success", text: success });
      router.refresh();
    } catch (caught) {
      setMessage({ tone: "error", text: errorMessage(caught) });
    } finally {
      setPending(null);
      setConfirmingCancel(false);
    }
  }

  const act = (action: SubscriptionAction, success: string) =>
    run(action, () => api.subscriptions.action(subscription.id, action), success);

  const remainingItems = subscription.items.filter((item) => (quantities[item.productId] ?? 0) > 0);
  const itemsDirty = subscription.items.some((item) => quantities[item.productId] !== item.quantity);

  return (
    <div className="space-y-5">
      {/* --------------------------------------------------------- özet */}
      <div className="overflow-hidden rounded-3xl bg-brand-800 p-6 text-white shadow-soft sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <SubscriptionStatusBadge status={subscription.status} />
            <p className="mt-3 text-sm font-medium text-white/60">
              {active ? "Sonraki teslimat" : paused ? "Teslimatlar durduruldu" : "Abonelik sonlandı"}
            </p>
            <p className="font-display text-3xl font-semibold sm:text-4xl">
              {active ? formatDate(subscription.nextDeliveryDate) : paused ? "Duraklatıldı" : "İptal edildi"}
            </p>
            <p className="mt-2 text-white/75">
              {intervalLabel(subscription.intervalWeeks)} · teslimat başına{" "}
              <strong className="text-white">{formatPrice(subscription.estimatedTotal)}</strong>
            </p>
          </div>
          {!cancelled && (
            <div className="flex flex-wrap gap-2">
              {active && (
                <>
                  <button
                    type="button"
                    className="btn btn-accent"
                    disabled={busy}
                    onClick={() => act("ship-now", "Teslimatınız oluşturuldu; siparişlerim sayfasından takip edebilirsiniz.")}
                  >
                    <Icon name="zap" className="h-4 w-4" />
                    {pending === "ship-now" ? "Gönderiliyor…" : "Hemen gönder"}
                  </button>
                  <button
                    type="button"
                    className="btn bg-white/12 text-white hover:bg-white/20"
                    disabled={busy}
                    onClick={() => act("skip", "Bu teslimat atlandı.")}
                  >
                    <Icon name="skip" className="h-4 w-4" />
                    Bu teslimatı atla
                  </button>
                  <button
                    type="button"
                    className="btn bg-white/12 text-white hover:bg-white/20"
                    disabled={busy}
                    onClick={() => act("pause", "Abonelik duraklatıldı. Dilediğiniz zaman devam ettirebilirsiniz.")}
                  >
                    <Icon name="pause" className="h-4 w-4" />
                    Duraklat
                  </button>
                </>
              )}
              {paused && (
                <button
                  type="button"
                  className="btn btn-accent"
                  disabled={busy}
                  onClick={() => act("resume", "Abonelik yeniden aktif.")}
                >
                  <Icon name="play" className="h-4 w-4" />
                  Devam ettir
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {message && <Notice tone={message.tone}>{message.text}</Notice>}

      {subscription.lastRenewalError && !cancelled && (
        <Notice tone="warn">
          <p className="font-semibold">Son teslimat oluşturulamadı</p>
          <p>{subscription.lastRenewalError}</p>
          {subscription.pauseReason === "payment_failed" && (
            <p className="mt-1">
              Ödeme üst üste alınamadığı için abonelik duraklatıldı. Aşağıdan ödeme yöntemini güncelleyip “Devam ettir”e
              basabilirsiniz.
            </p>
          )}
        </Notice>
      )}

      {cancelled ? (
        <div className="card p-6 text-center">
          <p className="text-ink/65">Bu abonelik iptal edildi; artık teslimat oluşturulmayacak.</p>
          <Link href="/urunler" className="btn btn-primary mt-4">
            Yeni abonelik oluştur
          </Link>
        </div>
      ) : (
        <>
          {/* ---------------------------------------------------- sıklık */}
          <Section icon="repeat" title="Teslimat sıklığı">
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Teslimat sıklığı">
              {SUBSCRIPTION_INTERVALS.map((weeks) => {
                const selected = weeks === subscription.intervalWeeks;
                return (
                  <button
                    key={weeks}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    disabled={busy}
                    onClick={() =>
                      !selected &&
                      run(
                        "interval",
                        () => api.subscriptions.update(subscription.id, { intervalWeeks: weeks }),
                        "Teslimat sıklığı " + intervalLabel(weeks).toLocaleLowerCase("tr") + " olarak güncellendi.",
                      )
                    }
                    className={
                      "cursor-pointer rounded-full border px-4 py-2 text-sm font-semibold transition " +
                      (selected
                        ? "border-brand-600 bg-brand-600 text-white"
                        : "border-ink/15 bg-white text-ink/75 hover:border-ink/35")
                    }
                  >
                    {intervalLabel(weeks)}
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-[13px] text-ink/55">
              Yeni sıklık bir sonraki teslimattan sonra geçerli olur; sıradaki teslimat tarihi değişmez.
            </p>
          </Section>

          {/* ----------------------------------------------------- tarih */}
          <Section icon="calendar" title="Sonraki teslimat tarihi">
            <div className="flex flex-wrap items-end gap-3">
              <label className="block">
                <span className="label">Tarih</span>
                <input
                  type="date"
                  className="input w-52"
                  value={date}
                  min={addDays(today, 1)}
                  max={addDays(today, 180)}
                  onChange={(event) => setDate(event.target.value)}
                />
              </label>
              <button
                type="button"
                className="btn btn-outline"
                disabled={busy || !date || date === subscription.nextDeliveryDate}
                onClick={() =>
                  run(
                    "date",
                    () => api.subscriptions.update(subscription.id, { nextDeliveryDate: date }),
                    "Sonraki teslimat " + formatDate(date) + " olarak ayarlandı.",
                  )
                }
              >
                Tarihi güncelle
              </button>
            </div>
            {paused && (
              <p className="mt-3 text-[13px] text-ink/55">Abonelik duraklatılmışken teslimat oluşturulmaz.</p>
            )}
          </Section>

          {/* ---------------------------------------------------- ürünler */}
          <Section icon="package" title="Abonelikteki ürünler">
            <ul className="divide-y divide-ink/[0.07]">
              {subscription.items.map((item) => {
                const quantity = quantities[item.productId] ?? 0;
                return (
                  <li key={item.id} className={"flex items-center gap-4 py-3.5 " + (quantity === 0 ? "opacity-45" : "")}>
                    <Link href={productHref(item.slug)} className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl">
                      <ProductArt product={item} />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{item.name}</p>
                      <p className="text-sm text-ink/55">
                        {item.brand} · {item.packageSize} · {formatPrice(item.unitPrice)}
                      </p>
                      {!item.available && <span className="badge badge-warn mt-1">Şu an stokta yok</span>}
                      {quantity === 0 && <span className="badge badge-muted mt-1">Çıkarılacak</span>}
                    </div>
                    <QuantityStepper
                      size="sm"
                      min={0}
                      value={quantity}
                      onChange={(value) => setQuantities((current) => ({ ...current, [item.productId]: value }))}
                    />
                  </li>
                );
              })}
            </ul>
            {itemsDirty && (
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={busy || remainingItems.length === 0}
                  onClick={() =>
                    run(
                      "items",
                      () =>
                        api.subscriptions.setItems(subscription.id, {
                          items: remainingItems.map((item) => ({
                            productId: item.productId,
                            quantity: quantities[item.productId],
                          })),
                        }),
                      "Abonelikteki ürünler güncellendi.",
                    )
                  }
                >
                  Değişiklikleri kaydet
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() =>
                    setQuantities(Object.fromEntries(subscription.items.map((item) => [item.productId, item.quantity])))
                  }
                >
                  Vazgeç
                </button>
                {remainingItems.length === 0 && (
                  <p className="text-[13px] text-ink/55">
                    Abonelikte en az bir ürün kalmalı. Tümünü bırakmak için aboneliği iptal edin.
                  </p>
                )}
              </div>
            )}
          </Section>

          {/* ------------------------------------------- adres ve ödeme */}
          <div className="grid gap-5 md:grid-cols-2">
            <Section icon="pin" title="Teslimat adresi">
              <select
                className="input"
                aria-label="Teslimat adresi"
                disabled={busy}
                value={subscription.address?.id ?? ""}
                onChange={(event) =>
                  run(
                    "address",
                    () => api.subscriptions.update(subscription.id, { addressId: event.target.value }),
                    "Teslimat adresi güncellendi.",
                  )
                }
              >
                {addresses.map((address) => (
                  <option key={address.id} value={address.id}>
                    {address.title} — {address.district} / {address.city}
                  </option>
                ))}
              </select>
              {subscription.address && (
                <p className="mt-3 text-sm leading-relaxed text-ink/65">
                  {subscription.address.fullName}
                  <br />
                  {subscription.address.line}, {subscription.address.district} / {subscription.address.city}
                </p>
              )}
              <Link href="/hesap/adresler" className="link mt-3 inline-block text-sm">
                Adreslerimi yönet
              </Link>
            </Section>

            <Section icon="card" title="Ödeme yöntemi">
              <select
                className="input"
                aria-label="Ödeme yöntemi"
                disabled={busy}
                value={subscription.paymentMethod?.id ?? ""}
                onChange={(event) =>
                  run(
                    "payment",
                    () => api.subscriptions.update(subscription.id, { paymentMethodId: event.target.value }),
                    "Ödeme yöntemi güncellendi.",
                  )
                }
              >
                {paymentMethods.map((method) => (
                  <option key={method.id} value={method.id}>
                    {maskedCard(method.brand, method.last4)}
                  </option>
                ))}
              </select>
              <p className="mt-3 text-sm leading-relaxed text-ink/65">
                Her teslimatın tutarı, teslimat günü bu karttan tahsil edilir.
              </p>
              <Link href="/hesap/odeme-yontemleri" className="link mt-3 inline-block text-sm">
                Kartlarımı yönet
              </Link>
            </Section>
          </div>

          {/* ------------------------------------------------------ iptal */}
          <div className="rounded-3xl border border-ink/10 p-5 sm:p-6">
            {confirmingCancel ? (
              <div>
                <p className="font-semibold">Aboneliği iptal etmek istediğinize emin misiniz?</p>
                <p className="mt-1 text-sm text-ink/60">
                  İptalden sonra teslimat oluşturulmaz ve kartınızdan tahsilat yapılmaz. Ara vermek isterseniz
                  duraklatmayı deneyebilirsiniz.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="btn btn-danger"
                    disabled={busy}
                    onClick={() => act("cancel", "Aboneliğiniz iptal edildi.")}
                  >
                    {pending === "cancel" ? "İptal ediliyor…" : "Evet, iptal et"}
                  </button>
                  <button type="button" className="btn btn-outline" onClick={() => setConfirmingCancel(false)}>
                    Vazgeç
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-ink/60">Aboneliğe artık ihtiyacınız yok mu? Taahhüt ve cayma bedeli yoktur.</p>
                <button type="button" className="btn btn-danger btn-sm" onClick={() => setConfirmingCancel(true)}>
                  Aboneliği iptal et
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
