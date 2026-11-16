import { Platform } from "react-native";

/** Web sitesiyle aynı renk paleti. */
export const colors = {
  brand50: "#effaf5",
  brand100: "#d8f3e6",
  brand200: "#b4e6d0",
  brand500: "#2c9b78",
  brand600: "#1e7d61",
  brand700: "#1a6450",
  brand800: "#185041",
  brand900: "#143f34",
  accent100: "#ffe7d1",
  accent300: "#ffa869",
  accent400: "#ff8a3d",
  accent700: "#b33d0c",
  cream: "#fffaf2",
  sand: "#f6efe3",
  ink: "#16211e",
  inkSoft: "rgba(22,33,30,0.68)",
  inkMuted: "rgba(22,33,30,0.5)",
  line: "rgba(22,33,30,0.09)",
  white: "#ffffff",
  danger: "#c0392b",
  dangerBg: "#fdecea",
  warnBg: "#fff4d6",
  warnText: "#7a5200",
} as const;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28 } as const;
export const radius = { sm: 10, md: 14, lg: 20, xl: 26, pill: 999 } as const;

/**
 * Yazı tipleri kök layout'ta yüklenir. Başlıklarda Baloo 2 kullanılır: yuvarlak ve
 * sıcak bir karaktere sahiptir ve ş, ğ, İ gibi Türkçe harfleri eksiksiz çizer.
 */
export const fonts = {
  display: "Baloo2_700Bold",
  displayMedium: "Baloo2_600SemiBold",
  regular: "DMSans_400Regular",
  medium: "DMSans_500Medium",
  semibold: "DMSans_600SemiBold",
  bold: "DMSans_700Bold",
} as const;

export const shadow = Platform.select({
  ios: {
    shadowColor: "#16211e",
    shadowOpacity: 0.1,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
  },
  android: { elevation: 3 },
  default: { boxShadow: "0 10px 28px -12px rgba(22,33,30,0.22)" },
}) as object;
