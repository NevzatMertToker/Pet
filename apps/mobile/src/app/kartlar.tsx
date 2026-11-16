import { Ionicons } from "@expo/vector-icons";
import { errorMessage, maskedCard } from "@patipaket/shared";
import { Redirect } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { CardForm } from "@/components/forms";
import { useSignedIn } from "@/components/status";
import { Badge, Button, Card, Notice, QueryView, Row, Screen, T } from "@/components/ui";
import { api } from "@/lib/api";
import { colors, spacing } from "@/lib/theme";
import { useQuery } from "@/lib/use-query";

export default function PaymentMethodsScreen() {
  const signedIn = useSignedIn();
  const query = useQuery(
    async () => {
      const [methods, config] = await Promise.all([api.paymentMethods.list(), api.config()]);
      return { paymentMethods: methods.paymentMethods, testMode: config.paymentTestMode };
    },
    "payment-methods",
    signedIn,
  );
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!signedIn) return <Redirect href="/giris" />;

  async function remove(id: string) {
    setError(null);
    try {
      await api.paymentMethods.remove(id);
      await query.refresh();
    } catch (caught) {
      setError(errorMessage(caught));
    }
  }

  return (
    <QueryView query={query}>
      {({ paymentMethods, testMode }) => (
        <Screen refreshing={query.refreshing} onRefresh={query.refresh}>
          {error && <Notice tone="error">{error}</Notice>}

          {paymentMethods.map((method) => (
            <Card key={method.id} style={styles.card}>
              <Row>
                <View style={styles.cardIcon}>
                  <Ionicons name="card" size={22} color={colors.white} />
                </View>
                <View style={styles.flex}>
                  <Row style={styles.title}>
                    <T variant="heading">{maskedCard(method.brand, method.last4)}</T>
                    {method.isDefault && <Badge label="Varsayılan" />}
                  </Row>
                  <T variant="small">
                    {method.cardHolder} · {String(method.expMonth).padStart(2, "0")}/{String(method.expYear).slice(-2)}
                  </T>
                </View>
              </Row>
              <Button title="Sil" variant="danger" small icon="trash-outline" onPress={() => remove(method.id)} />
            </Card>
          ))}

          {adding || paymentMethods.length === 0 ? (
            <Card style={styles.card}>
              <T variant="title">Yeni kart</T>
              <CardForm
                testMode={testMode}
                onSaved={() => {
                  setAdding(false);
                  void query.refresh();
                }}
                onCancel={paymentMethods.length > 0 ? () => setAdding(false) : undefined}
              />
            </Card>
          ) : (
            <Button title="Yeni kart ekle" icon="add" onPress={() => setAdding(true)} />
          )}
        </Screen>
      )}
    </QueryView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  card: { gap: spacing.md },
  title: { gap: spacing.sm, flexWrap: "wrap" },
  cardIcon: {
    width: 52,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.ink,
    alignItems: "center",
    justifyContent: "center",
  },
});
