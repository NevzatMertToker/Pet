import { Ionicons } from "@expo/vector-icons";
import {
  MAX_QUANTITY_PER_LINE,
  SUBSCRIPTION_DISCOUNT_PERCENT,
  SUBSCRIPTION_INTERVALS,
  cartItemKey,
  cartQuote,
  cartToLines,
  formatPrice,
  intervalLabel,
  type CartItem,
  type QuoteIssue,
} from "@patipaket/shared";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { ProductArt } from "@/components/art";
import { TotalsBlock } from "@/components/totals";
import { Button, Card, Chip, EmptyState, Notice, QuantityStepper, Row, Screen, T } from "@/components/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { colors, fonts, spacing } from "@/lib/theme";

export default function CartScreen() {
  const { items, setQuantity, setInterval, remove, replace } = useCart();
  const signedIn = useAuth((state) => state.token !== null);
  const [issues, setIssues] = useState<QuoteIssue[]>([]);

  // Sepet her açıldığında fiyat ve stok sunucudan tazelenir.
  useFocusEffect(
    useCallback(() => {
      const current = useCart.getState().items;
      if (current.length === 0) return;
      let cancelled = false;
      api
        .quote(cartToLines(current))
        .then(({ quote, issues: found }) => {
          if (cancelled) return;
          const known = new Map(current.map((item) => [item.product.id, item.product]));
          const next: CartItem[] = quote.lines.flatMap((line) => {
            const product = known.get(line.productId);
            if (!product) return [];
            return [
              {
                product: { ...product, name: line.name, brand: line.brand, packageSize: line.packageSize, price: line.listUnitPrice },
                quantity: line.quantity,
                intervalWeeks: line.intervalWeeks,
              },
            ];
          });
          replace(next);
          setIssues(found);
        })
        .catch(() => {
          // Çevrimdışıyken yerel sepet gösterilir; kesin doğrulama ödeme adımında yapılır.
        });
      return () => {
        cancelled = true;
      };
    }, [replace]),
  );

  const issueNotice = issues.length > 0 && (
    <Notice tone="warn">{issues.map((issue) => issue.message).join("\n")}</Notice>
  );

  if (items.length === 0) {
    return (
      <Screen>
        {issueNotice}
        <EmptyState
          icon="cart-outline"
          title="Sepetiniz boş"
          text="Dostunuzun ihtiyaçlarını ekleyin; abonelikle her teslimatta %10 kazanın."
          action={<Button title="Ürünlere göz at" onPress={() => router.push("/katalog")} />}
        />
      </Screen>
    );
  }

  const quote = cartQuote(items);

  return (
    <Screen
      footer={
        <Button
          title={"Ödemeye geç · " + formatPrice(quote.total)}
          icon="arrow-forward"
          onPress={() => router.push(signedIn ? "/odeme" : { pathname: "/giris", params: { sonra: "/odeme" } })}
        />
      }
    >
      {issueNotice}

      {items.map((item) => {
        const key = cartItemKey(item);
        const line = quote.lines.find(
          (candidate) => candidate.productId === item.product.id && candidate.intervalWeeks === item.intervalWeeks,
        )!;
        return (
          <Card key={key} style={styles.item}>
            <Row style={styles.itemTop}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={item.product.name}
                onPress={() => router.push({ pathname: "/urun/[slug]", params: { slug: item.product.slug } })}
              >
                <ProductArt product={item.product} style={styles.thumb} rounded={16} />
              </Pressable>
              <View style={styles.flex}>
                <T variant="label">{item.product.brand.toLocaleUpperCase("tr")}</T>
                <T variant="heading" numberOfLines={2}>
                  {item.product.name}
                </T>
                <T variant="small">{item.product.packageSize}</T>
              </View>
              <View style={styles.priceColumn}>
                <T style={styles.linePrice}>{formatPrice(line.lineTotal)}</T>
                {line.unitPrice !== line.listUnitPrice && (
                  <T style={styles.strike}>{formatPrice(line.listUnitPrice * line.quantity)}</T>
                )}
              </View>
            </Row>

            {item.product.subscribable && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.intervals}>
                <Chip label="Tek seferlik" selected={item.intervalWeeks === null} onPress={() => setInterval(key, null)} />
                {SUBSCRIPTION_INTERVALS.map((weeks) => (
                  <Chip
                    key={weeks}
                    label={intervalLabel(weeks)}
                    selected={item.intervalWeeks === weeks}
                    onPress={() => setInterval(key, weeks)}
                  />
                ))}
              </ScrollView>
            )}

            <Row style={styles.itemBottom}>
              <QuantityStepper
                value={item.quantity}
                min={0}
                max={Math.max(1, Math.min(MAX_QUANTITY_PER_LINE, item.product.stock))}
                onChange={(value) => setQuantity(key, value)}
              />
              {item.intervalWeeks !== null && (
                <T variant="small" style={styles.saving}>
                  %{SUBSCRIPTION_DISCOUNT_PERCENT} abonelik indirimi
                </T>
              )}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={item.product.name + " ürününü sepetten çıkar"}
                onPress={() => remove(key)}
                hitSlop={10}
                style={styles.remove}
              >
                <Ionicons name="trash-outline" size={20} color={colors.inkMuted} />
              </Pressable>
            </Row>
          </Card>
        );
      })}

      <Card>
        {quote.freeShippingRemaining > 0 ? (
          <Notice tone="info">
            Ücretsiz kargo için {formatPrice(quote.freeShippingRemaining)} daha ekleyin ya da bir ürünü aboneliğe çevirin.
          </Notice>
        ) : (
          <Notice tone="success">Kargonuz ücretsiz</Notice>
        )}
        <View style={styles.totals}>
          <TotalsBlock
            totals={{
              subtotal: quote.subtotal,
              discount: quote.subscriptionDiscount,
              shipping: quote.shipping,
              total: quote.total,
            }}
          />
        </View>
        {quote.hasSubscription && (
          <T variant="small" style={styles.note}>
            Abonelik ürünlerinin ilk teslimatı bu siparişle gelir; sonrakiler seçtiğiniz sıklıkta otomatik oluşturulur.
          </T>
        )}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  item: { gap: spacing.md },
  itemTop: { alignItems: "flex-start" },
  thumb: { width: 76 },
  priceColumn: { alignItems: "flex-end" },
  linePrice: { fontFamily: fonts.bold, fontSize: 16, color: colors.ink },
  strike: { fontFamily: fonts.regular, fontSize: 12.5, color: colors.inkMuted, textDecorationLine: "line-through" },
  intervals: { gap: spacing.sm },
  itemBottom: { justifyContent: "space-between" },
  saving: { flex: 1, color: colors.brand700, fontFamily: fonts.semibold },
  remove: { marginLeft: "auto", padding: 6 },
  totals: { marginTop: spacing.lg },
  note: { marginTop: spacing.md },
});
