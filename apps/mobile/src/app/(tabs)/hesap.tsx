import { router } from "expo-router";
import { StyleSheet, View } from "react-native";
import { SignInPrompt, useSignedIn } from "@/components/status";
import { Button, Card, Divider, ListItem, Row, Screen, T } from "@/components/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { colors, fonts, spacing } from "@/lib/theme";

const MENU = [
  { icon: "cube-outline", title: "Siparişlerim", subtitle: "Geçmiş siparişler ve teslimatlar", href: "/siparisler" },
  { icon: "location-outline", title: "Adreslerim", subtitle: "Teslimat adreslerini yönet", href: "/adresler" },
  { icon: "card-outline", title: "Ödeme yöntemlerim", subtitle: "Kayıtlı kartlar", href: "/kartlar" },
  { icon: "heart-outline", title: "Dostlarım", subtitle: "Kedi, köpek ve kuşlarınız", href: "/dostlar" },
] as const;

export default function AccountScreen() {
  const signedIn = useSignedIn();
  const user = useAuth((state) => state.user);
  const signOut = useAuth((state) => state.signOut);

  if (!signedIn) {
    return (
      <SignInPrompt
        icon="person-circle-outline"
        title="Hesabınıza giriş yapın"
        text="Siparişlerinizi takip etmek ve aboneliklerinizi yönetmek için giriş yapın ya da hesap oluşturun."
      />
    );
  }

  function logout() {
    // Sunucudaki oturum çerezi (varsa) temizlenir; yanıt beklenmeden yerelde çıkış yapılır.
    void api.auth.logout().catch(() => undefined);
    signOut();
  }

  return (
    <Screen>
      <Row style={styles.profile}>
        <View style={styles.avatar}>
          <T style={styles.avatarText}>{(user?.name ?? "?").trim().charAt(0).toLocaleUpperCase("tr")}</T>
        </View>
        <View style={styles.flex}>
          <T variant="title">{user?.name ?? "Hesabım"}</T>
          {user && <T variant="small">{user.email}</T>}
        </View>
      </Row>

      <Card>
        {MENU.map((item, index) => (
          <View key={item.href}>
            {index > 0 && <Divider />}
            <ListItem icon={item.icon} title={item.title} subtitle={item.subtitle} onPress={() => router.push(item.href)} />
          </View>
        ))}
      </Card>

      <Button title="Çıkış yap" icon="log-out-outline" variant="outline" onPress={logout} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  profile: { paddingVertical: spacing.sm },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.brand100,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontFamily: fonts.display, fontSize: 26, color: colors.brand800 },
});
