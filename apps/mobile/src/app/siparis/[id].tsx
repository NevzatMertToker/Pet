import { Ionicons } from "@expo/vector-icons";
import { formatDate, formatPrice, type Order } from "@patipaket/shared";
import { router, useLocalSearchParams } from "expo-router";
import { StyleSheet, View } from "react-native";
import { OrderStatusBadge } from "@/components/status";
import { TotalsBlock } from "@/components/totals";
import { Badge, Button, Card, Divider, QueryView, Row, Screen, T } from "@/components/ui";
import { api } from "@/lib/api";
import { colors, fonts, spacing } from "@/lib/theme";
import { useQuery } from "@/lib/use-query";

function OrderView({ order, isNew }: { order: Order; isNew: boolean }) {
  const hasSubscription = order.items.some((item) => item.isSubscription);
  return (
    <Screen>
      {isNew && (
        <View style={styles.success}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark" size={38} color={colors.white} />
          </View>
          <T variant="display" style={styles.center}>
            Teşekkürler, siparişiniz alındı!
          </T>
          <T style={[styles.center, styles.soft]}>
            {formatPrice(order.total)} kartınızdan tahsil edildi.
            {hasSubscription ? " Aboneliğiniz başladı; sonraki teslimatlar otomatik oluşturulacak." : ""}
          </T>
          {hasSubscription && (
            <Button title="Aboneliklerimi yönet" icon="repeat" variant="accent" onPress={() => router.replace("/abonelikler")} />
          )}
        </View>
      )}

      <Card style={styles.section}>
        <Row style={styles.between}>
          <View>
            <T variant="small">Sipariş numarası</T>
            <T variant="title">{order.orderNumber}</T>
          </View>
          <OrderStatusBadge status={order.status} />
        </Row>
        <T variant="small">{formatDate(order.createdAt)}</T>
        {order.trackingNumber && <T variant="small">Kargo takip no: {order.trackingNumber}</T>}
      </Card>

      <Card style={styles.section}>
        <T variant="title">Ürünler</T>
        {order.items.map((item, index) => (
          <View key={item.id}>
            {index > 0 && <Divider />}
            <Row style={styles.itemRow}>
              <View style={styles.flex}>
                <T variant="heading">{item.name}</T>
                <T variant="small">
                  {item.packageSize} · {item.quantity} adet × {formatPrice(item.unitPrice)}
                </T>
                {item.isSubscription && <Badge label="Abonelik" icon="repeat" />}
              </View>
              <T style={styles.strong}>{formatPrice(item.lineTotal)}</T>
            </Row>
          </View>
        ))}
        <Divider />
        <TotalsBlock
          totals={{ subtotal: order.subtotal, discount: order.discount, shipping: order.shipping, total: order.total }}
        />
      </Card>

      <Card style={styles.section}>
        <T variant="title">Teslimat adresi</T>
        <View>
          <T variant="heading">{order.address.fullName}</T>
          <T variant="small">
            {order.address.line}, {order.address.district} / {order.address.city}
          </T>
          <T variant="small">{order.address.phone}</T>
        </View>
        <Divider />
        <Row style={styles.between}>
          <T variant="small">Ödeme</T>
          <T variant="heading">{order.paymentSummary ?? "—"}</T>
        </Row>
      </Card>

      {isNew && <Button title="Alışverişe devam et" variant="outline" onPress={() => router.replace("/")} />}
    </Screen>
  );
}

export default function OrderScreen() {
  const { id, yeni } = useLocalSearchParams<{ id: string; yeni?: string }>();
  const query = useQuery(() => api.orders.get(id), "order:" + id);
  return <QueryView query={query}>{({ order }) => <OrderView order={order} isNew={yeni === "1"} />}</QueryView>;
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  center: { textAlign: "center" },
  soft: { color: colors.inkSoft },
  success: { alignItems: "center", gap: spacing.md, paddingVertical: spacing.lg },
  successIcon: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.brand600,
    alignItems: "center",
    justifyContent: "center",
  },
  section: { gap: spacing.sm },
  between: { justifyContent: "space-between" },
  itemRow: { alignItems: "flex-start" },
  strong: { fontFamily: fonts.semibold, fontSize: 15, color: colors.ink },
});
