import type { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { colors, radius, spacing } from "@/lib/theme";

/** Adres / kart gibi listelerden tek seçim yapılan kart. */
export function ChoiceCard({
  selected,
  onPress,
  children,
}: {
  selected: boolean;
  onPress: () => void;
  children: ReactNode;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.card, selected && styles.selected, pressed && styles.pressed]}
    >
      <View style={[styles.radio, selected && styles.radioSelected]}>{selected && <View style={styles.dot} />}</View>
      <View style={styles.body}>{children}</View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    gap: spacing.md,
    borderWidth: 2,
    borderColor: "rgba(22,33,30,0.1)",
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    padding: spacing.md,
  },
  selected: { borderColor: colors.brand600, backgroundColor: "#f5fbf8" },
  pressed: { opacity: 0.8 },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "rgba(22,33,30,0.25)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  radioSelected: { borderColor: colors.brand600 },
  dot: { width: 11, height: 11, borderRadius: 6, backgroundColor: colors.brand600 },
  body: { flex: 1, minWidth: 0 },
});
