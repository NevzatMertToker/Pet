import { SUBSCRIPTION_DISCOUNT_PERCENT, formatPrice } from "@patipaket/shared";
import { StyleSheet, View } from "react-native";
import { colors, fonts, spacing } from "@/lib/theme";
import { T } from "./ui";

interface Totals {
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
}

/** Ara toplam, abonelik indirimi, kargo ve genel toplam satırları. */
export function TotalsBlock({ totals }: { totals: Totals }) {
  return (
    <View style={styles.block}>
      <View style={styles.line}>
        <T variant="small" style={styles.label}>
          Ara toplam
        </T>
        <T style={styles.value}>{formatPrice(totals.subtotal)}</T>
      </View>
      {totals.discount > 0 && (
        <View style={styles.line}>
          <T variant="small" style={styles.discount}>
            Abonelik indirimi (%{SUBSCRIPTION_DISCOUNT_PERCENT})
          </T>
          <T style={[styles.value, styles.discount]}>−{formatPrice(totals.discount)}</T>
        </View>
      )}
      <View style={styles.line}>
        <T variant="small" style={styles.label}>
          Kargo
        </T>
        <T style={[styles.value, totals.shipping === 0 && styles.discount]}>
          {totals.shipping === 0 ? "Ücretsiz" : formatPrice(totals.shipping)}
        </T>
      </View>
      <View style={[styles.line, styles.totalLine]}>
        <T variant="heading">Toplam</T>
        <T style={styles.total}>{formatPrice(totals.total)}</T>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  block: { gap: spacing.sm },
  line: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  label: { fontSize: 14.5 },
  value: { fontFamily: fonts.medium, fontSize: 14.5, color: colors.ink },
  discount: { color: colors.brand700, fontFamily: fonts.semibold, fontSize: 14.5 },
  totalLine: { borderTopWidth: 1, borderTopColor: colors.line, paddingTop: spacing.md, marginTop: spacing.xs },
  total: { fontFamily: fonts.bold, fontSize: 24, lineHeight: 30, color: colors.ink },
});
