import {
  SUBSCRIPTION_INTERVALS,
  addDays,
  addWeeks,
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
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { ProductArt } from "@/components/art";
import { ChoiceCard } from "@/components/choice";
import { SubscriptionStatusBadge } from "@/components/status";
import {
  Badge,
  Button,
  Card,
  Chip,
  Notice,
  QuantityStepper,
  QueryView,
  Row,
  Screen,
  T,
} from "@/components/ui";
import { api } from "@/lib/api";
import { colors, fonts, spacing } from "@/lib/theme";
import { useQuery } from "@/lib/use-query";

interface ManagerData {
  subscription: Subscription;
  addresses: Address[];
  paymentMethods: PaymentMethod[];
}

function Manager({ initial }: { initial: ManagerData }) {
  const [subscription, setSubscription] = useState(initial.subscription);
  const [pending, setPending] = useState<string | null>(null);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [quantities, setQuantities] = useState<Record<string, number>>(
    Object.fromEntries(initial.subscription.items.map((item) => [item.productId, item.quantity])),
  );

  const today = todayInTurkey();
  const active = subscription.status === "active";
  const paused = subscription.status === "paused";
  const cancelled = subscription.status === "cancelled";
  const busy = pending !== null;

  async function run(key: string, call: () => Promise<{ subscription: Subscription }>, success: string) {
    setPending(key);
    setMessage(null);
    try {
      const result = await call();
      setSubscription(result.subscription);
      setQuantities(Object.fromEntries(result.subscription.items.map((item) => [item.productId, item.quantity])));
      setMessage({ tone: "success", text: success });
    } catch (caught) {
      setMessage({ tone: "error", text: errorMessage(caught) });
    } finally {
      setPending(null);
      setConfirmingCancel(false);
    }
  }

  const act = (action: SubscriptionAction, success: string) =>
    run(action, () => api.subscriptions.action(subscription.id, action), success);

  const moveDate = (weeks: number) => {
    const next = addWeeks(subscription.nextDeliveryDate, weeks);
    return run(
      "date",
      () => api.subscriptions.update(subscription.id, { nextDeliveryDate: next }),
      "Sonraki teslimat " + formatDate(next) + " olarak ayarlandı.",
    );
  };
  const canMoveEarlier = addWeeks(subscription.nextDeliveryDate, -1) > today;
  const canMoveLater = addWeeks(subscription.nextDeliveryDate, 1) <= addDays(today, 180);

  const remaining = subscription.items.filter((item) => (quantities[item.productId] ?? 0) > 0);
  const itemsDirty = subscription.items.some((item) => quantities[item.productId] !== item.quantity);

  return (
    <Screen>
      {/* --------------------------------------------------------- özet */}
      <View style={styles.summary}>
        <SubscriptionStatusBadge status={subscription.status} />
        <T style={styles.summaryLabel}>
          {active ? "Sonraki teslimat" : paused ? "Teslimatlar durduruldu" : "Abonelik sonlandı"}
        </T>
        <T style={styles.summaryDate}>
          {active ? formatDate(subscription.nextDeliveryDate) : paused ? "Duraklatıldı" : "İptal edildi"}
        </T>
        <T style={styles.summaryMeta}>
          {intervalLabel(subscription.intervalWeeks)} · teslimat başına {formatPrice(subscription.estimatedTotal)}
        </T>
        {active && (
          <View style={styles.actions}>
            <Button
              title="Hemen gönder"
              icon="flash"
              variant="accent"
              loading={pending === "ship-now"}
              disabled={busy}
              onPress={() => act("ship-now", "Teslimatınız oluşturuldu; siparişlerim sayfasından takip edebilirsiniz.")}
            />
            <Row>
              <Button
                title="Atla"
                icon="play-skip-forward"
                variant="onDark"
                disabled={busy}
                style={styles.flex}
                onPress={() => act("skip", "Bu teslimat atlandı.")}
              />
              <Button
                title="Duraklat"
                icon="pause"
                variant="onDark"
                disabled={busy}
                style={styles.flex}
                onPress={() => act("pause", "Abonelik duraklatıldı. Dilediğiniz zaman devam ettirebilirsiniz.")}
              />
            </Row>
          </View>
        )}
        {paused && (
          <Button
            title="Devam ettir"
            icon="play"
            variant="accent"
            disabled={busy}
            style={styles.resume}
            onPress={() => act("resume", "Abonelik yeniden aktif.")}
          />
        )}
      </View>

      {message && <Notice tone={message.tone}>{message.text}</Notice>}
      {subscription.lastRenewalError && !cancelled && (
        <Notice tone="warn">
          {subscription.lastRenewalError}
          {subscription.pauseReason === "payment_failed"
            ? "\nÖdeme üst üste alınamadığı için abonelik duraklatıldı. Ödeme yöntemini güncelleyip “Devam ettir”e basabilirsiniz."
            : ""}
        </Notice>
      )}

      {cancelled ? (
        <Card style={styles.section}>
          <T>Bu abonelik iptal edildi; artık teslimat oluşturulmayacak.</T>
          <Button title="Yeni abonelik oluştur" onPress={() => router.push("/katalog")} />
        </Card>
      ) : (
        <>
          <Card style={styles.section}>
            <T variant="title">Teslimat sıklığı</T>
            <View style={styles.chips}>
              {SUBSCRIPTION_INTERVALS.map((weeks) => (
                <Chip
                  key={weeks}
                  label={intervalLabel(weeks)}
                  selected={weeks === subscription.intervalWeeks}
                  onPress={() => {
                    if (busy || weeks === subscription.intervalWeeks) return;
                    void run(
                      "interval",
                      () => api.subscriptions.update(subscription.id, { intervalWeeks: weeks }),
                      "Teslimat sıklığı " + intervalLabel(weeks).toLocaleLowerCase("tr") + " olarak güncellendi.",
                    );
                  }}
                />
              ))}
            </View>
            <T variant="small">Yeni sıklık bir sonraki teslimattan sonra geçerli olur.</T>
          </Card>

          <Card style={styles.section}>
            <T variant="title">Sonraki teslimat tarihi</T>
            <T variant="heading">{formatDate(subscription.nextDeliveryDate)}</T>
            <Row>
              <Button
                title="1 hafta öne al"
                variant="outline"
                small
                disabled={busy || !canMoveEarlier}
                style={styles.flex}
                onPress={() => moveDate(-1)}
              />
              <Button
                title="1 hafta ertele"
                variant="outline"
                small
                disabled={busy || !canMoveLater}
                style={styles.flex}
                onPress={() => moveDate(1)}
              />
            </Row>
          </Card>

          <Card style={styles.section}>
            <T variant="title">Abonelikteki ürünler</T>
            {subscription.items.map((item) => {
              const quantity = quantities[item.productId] ?? 0;
              return (
                <Row key={item.id} style={quantity === 0 ? styles.removed : undefined}>
                  <ProductArt product={item} style={styles.thumb} rounded={14} />
                  <View style={styles.flex}>
                    <T variant="heading" numberOfLines={2}>
                      {item.name}
                    </T>
                    <T variant="small">
                      {item.packageSize} · {formatPrice(item.unitPrice)}
                    </T>
                    {!item.available && <Badge label="Şu an stokta yok" tone="warn" />}
                    {quantity === 0 && <Badge label="Çıkarılacak" tone="muted" />}
                  </View>
                  <QuantityStepper
                    value={quantity}
                    min={0}
                    onChange={(value) => setQuantities((current) => ({ ...current, [item.productId]: value }))}
                  />
                </Row>
              );
            })}
            {itemsDirty && (
              <>
                {remaining.length === 0 && (
                  <T variant="small">Abonelikte en az bir ürün kalmalı. Tümünü bırakmak için aboneliği iptal edin.</T>
                )}
                <Button
                  title="Değişiklikleri kaydet"
                  loading={pending === "items"}
                  disabled={busy || remaining.length === 0}
                  onPress={() =>
                    run(
                      "items",
                      () =>
                        api.subscriptions.setItems(subscription.id, {
                          items: remaining.map((item) => ({ productId: item.productId, quantity: quantities[item.productId] })),
                        }),
                      "Abonelikteki ürünler güncellendi.",
                    )
                  }
                />
              </>
            )}
          </Card>

          <Card style={styles.section}>
            <T variant="title">Teslimat adresi</T>
            {initial.addresses.map((address) => (
              <ChoiceCard
                key={address.id}
                selected={address.id === subscription.address?.id}
                onPress={() => {
                  if (busy || address.id === subscription.address?.id) return;
                  void run(
                    "address",
                    () => api.subscriptions.update(subscription.id, { addressId: address.id }),
                    "Teslimat adresi güncellendi.",
                  );
                }}
              >
                <T variant="heading">{address.title}</T>
                <T variant="small">
                  {address.line}, {address.district} / {address.city}
                </T>
              </ChoiceCard>
            ))}
            <Button title="Adreslerimi yönet" variant="ghost" small onPress={() => router.push("/adresler")} />
          </Card>

          <Card style={styles.section}>
            <T variant="title">Ödeme yöntemi</T>
            {initial.paymentMethods.map((method) => (
              <ChoiceCard
                key={method.id}
                selected={method.id === subscription.paymentMethod?.id}
                onPress={() => {
                  if (busy || method.id === subscription.paymentMethod?.id) return;
                  void run(
                    "payment",
                    () => api.subscriptions.update(subscription.id, { paymentMethodId: method.id }),
                    "Ödeme yöntemi güncellendi.",
                  );
                }}
              >
                <T variant="heading">{maskedCard(method.brand, method.last4)}</T>
                <T variant="small">{method.cardHolder}</T>
              </ChoiceCard>
            ))}
            <Button title="Kartlarımı yönet" variant="ghost" small onPress={() => router.push("/kartlar")} />
          </Card>

          <Card style={styles.section}>
            {confirmingCancel ? (
              <>
                <T variant="heading">Aboneliği iptal etmek istediğinize emin misiniz?</T>
                <T variant="small">
                  İptalden sonra teslimat oluşturulmaz ve kartınızdan tahsilat yapılmaz. Ara vermek isterseniz
                  duraklatmayı deneyebilirsiniz.
                </T>
                <Row>
                  <Button
                    title="Evet, iptal et"
                    variant="danger"
                    loading={pending === "cancel"}
                    disabled={busy}
                    style={styles.flex}
                    onPress={() => act("cancel", "Aboneliğiniz iptal edildi.")}
                  />
                  <Button title="Vazgeç" variant="outline" style={styles.flex} onPress={() => setConfirmingCancel(false)} />
                </Row>
              </>
            ) : (
              <>
                <T variant="small">Aboneliğe artık ihtiyacınız yok mu? Taahhüt ve cayma bedeli yoktur.</T>
                <Button title="Aboneliği iptal et" variant="danger" small onPress={() => setConfirmingCancel(true)} />
              </>
            )}
          </Card>
        </>
      )}
    </Screen>
  );
}

export default function SubscriptionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const query = useQuery<ManagerData>(async () => {
    const [subscription, addresses, paymentMethods] = await Promise.all([
      api.subscriptions.get(id),
      api.addresses.list(),
      api.paymentMethods.list(),
    ]);
    return {
      subscription: subscription.subscription,
      addresses: addresses.addresses,
      paymentMethods: paymentMethods.paymentMethods,
    };
  }, "subscription:" + id);

  return (
    <QueryView query={query}>
      {(data) => (
        // Adres/kart listesi değişip ekrana dönüldüğünde form güncel veriyle yeniden kurulur.
        <Manager
          key={data.addresses.length + ":" + data.paymentMethods.length + ":" + data.subscription.id}
          initial={data}
        />
      )}
    </QueryView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  summary: { backgroundColor: colors.brand800, borderRadius: 28, padding: spacing.xl, gap: 4 },
  summaryLabel: { fontFamily: fonts.medium, fontSize: 14, color: "rgba(255,255,255,0.65)", marginTop: spacing.md },
  summaryDate: { fontFamily: fonts.display, fontSize: 32, lineHeight: 38, color: colors.white },
  summaryMeta: { fontFamily: fonts.regular, fontSize: 15, color: "rgba(255,255,255,0.8)" },
  actions: { marginTop: spacing.lg, gap: spacing.sm },
  resume: { marginTop: spacing.lg },
  section: { gap: spacing.md },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  thumb: { width: 58 },
  removed: { opacity: 0.45 },
});
