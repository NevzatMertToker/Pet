import { Ionicons } from "@expo/vector-icons";
import { formatDate, formatPrice, intervalLabel, type Subscription } from "@patipaket/shared";
import { router } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { ProductArt } from "@/components/art";
import { SignInPrompt, SubscriptionStatusBadge, useSignedIn } from "@/components/status";
import { Button, Card, EmptyState, Notice, QueryView, Row, Screen, T } from "@/components/ui";
import { api } from "@/lib/api";
import { colors, spacing } from "@/lib/theme";
import { useQuery } from "@/lib/use-query";

function SubscriptionCard({ subscription }: { subscription: Subscription }) {
  const active = subscription.status === "active";
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={intervalLabel(subscription.intervalWeeks) + " aboneliğini yönet"}
      onPress={() => router.push({ pathname: "/abonelik/[id]", params: { id: subscription.id } })}
      style={({ pressed }) => pressed && styles.pressed}
    >
      <Card style={styles.card}>
        <Row style={styles.top}>
          <View style={styles.flex}>
            <SubscriptionStatusBadge status={subscription.status} />
            <T variant="title" style={styles.interval}>
              {intervalLabel(subscription.intervalWeeks)}
            </T>
          </View>
          <Row style={styles.thumbs}>
            {subscription.items.slice(0, 3).map((item) => (
              <ProductArt key={item.id} product={item} style={styles.thumb} rounded={12} />
            ))}
          </Row>
        </Row>

        <T variant="small" numberOfLines={2}>
          {subscription.items.map((item) => item.name + " ×" + item.quantity).join(" · ")}
        </T>

        {subscription.lastRenewalError && subscription.status !== "cancelled" && (
          <Notice tone="warn">{subscription.lastRenewalError}</Notice>
        )}

        <Row style={styles.bottom}>
          <View style={styles.flex}>
            <T variant="small">{active ? "Sonraki teslimat" : "Durum"}</T>
            <T variant="heading">
              {active
                ? formatDate(subscription.nextDeliveryDate)
                : subscription.status === "paused"
                  ? "Teslimatlar durduruldu"
                  : "Abonelik sonlandı"}
            </T>
          </View>
          <View style={styles.amount}>
            <T variant="small">Teslimat başına</T>
            <T variant="heading">{formatPrice(subscription.estimatedTotal)}</T>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.inkMuted} />
        </Row>
      </Card>
    </Pressable>
  );
}

export default function SubscriptionsScreen() {
  const signedIn = useSignedIn();
  const query = useQuery(() => api.subscriptions.list(), "subscriptions", signedIn);

  if (!signedIn) {
    return (
      <SignInPrompt
        icon="repeat"
        title="Aboneliklerinizi yönetin"
        text="Teslimat sıklığını değiştirmek, atlamak ya da duraklatmak için giriş yapın."
      />
    );
  }

  return (
    <QueryView query={query}>
      {({ subscriptions }) => (
        <Screen refreshing={query.refreshing} onRefresh={query.refresh}>
          {subscriptions.length === 0 ? (
            <EmptyState
              icon="repeat"
              title="Henüz aboneliğiniz yok"
              text="Bir ürünü “Düzenli gönder” seçeneğiyle alın; her teslimatta %10 indirim ve ücretsiz kargo kazanın."
              action={<Button title="Ürünlere göz at" onPress={() => router.push("/katalog")} />}
            />
          ) : (
            subscriptions.map((subscription) => <SubscriptionCard key={subscription.id} subscription={subscription} />)
          )}
        </Screen>
      )}
    </QueryView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  pressed: { opacity: 0.8 },
  card: { gap: spacing.md },
  top: { alignItems: "flex-start" },
  interval: { marginTop: spacing.sm },
  thumbs: { gap: 6 },
  thumb: { width: 46 },
  bottom: { borderTopWidth: 1, borderTopColor: colors.line, paddingTop: spacing.md },
  amount: { alignItems: "flex-end" },
});
