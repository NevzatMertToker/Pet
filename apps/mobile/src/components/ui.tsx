import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps, ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { colors, fonts, radius, shadow, spacing } from "@/lib/theme";

export type IconName = ComponentProps<typeof Ionicons>["name"];

/* ------------------------------------------------------------------ metin */

const TEXT_VARIANTS = StyleSheet.create({
  display: { fontFamily: fonts.display, fontSize: 28, lineHeight: 33, color: colors.ink },
  title: { fontFamily: fonts.display, fontSize: 21, lineHeight: 26, color: colors.ink },
  heading: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 22, color: colors.ink },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, color: colors.ink },
  small: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, color: colors.inkSoft },
  label: { fontFamily: fonts.bold, fontSize: 11, lineHeight: 14, letterSpacing: 0.8, color: colors.inkMuted },
});

export function T({
  variant = "body",
  style,
  children,
  numberOfLines,
}: {
  variant?: keyof typeof TEXT_VARIANTS;
  style?: StyleProp<TextStyle>;
  children: ReactNode;
  numberOfLines?: number;
}) {
  return (
    <Text style={[TEXT_VARIANTS[variant], style]} numberOfLines={numberOfLines}>
      {children}
    </Text>
  );
}

/* ----------------------------------------------------------------- düzen */

export function Screen({
  children,
  refreshing,
  onRefresh,
  footer,
  padded = true,
}: {
  children: ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  /** Ekranın altına sabitlenen alan (ör. "Sepete ekle" çubuğu). */
  footer?: ReactNode;
  padded?: boolean;
}) {
  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.screenContent, padded && styles.screenPadded]}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        showsVerticalScrollIndicator={false}
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={refreshing ?? false} onRefresh={onRefresh} tintColor={colors.brand600} />
          ) : undefined
        }
      >
        {children}
      </ScrollView>
      {footer && <View style={styles.footer}>{footer}</View>}
    </View>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Row({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.row, style]}>{children}</View>;
}

export function Divider() {
  return <View style={styles.divider} />;
}

/* ---------------------------------------------------------------- düğmeler */

type ButtonVariant = "primary" | "accent" | "outline" | "ghost" | "danger" | "onDark";

const BUTTON_COLORS: Record<ButtonVariant, { bg: string; fg: string; border?: string }> = {
  primary: { bg: colors.brand600, fg: colors.white },
  accent: { bg: colors.accent400, fg: colors.ink },
  outline: { bg: colors.white, fg: colors.ink, border: "rgba(22,33,30,0.16)" },
  ghost: { bg: "transparent", fg: colors.brand700 },
  danger: { bg: colors.white, fg: colors.danger, border: "#f3c6c0" },
  onDark: { bg: "rgba(255,255,255,0.14)", fg: colors.white },
};

export function Button({
  title,
  onPress,
  variant = "primary",
  icon,
  loading,
  disabled,
  small,
  style,
}: {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  small?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const palette = BUTTON_COLORS[variant];
  const inactive = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        small && styles.buttonSmall,
        { backgroundColor: palette.bg, borderColor: palette.border ?? "transparent" },
        inactive && styles.buttonDisabled,
        pressed && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={palette.fg} size="small" />
      ) : (
        icon && <Ionicons name={icon} size={small ? 16 : 19} color={palette.fg} />
      )}
      <Text style={[styles.buttonText, small && styles.buttonTextSmall, { color: palette.fg }]} numberOfLines={1}>
        {title}
      </Text>
    </Pressable>
  );
}

export function Chip({
  label,
  selected,
  onPress,
  badge,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  badge?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.chip, selected && styles.chipSelected, pressed && styles.pressed]}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
      {badge && (
        <View style={styles.chipBadge}>
          <Text style={styles.chipBadgeText}>{badge}</Text>
        </View>
      )}
    </Pressable>
  );
}

/* ----------------------------------------------------------------- rozetler */

const BADGE_TONES = {
  brand: { bg: colors.brand100, fg: colors.brand800 },
  accent: { bg: colors.accent100, fg: colors.accent700 },
  muted: { bg: "rgba(22,33,30,0.07)", fg: colors.inkSoft },
  warn: { bg: colors.warnBg, fg: colors.warnText },
  danger: { bg: colors.dangerBg, fg: colors.danger },
  dark: { bg: "rgba(22,33,30,0.82)", fg: colors.white },
  light: { bg: "rgba(255,255,255,0.95)", fg: colors.brand800 },
} as const;

export type BadgeTone = keyof typeof BADGE_TONES;

export function Badge({ label, tone = "brand", icon }: { label: string; tone?: BadgeTone; icon?: IconName }) {
  const palette = BADGE_TONES[tone];
  return (
    <View style={[styles.badge, { backgroundColor: palette.bg }]}>
      {icon && <Ionicons name={icon} size={12} color={palette.fg} />}
      <Text style={[styles.badgeText, { color: palette.fg }]}>{label}</Text>
    </View>
  );
}

/* --------------------------------------------------------------- form alanı */

export function Field({
  label,
  error,
  hint,
  ...input
}: TextInputProps & { label: string; error?: string; hint?: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor="rgba(22,33,30,0.35)"
        {...input}
        style={[styles.input, error ? styles.inputError : null, input.multiline && styles.inputMultiline]}
      />
      {error ? <Text style={styles.fieldError}>{error}</Text> : hint ? <Text style={styles.fieldHint}>{hint}</Text> : null}
    </View>
  );
}

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 20,
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <View style={styles.stepper}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Azalt"
        disabled={value <= min}
        onPress={() => onChange(value - 1)}
        style={({ pressed }) => [styles.stepperButton, value <= min && styles.stepperDisabled, pressed && styles.pressed]}
      >
        <Ionicons name="remove" size={18} color={colors.ink} />
      </Pressable>
      <Text style={styles.stepperValue}>{value}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Artır"
        disabled={value >= max}
        onPress={() => onChange(value + 1)}
        style={({ pressed }) => [styles.stepperButton, value >= max && styles.stepperDisabled, pressed && styles.pressed]}
      >
        <Ionicons name="add" size={18} color={colors.ink} />
      </Pressable>
    </View>
  );
}

/* ------------------------------------------------------------------ durum */

const NOTICE_TONES = {
  error: { bg: colors.dangerBg, fg: "#8c2a1f", icon: "alert-circle" },
  success: { bg: colors.brand50, fg: colors.brand900, icon: "checkmark-circle" },
  warn: { bg: colors.warnBg, fg: colors.warnText, icon: "warning" },
  info: { bg: "#e8f3ff", fg: "#0e3360", icon: "information-circle" },
} satisfies Record<string, { bg: string; fg: string; icon: IconName }>;

export function Notice({ tone = "info", children }: { tone?: keyof typeof NOTICE_TONES; children: ReactNode }) {
  const palette = NOTICE_TONES[tone];
  return (
    <View style={[styles.notice, { backgroundColor: palette.bg }]} accessibilityRole="alert">
      <Ionicons name={palette.icon} size={18} color={palette.fg} />
      <Text style={[styles.noticeText, { color: palette.fg }]}>{children}</Text>
    </View>
  );
}

export function Loading() {
  return (
    <View style={styles.center}>
      <ActivityIndicator color={colors.brand600} size="large" />
    </View>
  );
}

export function EmptyState({
  icon,
  title,
  text,
  action,
}: {
  icon: IconName;
  title: string;
  text: string;
  action?: ReactNode;
}) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Ionicons name={icon} size={34} color={colors.brand600} />
      </View>
      <T variant="title" style={styles.emptyTitle}>
        {title}
      </T>
      <T variant="body" style={styles.emptyText}>
        {text}
      </T>
      {action && <View style={styles.emptyAction}>{action}</View>}
    </View>
  );
}

/** Yükleme / hata / veri durumlarını tek yerde ele alır. */
export function QueryView<T>({
  query,
  children,
}: {
  query: { data: T | null; error: string | null; loading: boolean; reload: () => void };
  children: (data: T) => ReactNode;
}) {
  if (query.loading && !query.data) return <Loading />;
  if (query.error && !query.data) {
    return (
      <EmptyState
        icon="cloud-offline-outline"
        title="Yüklenemedi"
        text={query.error}
        action={<Button title="Tekrar dene" onPress={query.reload} icon="refresh" />}
      />
    );
  }
  return query.data ? <>{children(query.data)}</> : null;
}

export function SectionHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <Row style={styles.sectionHeader}>
      <T variant="title">{title}</T>
      {action}
    </Row>
  );
}

export function ListItem({
  icon,
  title,
  subtitle,
  onPress,
  right,
}: {
  icon?: IconName;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  right?: ReactNode;
}) {
  const content = (
    <>
      {icon && (
        <View style={styles.listIcon}>
          <Ionicons name={icon} size={20} color={colors.brand700} />
        </View>
      )}
      <View style={styles.flex}>
        <T variant="heading">{title}</T>
        {subtitle && <T variant="small">{subtitle}</T>}
      </View>
      {right ?? (onPress && <Ionicons name="chevron-forward" size={18} color={colors.inkMuted} />)}
    </>
  );
  if (!onPress) return <View style={styles.listItem}>{content}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.listItem, pressed && styles.pressed]}
    >
      {content}
    </Pressable>
  );
}

export const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  screen: { flex: 1, backgroundColor: colors.cream },
  screenContent: { paddingBottom: spacing.xxl * 2, gap: spacing.lg, width: "100%", maxWidth: 640, alignSelf: "center" },
  screenPadded: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.line,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.lg,
    ...shadow,
  },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  divider: { height: 1, backgroundColor: colors.line, marginVertical: spacing.md },
  pressed: { opacity: 0.72 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xxl, minHeight: 240 },

  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    minHeight: 50,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  buttonSmall: { minHeight: 38, paddingHorizontal: spacing.lg },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { fontFamily: fonts.semibold, fontSize: 16 },
  buttonTextSmall: { fontSize: 14 },

  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: "rgba(22,33,30,0.14)",
    backgroundColor: colors.white,
  },
  chipSelected: { backgroundColor: colors.brand600, borderColor: colors.brand600 },
  chipText: { fontFamily: fonts.semibold, fontSize: 14, color: colors.inkSoft },
  chipTextSelected: { color: colors.white },
  chipBadge: { backgroundColor: colors.accent400, borderRadius: radius.pill, paddingHorizontal: 6, paddingVertical: 1 },
  chipBadgeText: { fontFamily: fonts.bold, fontSize: 10, color: colors.ink },

  badge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  badgeText: { fontFamily: fonts.bold, fontSize: 11.5 },

  field: { gap: 6 },
  fieldLabel: { fontFamily: fonts.medium, fontSize: 14, color: colors.inkSoft },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: "rgba(22,33,30,0.16)",
    borderRadius: radius.md,
    backgroundColor: colors.white,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.ink,
  },
  inputMultiline: { minHeight: 84, textAlignVertical: "top" },
  inputError: { borderColor: colors.danger },
  fieldError: { fontFamily: fonts.medium, fontSize: 13, color: colors.danger },
  fieldHint: { fontFamily: fonts.regular, fontSize: 13, color: colors.inkMuted },

  stepper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(22,33,30,0.16)",
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    padding: 2,
  },
  stepperButton: { width: 36, height: 36, alignItems: "center", justifyContent: "center", borderRadius: radius.pill },
  stepperDisabled: { opacity: 0.3 },
  stepperValue: { minWidth: 26, textAlign: "center", fontFamily: fonts.semibold, fontSize: 15, color: colors.ink },

  notice: { flexDirection: "row", gap: spacing.sm, padding: spacing.md, borderRadius: radius.md, alignItems: "flex-start" },
  noticeText: { flex: 1, fontFamily: fonts.medium, fontSize: 14, lineHeight: 20 },

  empty: { alignItems: "center", paddingVertical: spacing.xxl * 1.5, paddingHorizontal: spacing.xl },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: colors.brand50,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: { marginTop: spacing.lg, textAlign: "center" },
  emptyText: { marginTop: spacing.sm, textAlign: "center", color: colors.inkSoft },
  emptyAction: { marginTop: spacing.xl, alignSelf: "stretch", alignItems: "center" },

  sectionHeader: { justifyContent: "space-between" },
  listItem: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: spacing.md },
  listIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.brand50,
    alignItems: "center",
    justifyContent: "center",
  },
});
