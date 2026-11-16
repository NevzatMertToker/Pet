import { Ionicons } from "@expo/vector-icons";
import { formatDate, formatPrice } from "@patipaket/shared";
import { Redirect, router } from "expo-router";
import { Pressable, StyleSheet } from "react-native";
import { OrderStatusBadge, useSignedIn } from "@/components/status";
import { Badge, Button, Card, EmptyState, QueryView, Row, Screen, T } from "@/components/ui";
import { api } from "@/lib/api";
import { colors, fonts, spacing } from "@/lib/theme";
import { useQuery } from "@/lib/use-query";

export default function OrdersScreen() {
  const signedIn = useSignedIn();
  const query = useQuery(() => api.orders.list(), "orders", signedIn);
  if (!signedIn) return <Redirect href="/giris" />;

  return (
    <QueryView query={query}>
      {({ orders }) => (
        <Screen refreshing={query.refreshing} onRefresh={query.refresh}>
          {orders.length === 0 ? (
            <EmptyState
              icon="cube-outline"
              title="Henüz siparişiniz yok"
              text="İlk siparişinizi verdiğinizde burada görünecek."
              action={<Button title="Alışverişe başla" onPress={() => router.push("/katalog")} />}
            />
          ) : (
            orders.map((order) => (
              <Pressable
                key={order.id}
                accessibilityRole="button"
                accessibilityLabel={"Sipariş " + order.orderNumber}
                onPress={() => router.push({ pathname: "/siparis/[id]", params: { id: order.id } })}
                style={({ pressed }) => pressed && styles.pressed}
              >
                <Card style={styles.card}>
                  <Row style={styles.top}>
                    <T variant="title">{order.orderNumber}</T>
                    <OrderStatusBadge status={order.status} />
                  </Row>
                  <Row style={styles.meta}>
                    <T variant="small">{formatDate(order.createdAt)}</T>
                    {order.subscriptionId && <Badge label="Abonelik teslimatı" tone="muted" icon="repeat" />}
                  </Row>
                  <T variant="small" numberOfLines={2}>
                    {order.items.map((item) => item.name + " ×" + item.quantity).join(" · ")}
                  </T>
                  <Row style={styles.bottom}>
                    <T style={styles.total}>{formatPrice(order.total)}</T>
                    <Ionicons name="chevron-forward" size={18} color={colors.inkMuted} />
                  </Row>
                </Card>
              </Pressable>
            ))
          )}
        </Screen>
      )}
    </QueryView>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.8 },
  card: { gap: spacing.sm },
  top: { justifyContent: "space-between" },
  meta: { gap: spacing.sm, flexWrap: "wrap" },
  bottom: { justifyContent: "space-between", marginTop: spacing.xs },
  total: { fontFamily: fonts.bold, fontSize: 18, color: colors.ink },
});
