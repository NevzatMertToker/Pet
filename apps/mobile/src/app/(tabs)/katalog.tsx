import { Ionicons } from "@expo/vector-icons";
import {
  CATEGORIES,
  PRODUCT_TYPES,
  PRODUCT_TYPE_LABELS,
  SPECIES,
  SPECIES_LABELS,
  categoryLabel,
  type Product,
  type ProductType,
  type Species,
} from "@patipaket/shared";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { FlatList, RefreshControl, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { ProductCard } from "@/components/product-card";
import { Button, Chip, EmptyState, Loading, T } from "@/components/ui";
import { api } from "@/lib/api";
import { colors, fonts, radius, spacing } from "@/lib/theme";
import { useQuery } from "@/lib/use-query";

export default function CatalogScreen() {
  const params = useLocalSearchParams<{ species?: string }>();
  const [species, setSpecies] = useState<Species | undefined>();
  const [type, setType] = useState<ProductType | undefined>();
  const [search, setSearch] = useState("");
  const [term, setTerm] = useState("");

  // Ana sayfadaki tür kartlarından gelindiğinde filtre hazır gelir.
  useEffect(() => {
    const requested = SPECIES.find((item) => item === params.species);
    if (requested) {
      setSpecies(requested);
      setType(undefined);
    }
  }, [params.species]);

  // Her tuşta istek atmamak için arama kısa bir gecikmeyle uygulanır.
  useEffect(() => {
    const timer = setTimeout(() => setTerm(search.trim()), 350);
    return () => clearTimeout(timer);
  }, [search]);

  const query = useQuery(
    () => api.products.list({ species, type, q: term || undefined }),
    [species, type, term].join("|"),
  );
  const products = query.data?.products ?? [];

  const availableTypes = PRODUCT_TYPES.filter(
    (item) => !species || CATEGORIES.some((category) => category.species === species && category.type === item),
  );

  function selectSpecies(next: Species | undefined) {
    setSpecies(next);
    if (next && type && !CATEGORIES.some((category) => category.species === next && category.type === type)) {
      setType(undefined);
    }
  }

  const header = (
    <View style={styles.header}>
      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color={colors.inkMuted} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Ürün veya marka ara"
          placeholderTextColor="rgba(22,33,30,0.4)"
          accessibilityLabel="Ürün ara"
          returnKeyType="search"
          autoCorrect={false}
          style={styles.searchInput}
        />
        {search.length > 0 && (
          <Ionicons name="close-circle" size={18} color={colors.inkMuted} onPress={() => setSearch("")} />
        )}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        <Chip label="Tümü" selected={!species} onPress={() => selectSpecies(undefined)} />
        {SPECIES.map((item) => (
          <Chip key={item} label={SPECIES_LABELS[item]} selected={species === item} onPress={() => selectSpecies(item)} />
        ))}
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {availableTypes.map((item) => (
          <Chip
            key={item}
            label={species ? categoryLabel(species, item) : PRODUCT_TYPE_LABELS[item]}
            selected={type === item}
            onPress={() => setType(type === item ? undefined : item)}
          />
        ))}
      </ScrollView>
      {!query.loading && <T variant="small">{products.length} ürün</T>}
    </View>
  );

  return (
    <FlatList<Product>
      style={styles.list}
      contentContainerStyle={styles.content}
      data={query.loading ? [] : products}
      keyExtractor={(product) => product.id}
      numColumns={2}
      columnWrapperStyle={styles.columns}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={header}
      renderItem={({ item }) => <ProductCard product={item} style={styles.card} />}
      refreshControl={
        <RefreshControl refreshing={query.refreshing} onRefresh={query.refresh} tintColor={colors.brand600} />
      }
      ListEmptyComponent={
        query.loading ? (
          <Loading />
        ) : query.error ? (
          <EmptyState
            icon="cloud-offline-outline"
            title="Ürünler yüklenemedi"
            text={query.error}
            action={<Button title="Tekrar dene" icon="refresh" onPress={query.reload} />}
          />
        ) : (
          <EmptyState
            icon="search-outline"
            title="Ürün bulunamadı"
            text="Farklı bir arama yapmayı ya da filtreleri temizlemeyi deneyin."
          />
        )
      }
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: colors.cream },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl * 2,
    gap: spacing.md,
    width: "100%",
    maxWidth: 640,
    alignSelf: "center",
  },
  header: { gap: spacing.md, marginBottom: spacing.xs },
  columns: { gap: spacing.md },
  card: { flex: 1, maxWidth: "48.5%" },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    height: 48,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: "rgba(22,33,30,0.14)",
    backgroundColor: colors.white,
  },
  searchInput: { flex: 1, fontFamily: fonts.regular, fontSize: 16, color: colors.ink, height: "100%" },
  chips: { gap: spacing.sm, paddingRight: spacing.lg },
});
