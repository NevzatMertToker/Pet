import { Ionicons } from "@expo/vector-icons";
import { cartCount } from "@patipaket/shared";
import { Tabs } from "expo-router/js-tabs";
import type { ComponentProps } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCart } from "@/lib/cart";
import { colors, fonts } from "@/lib/theme";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

function tabIcon(active: IoniconName, inactive: IoniconName) {
  return function TabIcon({ focused }: { focused: boolean }) {
    return (
      <Ionicons name={focused ? active : inactive} size={24} color={focused ? colors.brand600 : colors.inkMuted} />
    );
  };
}

export default function TabsLayout() {
  const count = useCart((state) => cartCount(state.items));
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.brand600,
        tabBarInactiveTintColor: colors.inkMuted,
        tabBarLabelStyle: { fontFamily: fonts.semibold, fontSize: 11, lineHeight: 14 },
        // Simge + etiket rahat sığsın; alt güvenli alan (ana ekran çizgisi) ayrıca eklenir.
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.line,
          height: 62 + insets.bottom,
          paddingTop: 7,
          paddingBottom: insets.bottom + 7,
        },
        headerStyle: { backgroundColor: colors.cream },
        headerTitleStyle: { fontFamily: fonts.display, fontSize: 21, color: colors.ink },
        headerTitleAlign: "left",
        headerShadowVisible: false,
        sceneStyle: { backgroundColor: colors.cream },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: "Ana Sayfa", headerShown: false, tabBarIcon: tabIcon("home", "home-outline") }}
      />
      <Tabs.Screen name="katalog" options={{ title: "Ürünler", tabBarIcon: tabIcon("grid", "grid-outline") }} />
      <Tabs.Screen
        name="sepet"
        options={{
          title: "Sepetim",
          tabBarLabel: "Sepet",
          tabBarIcon: tabIcon("cart", "cart-outline"),
          tabBarBadge: count > 0 ? count : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.accent400, color: colors.ink, fontFamily: fonts.bold, fontSize: 11 },
        }}
      />
      <Tabs.Screen
        name="abonelikler"
        options={{ title: "Aboneliklerim", tabBarLabel: "Abonelikler", tabBarIcon: tabIcon("repeat", "repeat-outline") }}
      />
      <Tabs.Screen
        name="hesap"
        options={{ title: "Hesabım", tabBarLabel: "Hesap", tabBarIcon: tabIcon("person", "person-outline") }}
      />
    </Tabs>
  );
}
