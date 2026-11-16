import { Ionicons } from "@expo/vector-icons";
import { SPECIES, SPECIES_LABELS, SUBSCRIPTION_DISCOUNT_PERCENT } from "@patipaket/shared";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PawMark, ProductArt, SpeciesArt } from "@/components/art";
import { ProductCard } from "@/components/product-card";
import { Badge, Button, Card, Row, Screen, SectionHeader, T, type IconName } from "@/components/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { colors, fonts, radius, shadow, spacing } from "@/lib/theme";
import { useQuery } from "@/lib/use-query";

const STEPS: { icon: IconName; title: string; text: string }[] = [
  { icon: "cube-outline", title: "Ürünlerini seç", text: "Mama, kum ve sarf malzemelerini sepete ekle." },
  { icon: "calendar-outline", title: "Sıklığını belirle", text: "2 ile 12 hafta arasında teslimat aralığını seç." },
  { icon: "bicycle-outline", title: "Arkana yaslan", text: "Bitmeden kapında. Dilediğinde atla ya da iptal et." },
];

const HERO_ART = [
  { slug: "hero-dog", species: "dog", type: "food", imageUrl: null },
  { slug: "hero-cat", species: "cat", type: "litter", imageUrl: null },
  { slug: "hero-bird-2", species: "bird", type: "food", imageUrl: null },
] as const;

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const user = useAuth((state) => state.user);
  const featured = useQuery(() => api.products.list({ featured: true }), "featured");

  return (
    <Screen padded={false} refreshing={featured.refreshing} onRefresh={featured.refresh}>
      <View style={[styles.container, { paddingTop: insets.top + spacing.md }]}>
        <Row style={styles.topBar}>
          <View style={styles.logoMark}>
            <PawMark size={24} />
          </View>
          <View style={styles.flex}>
            <T style={styles.logoText}>
              Pati<T style={[styles.logoText, { color: colors.brand600 }]}>Paket</T>
            </T>
            <T variant="small">{user ? "Merhaba, " + user.name.split(" ")[0] : "Hoş geldiniz"}</T>
          </View>
        </Row>

        {/* ---------------------------------------------------------- hero */}
        <View style={styles.hero}>
          <View style={styles.heroGlow} />
          <Badge label={"%" + SUBSCRIPTION_DISCOUNT_PERCENT + " indirim + ücretsiz kargo"} tone="accent" icon="repeat" />
          <T style={styles.heroTitle}>
            Mama bitmeden{"\n"}
            <T style={[styles.heroTitle, { color: colors.accent300 }]}>kapında.</T>
          </T>
          <T style={styles.heroText}>
            Bir kez seç, senin belirlediğin sıklıkta düzenli gelsin. Taahhüt yok; dilediğin an atla ya da iptal et.
          </T>
          <Row style={styles.heroArtRow}>
            {HERO_ART.map((art, index) => (
              <View
                key={art.slug}
                style={[styles.heroArt, { transform: [{ rotate: ["-8deg", "0deg", "8deg"][index] }], marginTop: index === 1 ? 0 : 10 }]}
              >
                <ProductArt product={art} rounded={18} />
              </View>
            ))}
          </Row>
          <Button title="Ürünleri keşfet" variant="accent" icon="arrow-forward" onPress={() => router.push("/katalog")} />
        </View>

        {/* --------------------------------------------------- kategoriler */}
        <SectionHeader title="Dostun kim?" />
        <Row style={styles.speciesRow}>
          {SPECIES.map((species) => (
            <Pressable
              key={species}
              accessibilityRole="button"
              accessibilityLabel={SPECIES_LABELS[species] + " ürünleri"}
              onPress={() => router.push({ pathname: "/katalog", params: { species } })}
              style={({ pressed }) => [styles.speciesCard, pressed && styles.pressed]}
            >
              <SpeciesArt species={species} style={styles.speciesArt} />
              <T variant="heading" style={styles.speciesLabel}>
                {SPECIES_LABELS[species]}
              </T>
            </Pressable>
          ))}
        </Row>
      </View>

      {/* ----------------------------------------------------- öne çıkanlar */}
      {featured.data && featured.data.products.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionPadding}>
            <SectionHeader
              title="Abonelerin favorileri"
              action={<Button title="Tümü" variant="ghost" small onPress={() => router.push("/katalog")} />}
            />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carousel}>
            {featured.data.products.map((product) => (
              <ProductCard key={product.id} product={product} style={styles.carouselCard} />
            ))}
          </ScrollView>
        </View>
      )}

      {/* ---------------------------------------------------- nasıl çalışır */}
      <View style={[styles.container, styles.section]}>
        <SectionHeader title="Nasıl çalışır?" />
        <Card style={styles.steps}>
          {STEPS.map((step, index) => (
            <Row key={step.title} style={styles.step}>
              <View style={styles.stepIcon}>
                <Ionicons name={step.icon} size={22} color={colors.white} />
              </View>
              <View style={styles.flex}>
                <T variant="heading">
                  {index + 1}. {step.title}
                </T>
                <T variant="small">{step.text}</T>
              </View>
            </Row>
          ))}
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { paddingHorizontal: spacing.lg, gap: spacing.lg },
  section: { marginTop: spacing.sm, gap: spacing.md },
  sectionPadding: { paddingHorizontal: spacing.lg },
  pressed: { opacity: 0.75 },
  topBar: { gap: spacing.md },
  logoMark: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: colors.brand600,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: { fontFamily: fonts.display, fontSize: 22, lineHeight: 26, color: colors.ink },

  hero: {
    backgroundColor: colors.brand800,
    borderRadius: 30,
    padding: spacing.xl,
    gap: spacing.md,
    overflow: "hidden",
    ...shadow,
  },
  heroGlow: {
    position: "absolute",
    top: -70,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(44,155,120,0.55)",
  },
  heroTitle: { fontFamily: fonts.display, fontSize: 34, lineHeight: 38, color: colors.white },
  heroText: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, color: "rgba(255,255,255,0.78)" },
  heroArtRow: { justifyContent: "center", gap: spacing.sm, marginVertical: spacing.xs },
  heroArt: { width: "29%", borderRadius: 18, borderWidth: 3, borderColor: colors.white, overflow: "hidden" },

  speciesRow: { gap: spacing.md },
  speciesCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.sm,
    alignItems: "center",
    ...shadow,
  },
  speciesArt: { width: "100%" },
  speciesLabel: { marginVertical: spacing.sm },

  carousel: { paddingHorizontal: spacing.lg, gap: spacing.md, paddingBottom: spacing.sm },
  carouselCard: { width: 172 },

  steps: { gap: spacing.lg },
  step: { alignItems: "flex-start" },
  stepIcon: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: colors.brand600,
    alignItems: "center",
    justifyContent: "center",
  },
});
