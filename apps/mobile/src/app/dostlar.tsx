import { Ionicons } from "@expo/vector-icons";
import { SPECIES, SPECIES_LABELS, errorMessage, type Species } from "@patipaket/shared";
import { Redirect } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { SpeciesArt } from "@/components/art";
import { useSubmit } from "@/components/forms";
import { useSignedIn } from "@/components/status";
import { Button, Card, Chip, EmptyState, Field, Notice, QueryView, Row, Screen, T } from "@/components/ui";
import { api } from "@/lib/api";
import { colors, spacing } from "@/lib/theme";
import { useQuery } from "@/lib/use-query";

function PetForm({ onSaved, onCancel }: { onSaved: () => void; onCancel: () => void }) {
  const { pending, error, fields, run } = useSubmit();
  const [name, setName] = useState("");
  const [species, setSpecies] = useState<Species>("cat");
  const [breed, setBreed] = useState("");
  const [weight, setWeight] = useState("");

  return (
    <Card style={styles.card}>
      <T variant="title">Yeni dost</T>
      {error && <Notice tone="error">{error}</Notice>}
      <Field label="Adı" value={name} onChangeText={setName} autoCapitalize="words" error={fields.name} />
      <View style={styles.field}>
        <T variant="small" style={styles.fieldLabel}>
          Türü
        </T>
        <Row style={styles.chips}>
          {SPECIES.map((item) => (
            <Chip key={item} label={SPECIES_LABELS[item]} selected={species === item} onPress={() => setSpecies(item)} />
          ))}
        </Row>
      </View>
      <Field label="Irkı (isteğe bağlı)" value={breed} onChangeText={setBreed} error={fields.breed} />
      <Field
        label="Kilosu (isteğe bağlı)"
        value={weight}
        onChangeText={setWeight}
        keyboardType="decimal-pad"
        placeholder="örn. 4,5"
        error={fields.weightKg}
      />
      <Row>
        <Button
          title="Kaydet"
          loading={pending}
          style={styles.flex}
          onPress={() =>
            run(async () => {
              const kilos = weight.trim().replace(",", ".");
              await api.pets.create({
                name,
                species,
                breed: breed.trim() || null,
                weightKg: kilos ? Number(kilos) : null,
              });
              onSaved();
            })
          }
        />
        <Button title="Vazgeç" variant="ghost" onPress={onCancel} />
      </Row>
    </Card>
  );
}

export default function PetsScreen() {
  const signedIn = useSignedIn();
  const query = useQuery(() => api.pets.list(), "pets", signedIn);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!signedIn) return <Redirect href="/giris" />;

  async function remove(id: string) {
    setError(null);
    try {
      await api.pets.remove(id);
      await query.refresh();
    } catch (caught) {
      setError(errorMessage(caught));
    }
  }

  return (
    <QueryView query={query}>
      {({ pets }) => (
        <Screen refreshing={query.refreshing} onRefresh={query.refresh}>
          {error && <Notice tone="error">{error}</Notice>}

          {pets.length === 0 && !adding && (
            <EmptyState
              icon="heart-outline"
              title="Dostunuzu tanıyalım"
              text="Kedinizi, köpeğinizi veya kuşunuzu ekleyin; ona uygun ürünleri daha kolay bulun."
              action={<Button title="Dost ekle" icon="add" onPress={() => setAdding(true)} />}
            />
          )}

          {pets.map((pet) => (
            <Card key={pet.id}>
              <Row>
                <SpeciesArt species={pet.species} style={styles.avatar} />
                <View style={styles.flex}>
                  <T variant="title">{pet.name}</T>
                  <T variant="small">
                    {[SPECIES_LABELS[pet.species], pet.breed, pet.weightKg ? pet.weightKg + " kg" : null]
                      .filter(Boolean)
                      .join(" · ")}
                  </T>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={pet.name + " kaydını sil"}
                  onPress={() => remove(pet.id)}
                  hitSlop={10}
                >
                  <Ionicons name="trash-outline" size={20} color={colors.inkMuted} />
                </Pressable>
              </Row>
            </Card>
          ))}

          {adding ? (
            <PetForm
              onSaved={() => {
                setAdding(false);
                void query.refresh();
              }}
              onCancel={() => setAdding(false)}
            />
          ) : (
            pets.length > 0 && <Button title="Dost ekle" icon="add" onPress={() => setAdding(true)} />
          )}
        </Screen>
      )}
    </QueryView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  card: { gap: spacing.md },
  field: { gap: 6 },
  fieldLabel: { fontSize: 14 },
  chips: { gap: spacing.sm, flexWrap: "wrap" },
  avatar: { width: 60 },
});
