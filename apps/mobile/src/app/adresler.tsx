import { errorMessage } from "@patipaket/shared";
import { Redirect } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { AddressForm } from "@/components/forms";
import { useSignedIn } from "@/components/status";
import { Badge, Button, Card, Notice, QueryView, Row, Screen, T } from "@/components/ui";
import { api } from "@/lib/api";
import { spacing } from "@/lib/theme";
import { useQuery } from "@/lib/use-query";

export default function AddressesScreen() {
  const signedIn = useSignedIn();
  const query = useQuery(() => api.addresses.list(), "addresses", signedIn);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!signedIn) return <Redirect href="/giris" />;

  async function remove(id: string) {
    setError(null);
    try {
      await api.addresses.remove(id);
      await query.refresh();
    } catch (caught) {
      setError(errorMessage(caught));
    }
  }

  return (
    <QueryView query={query}>
      {({ addresses }) => (
        <Screen refreshing={query.refreshing} onRefresh={query.refresh}>
          {error && <Notice tone="error">{error}</Notice>}

          {addresses.map((address) => (
            <Card key={address.id} style={styles.card}>
              <Row style={styles.title}>
                <T variant="title">{address.title}</T>
                {address.isDefault && <Badge label="Varsayılan" />}
              </Row>
              <View>
                <T variant="small">
                  {address.fullName} · {address.phone}
                </T>
                <T variant="small">
                  {address.line}, {address.district} / {address.city}
                </T>
              </View>
              <Button title="Sil" variant="danger" small icon="trash-outline" onPress={() => remove(address.id)} />
            </Card>
          ))}

          {adding || addresses.length === 0 ? (
            <Card style={styles.card}>
              <T variant="title">Yeni adres</T>
              <AddressForm
                onSaved={() => {
                  setAdding(false);
                  void query.refresh();
                }}
                onCancel={addresses.length > 0 ? () => setAdding(false) : undefined}
              />
            </Card>
          ) : (
            <Button title="Yeni adres ekle" icon="add" onPress={() => setAdding(true)} />
          )}
        </Screen>
      )}
    </QueryView>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md },
  title: { gap: spacing.sm },
});
