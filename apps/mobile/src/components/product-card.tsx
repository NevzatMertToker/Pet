import { formatPrice, subscriptionUnitPrice, type Product } from "@patipaket/shared";
import { router } from "expo-router";
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { colors, fonts, radius, shadow, spacing } from "@/lib/theme";
import { ProductArt } from "./art";
import { Badge, T } from "./ui";

export function ProductCard({ product, style }: { product: Product; style?: StyleProp<ViewStyle> }) {
  const soldOut = product.stock <= 0;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={product.brand + " " + product.name + ", " + formatPrice(product.price)}
      onPress={() => router.push({ pathname: "/urun/[slug]", params: { slug: product.slug } })}
      style={({ pressed }) => [styles.card, pressed && styles.pressed, style]}
    >
      <View>
        <ProductArt product={product} rounded={0} style={soldOut ? styles.soldOut : undefined} />
        <View style={styles.badges}>
          {soldOut ? (
            <Badge label="Tükendi" tone="dark" />
          ) : (
            product.subscribable && <Badge label="Abonelikle %10" tone="light" icon="repeat" />
          )}
        </View>
      </View>
      <View style={styles.body}>
        <T variant="label">{product.brand.toLocaleUpperCase("tr")}</T>
        <T variant="heading" numberOfLines={2} style={styles.name}>
          {product.name}
        </T>
        <T variant="small">{product.packageSize}</T>
        <View style={styles.prices}>
          <T style={styles.price}>{formatPrice(product.price)}</T>
          {product.subscribable && (
            <T style={styles.subscriptionPrice}>Abonelikle {formatPrice(subscriptionUnitPrice(product.price))}</T>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: "hidden",
    ...shadow,
  },
  pressed: { opacity: 0.8 },
  soldOut: { opacity: 0.55 },
  badges: { position: "absolute", top: spacing.sm, left: spacing.sm },
  body: { padding: spacing.md, gap: 2 },
  name: { fontSize: 14.5, lineHeight: 19, minHeight: 38 },
  prices: { marginTop: spacing.sm },
  price: { fontFamily: fonts.bold, fontSize: 17, color: colors.ink },
  subscriptionPrice: { fontFamily: fonts.semibold, fontSize: 12, color: colors.brand700 },
});
