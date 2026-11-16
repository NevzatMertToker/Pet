import { Ionicons } from "@expo/vector-icons";
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
import { Redirect, router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { ChoiceCard } from "@/components/choice";
import { AddressForm, CardForm } from "@/components/forms";
import { TotalsBlock } from "@/components/totals";
import { Button, Card, EmptyState, Notice, QueryView, Row, Screen, T } from "@/components/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { colors, fonts, radius, spacing } from "@/lib/theme";
import { useQuery } from "@/lib/use-query";

interface CheckoutData {
  addresses: Address[];
  paymentMethods: PaymentMethod[];
  testMode: boolean;
}

function StepTitle({ number, title }: { number: number; title: string }) {
  return (
    <Row style={styles.stepTitle}>
      <View style={styles.stepNumber}>
        <T style={styles.stepNumberText}>{number}</T>
      </View>
      <T variant="title">{title}</T>
    </Row>
  );
}

function CheckoutForm({ initial }: { initial: CheckoutData }) {
  const { items, clear } = useCart();
  const [addresses, setAddresses] = useState(initial.addresses);
  const [addressId, setAddressId] = useState(
    (initial.addresses.find((address) => address.isDefault) ?? initial.addresses[0])?.id ?? null,
  );
  const [addingAddress, setAddingAddress] = useState(initial.addresses.length === 0);
  const [paymentMethods, setPaymentMethods] = useState(initial.paymentMethods);
  const [paymentMethodId, setPaymentMethodId] = useState(
    (initial.paymentMethods.find((method) => method.isDefault) ?? initial.paymentMethods[0])?.id ?? null,
  );
  const [addingCard, setAddingCard] = useState(initial.paymentMethods.length === 0);
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<{ message: string; cartChanged: boolean } | null>(null);

  if (items.length === 0) {
    return (
      <Screen>
        <EmptyState
          icon="cart-outline"
          title="Sepetiniz boş"
          text="Ödeme adımına geçmek için önce sepetinize ürün ekleyin."
          action={<Button title="Ürünlere göz at" onPress={() => router.replace("/katalog")} />}
        />
      </Screen>
    );
  }

  const quote = cartQuote(items);
  const today = todayInTurkey();
  const intervals = [...new Set(items.flatMap((item) => (item.intervalWeeks ? [item.intervalWeeks] : [])))].sort(
    (a, b) => a - b,
  );
  const ready = Boolean(addressId && paymentMethodId && (!quote.hasSubscription || consent));
  const missing = !addressId
    ? "Devam etmek için teslimat adresi ekleyin."
    : !paymentMethodId
      ? "Devam etmek için bir kart ekleyin."
      : "Devam etmek için abonelik onayını işaretleyin.";

  async function placeOrder() {
    if (!addressId || !paymentMethodId) return;
    setSubmitting(true);
    setError(null);
    try {
      const { order } = await api.checkout({ lines: cartToLines(items), addressId, paymentMethodId });
      router.replace({ pathname: "/siparis/[id]", params: { id: order.id, yeni: "1" } });
      clear();
    } catch (caught) {
      const cartChanged = caught instanceof ApiError && (caught.code === "cart_changed" || caught.code === "out_of_stock");
      setError({ message: errorMessage(caught), cartChanged });
      setSubmitting(false);
    }
  }

  return (
    <Screen
      footer={
        <View style={styles.footer}>
          {error && <Notice tone="error">{error.message}</Notice>}
          {error?.cartChanged && <Button title="Sepeti gözden geçir" variant="outline" small onPress={() => router.push("/sepet")} />}
          {!ready && <T variant="small">{missing}</T>}
          <Button
            title={submitting ? "Ödeme alınıyor…" : "Siparişi tamamla · " + formatPrice(quote.total)}
            icon="lock-closed"
            loading={submitting}
            disabled={!ready}
            onPress={placeOrder}
          />
        </View>
      }
    >
      {/* ------------------------------------------------------ adres */}
      <Card style={styles.step}>
        <StepTitle number={1} title="Teslimat adresi" />
        {addresses.map((address) => (
          <ChoiceCard key={address.id} selected={address.id === addressId} onPress={() => setAddressId(address.id)}>
            <T variant="heading">{address.title}</T>
            <T variant="small">
              {address.fullName} · {address.phone}
            </T>
            <T variant="small">
              {address.line}, {address.district} / {address.city}
            </T>
          </ChoiceCard>
        ))}
        {addingAddress ? (
          <AddressForm
            onSaved={(address) => {
              setAddresses((list) => [...list, address]);
              setAddressId(address.id);
              setAddingAddress(false);
            }}
            onCancel={addresses.length > 0 ? () => setAddingAddress(false) : undefined}
          />
        ) : (
          <Button title="Yeni adres ekle" icon="add" variant="outline" small onPress={() => setAddingAddress(true)} />
        )}
      </Card>

      {/* ------------------------------------------------------ ödeme */}
      <Card style={styles.step}>
        <StepTitle number={2} title="Ödeme yöntemi" />
        {paymentMethods.map((method) => (
          <ChoiceCard
            key={method.id}
            selected={method.id === paymentMethodId}
            onPress={() => setPaymentMethodId(method.id)}
          >
            <T variant="heading">{maskedCard(method.brand, method.last4)}</T>
            <T variant="small">
              {method.cardHolder} · {String(method.expMonth).padStart(2, "0")}/{String(method.expYear).slice(-2)}
            </T>
          </ChoiceCard>
        ))}
        {addingCard ? (
          <CardForm
            testMode={initial.testMode}
            onSaved={(method) => {
              setPaymentMethods((list) => [...list, method]);
              setPaymentMethodId(method.id);
              setAddingCard(false);
            }}
            onCancel={paymentMethods.length > 0 ? () => setAddingCard(false) : undefined}
          />
        ) : (
          <Button title="Yeni kart ekle" icon="add" variant="outline" small onPress={() => setAddingCard(true)} />
        )}
      </Card>

      {/* ----------------------------------------------- teslimat planı */}
      {intervals.length > 0 && (
        <Card style={styles.step}>
          <StepTitle number={3} title="Teslimat planı" />
          {intervals.map((weeks) => (
            <View key={weeks} style={styles.plan}>
              <Row style={styles.planTitle}>
                <Ionicons name="repeat" size={18} color={colors.brand700} />
                <T variant="heading">{intervalLabel(weeks)}</T>
              </Row>
              <T variant="small">
                {items
                  .filter((item) => item.intervalWeeks === weeks)
                  .map((item) => item.product.name + " ×" + item.quantity)
                  .join(", ")}
              </T>
              <T variant="small">
                İlk teslimat bu siparişle · sonraki teslimat{" "}
                <T variant="small" style={styles.strong}>
                  {formatDate(addWeeks(today, weeks))}
                </T>
              </T>
            </View>
          ))}
          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: consent }}
            onPress={() => setConsent((value) => !value)}
            style={styles.consent}
          >
            <View style={[styles.checkbox, consent && styles.checkboxChecked]}>
              {consent && <Ionicons name="checkmark" size={16} color={colors.white} />}
            </View>
            <T variant="small" style={styles.consentText}>
              Abonelik ürünleri için seçtiğim sıklıkta sipariş oluşturulmasını ve tutarın her teslimat günü kayıtlı
              kartımdan otomatik tahsil edilmesini onaylıyorum. Aboneliği dilediğim an ücretsiz iptal edebilirim.
            </T>
          </Pressable>
        </Card>
      )}

      {/* --------------------------------------------------------- özet */}
      <Card style={styles.step}>
        <T variant="title">Sipariş özeti</T>
        {quote.lines.map((line) => (
          <Row key={line.productId + ":" + line.intervalWeeks} style={styles.summaryLine}>
            <View style={styles.flex}>
              <T variant="heading" numberOfLines={1}>
                {line.name}
              </T>
              <T variant="small">
                {line.quantity} adet · {line.intervalWeeks ? intervalLabel(line.intervalWeeks) : "Tek seferlik"}
              </T>
            </View>
            <T style={styles.strong}>{formatPrice(line.lineTotal)}</T>
          </Row>
        ))}
        <TotalsBlock
          totals={{
            subtotal: quote.subtotal,
            discount: quote.subscriptionDiscount,
            shipping: quote.shipping,
            total: quote.total,
          }}
        />
      </Card>
    </Screen>
  );
}

export default function CheckoutScreen() {
  const signedIn = useAuth((state) => state.token !== null);
  const query = useQuery<CheckoutData>(
    async () => {
      const [addresses, paymentMethods, config] = await Promise.all([
        api.addresses.list(),
        api.paymentMethods.list(),
        api.config(),
      ]);
      return {
        addresses: addresses.addresses,
        paymentMethods: paymentMethods.paymentMethods,
        testMode: config.paymentTestMode,
      };
    },
    "checkout",
    signedIn,
  );

  if (!signedIn) return <Redirect href={{ pathname: "/giris", params: { sonra: "/odeme" } }} />;
  return <QueryView query={query}>{(data) => <CheckoutForm initial={data} />}</QueryView>;
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  step: { gap: spacing.md },
  stepTitle: { gap: spacing.sm },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.brand600,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumberText: { fontFamily: fonts.bold, fontSize: 13, color: colors.white },
  plan: { backgroundColor: colors.brand50, borderRadius: radius.lg, padding: spacing.md, gap: 3 },
  planTitle: { gap: spacing.sm },
  strong: { fontFamily: fonts.semibold, color: colors.ink },
  consent: {
    flexDirection: "row",
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  consentText: { flex: 1 },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: "rgba(22,33,30,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: { backgroundColor: colors.brand600, borderColor: colors.brand600 },
  summaryLine: { justifyContent: "space-between" },
  footer: { gap: spacing.sm },
});
