import { Ionicons } from "@expo/vector-icons";
import {
  DEFAULT_SUBSCRIPTION_INTERVAL,
  MAX_QUANTITY_PER_LINE,
  SUBSCRIPTION_DISCOUNT_PERCENT,
  SUBSCRIPTION_INTERVALS,
  categoryLabel,
  formatPrice,
  intervalHint,
  intervalLabel,
  subscriptionUnitPrice,
  toCartProduct,
  type Product,
} from "@patipaket/shared";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { ProductArt } from "@/components/art";
import { Badge, Button, Chip, Notice, QuantityStepper, QueryView, Row, Screen, T } from "@/components/ui";
import { api } from "@/lib/api";
import { useCart } from "@/lib/cart";
import { colors, fonts, radius, spacing } from "@/lib/theme";
import { useQuery } from "@/lib/use-query";

const PERKS = ["Her teslimatta ücretsiz kargo", "Dilediğinde atla, ertele veya iptal et", "Taahhüt ve cayma bedeli yok"];

function Option({
  selected,
  onPress,
  title,
  price,
  listPrice,
  badge,
  children,
}: {
  selected: boolean;
  onPress: () => void;
  title: string;
  price: number;
  listPrice?: number;
  badge?: string;
  children?: React.ReactNode;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.option, selected && styles.optionSelected]}
    >
      <Row style={styles.optionHeader}>
        <View style={[styles.radio, selected && styles.radioSelected]}>{selected && <View style={styles.radioDot} />}</View>
        <View style={styles.flex}>
          <Row style={styles.optionTitleRow}>
            <T variant="heading">{title}</T>
            {badge && <Badge label={badge} tone="accent" />}
          </Row>
          <Row style={styles.priceRow}>
            <T style={styles.optionPrice}>{formatPrice(price)}</T>
            {listPrice !== undefined && <T style={styles.strike}>{formatPrice(listPrice)}</T>}
          </Row>
        </View>
      </Row>
      {selected && children}
    </Pressable>
  );
}

function ProductDetail({ product }: { product: Product }) {
  const add = useCart((state) => state.add);
  const suggested =
    product.suggestedIntervalWeeks &&
    (SUBSCRIPTION_INTERVALS as readonly number[]).includes(product.suggestedIntervalWeeks)
      ? product.suggestedIntervalWeeks
      : null;

  const [subscribe, setSubscribe] = useState(product.subscribable);
  const [intervalWeeks, setIntervalWeeks] = useState<number>(suggested ?? DEFAULT_SUBSCRIPTION_INTERVAL);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const soldOut = product.stock <= 0;
  const subscribing = subscribe && product.subscribable;
  const unitPrice = subscribing ? subscriptionUnitPrice(product.price) : product.price;

  function handleAdd() {
    add(toCartProduct(product), quantity, subscribing ? intervalWeeks : null);
    setAdded(true);
  }

  return (
    <Screen
      footer={
        <View style={styles.footer}>
          {added && (
            <Row style={styles.addedRow}>
              <Ionicons name="checkmark-circle" size={20} color={colors.brand600} />
              <T variant="heading" style={styles.flex}>
                Sepete eklendi
              </T>
              <Button title="Sepete git" small variant="outline" onPress={() => router.push("/sepet")} />
            </Row>
          )}
          <Row>
            <QuantityStepper
              value={quantity}
              onChange={setQuantity}
              max={Math.max(1, Math.min(MAX_QUANTITY_PER_LINE, product.stock))}
            />
            <Button
              title={soldOut ? "Stokta yok" : "Sepete ekle · " + formatPrice(unitPrice * quantity)}
              icon={soldOut ? undefined : "cart"}
              disabled={soldOut}
              onPress={handleAdd}
              style={styles.flex}
            />
          </Row>
        </View>
      }
    >
      <ProductArt product={product} rounded={30} />

      <View style={styles.info}>
        <T variant="label" style={styles.brand}>
          {product.brand.toLocaleUpperCase("tr")}
        </T>
        <T variant="display">{product.name}</T>
        <Row style={styles.badges}>
          <Badge label={product.packageSize} tone="muted" />
          <Badge label={categoryLabel(product.species, product.type)} tone="muted" />
          {product.suggestedIntervalWeeks && (
            <Badge label={"Ort. " + product.suggestedIntervalWeeks + " haftada biter"} icon="time-outline" />
          )}
        </Row>
        <T style={styles.description}>{product.description}</T>
      </View>

      {!soldOut && product.stock <= 5 && <Notice tone="warn">Son {product.stock} adet kaldı.</Notice>}

      <View style={styles.options} accessibilityRole="radiogroup">
        {product.subscribable && (
          <Option
            selected={subscribing}
            onPress={() => setSubscribe(true)}
            title="Düzenli gönder"
            badge={"%" + SUBSCRIPTION_DISCOUNT_PERCENT + " indirim"}
            price={subscriptionUnitPrice(product.price)}
            listPrice={product.price}
          >
            <View style={styles.optionBody}>
              <T variant="heading" style={styles.question}>
                Ne sıklıkla gelsin?
              </T>
              <View style={styles.chips}>
                {SUBSCRIPTION_INTERVALS.map((weeks) => (
                  <Chip
                    key={weeks}
                    label={intervalLabel(weeks)}
                    selected={weeks === intervalWeeks}
                    onPress={() => setIntervalWeeks(weeks)}
                    badge={weeks === suggested ? "önerilen" : undefined}
                  />
                ))}
              </View>
              <T variant="small">{intervalHint(intervalWeeks)}. Sıklığı sonradan değiştirebilirsin.</T>
              <View style={styles.perks}>
                {PERKS.map((perk) => (
                  <Row key={perk} style={styles.perk}>
                    <Ionicons name="checkmark" size={17} color={colors.brand600} />
                    <T variant="small" style={styles.perkText}>
                      {perk}
                    </T>
                  </Row>
                ))}
              </View>
            </View>
          </Option>
        )}
        <Option
          selected={!subscribing}
          onPress={() => setSubscribe(false)}
          title="Tek seferlik satın al"
          price={product.price}
        />
      </View>
    </Screen>
  );
}

export default function ProductScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const query = useQuery(() => api.products.get(slug), "product:" + slug);
  return <QueryView query={query}>{({ product }) => <ProductDetail key={product.id} product={product} />}</QueryView>;
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  info: { gap: spacing.sm },
  brand: { color: colors.brand600 },
  badges: { flexWrap: "wrap", gap: spacing.sm },
  description: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 23, color: colors.inkSoft },
  options: { gap: spacing.md },
  option: {
    borderWidth: 2,
    borderColor: "rgba(22,33,30,0.1)",
    borderRadius: radius.xl,
    backgroundColor: colors.white,
    padding: spacing.lg,
  },
  optionSelected: { borderColor: colors.brand600, backgroundColor: "#f5fbf8" },
  optionHeader: { alignItems: "flex-start" },
  optionTitleRow: { gap: spacing.sm, flexWrap: "wrap" },
  priceRow: { gap: spacing.sm, alignItems: "baseline", marginTop: 2 },
  optionPrice: { fontFamily: fonts.bold, fontSize: 23, lineHeight: 30, color: colors.ink },
  strike: { fontFamily: fonts.regular, fontSize: 14, color: colors.inkMuted, textDecorationLine: "line-through" },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "rgba(22,33,30,0.25)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  radioSelected: { borderColor: colors.brand600 },
  radioDot: { width: 11, height: 11, borderRadius: 6, backgroundColor: colors.brand600 },
  optionBody: {
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: "rgba(30,125,97,0.16)",
    gap: spacing.md,
  },
  question: { fontSize: 14.5 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, rowGap: spacing.md, paddingTop: 4 },
  perks: { gap: 6 },
  perk: { gap: spacing.sm },
  perkText: { color: colors.inkSoft, fontSize: 14 },
  footer: { gap: spacing.md },
  addedRow: { gap: spacing.sm },
});
