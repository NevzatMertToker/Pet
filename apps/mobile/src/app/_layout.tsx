import { DMSans_400Regular } from "@expo-google-fonts/dm-sans/400Regular";
import { DMSans_500Medium } from "@expo-google-fonts/dm-sans/500Medium";
import { DMSans_600SemiBold } from "@expo-google-fonts/dm-sans/600SemiBold";
import { DMSans_700Bold } from "@expo-google-fonts/dm-sans/700Bold";
import { Fredoka_500Medium } from "@expo-google-fonts/fredoka/500Medium";
import { Fredoka_600SemiBold } from "@expo-google-fonts/fredoka/600SemiBold";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { colors, fonts } from "@/lib/theme";

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
    Fredoka_500Medium,
    Fredoka_600SemiBold,
  });
  const sessionReady = useAuth((state) => state.ready);
  const ready = (fontsLoaded || fontError !== null) && sessionReady;

  useEffect(() => {
    void useAuth.getState().restore(async () => (await api.auth.me()).user);
  }, []);

  useEffect(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.cream },
          headerTintColor: colors.ink,
          headerTitleStyle: { fontFamily: fonts.display, fontSize: 19 },
          headerShadowVisible: false,
          headerBackButtonDisplayMode: "minimal",
          contentStyle: { backgroundColor: colors.cream },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="urun/[slug]" options={{ title: "" }} />
        <Stack.Screen name="giris" options={{ title: "Giriş yap", presentation: "modal" }} />
        <Stack.Screen name="odeme" options={{ title: "Ödeme" }} />
        <Stack.Screen name="siparisler" options={{ title: "Siparişlerim" }} />
        <Stack.Screen name="siparis/[id]" options={{ title: "Sipariş" }} />
        <Stack.Screen name="abonelik/[id]" options={{ title: "Aboneliği yönet" }} />
        <Stack.Screen name="adresler" options={{ title: "Adreslerim" }} />
        <Stack.Screen name="kartlar" options={{ title: "Ödeme yöntemlerim" }} />
        <Stack.Screen name="dostlar" options={{ title: "Dostlarım" }} />
      </Stack>
    </>
  );
}
