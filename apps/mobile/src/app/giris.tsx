import { SUBSCRIPTION_DISCOUNT_PERCENT } from "@patipaket/shared";
import { router, useLocalSearchParams, useNavigation } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { PawMark } from "@/components/art";
import { useSubmit } from "@/components/forms";
import { Button, Field, Notice, Screen, T } from "@/components/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { colors, spacing } from "@/lib/theme";

export default function LoginScreen() {
  const { sonra } = useLocalSearchParams<{ sonra?: string }>();
  const navigation = useNavigation();
  const signIn = useAuth((state) => state.signIn);
  const { pending, error, fields, run } = useSubmit();
  const [register, setRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    navigation.setOptions({ title: register ? "Hesap oluştur" : "Giriş yap" });
  }, [navigation, register]);

  function submit() {
    void run(async () => {
      const result = register
        ? await api.auth.register({ name, email, password })
        : await api.auth.login({ email, password });
      signIn(result);
      // Yalnızca uygulama içi adreslere dönülür.
      if (sonra && sonra.startsWith("/") && !sonra.startsWith("//")) router.replace(sonra as "/odeme");
      else if (router.canGoBack()) router.back();
      else router.replace("/");
    });
  }

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.logo}>
          <PawMark size={34} />
        </View>
        <T variant="display" style={styles.center}>
          {register ? "Hesabınızı oluşturun" : "Tekrar hoş geldiniz"}
        </T>
        <T style={[styles.center, styles.subtitle]}>
          Abonelikte her teslimatta %{SUBSCRIPTION_DISCOUNT_PERCENT} indirim ve ücretsiz kargo.
        </T>
      </View>

      {error && <Notice tone="error">{error}</Notice>}

      {register && (
        <Field
          label="Ad soyad"
          value={name}
          onChangeText={setName}
          autoComplete="name"
          textContentType="name"
          autoCapitalize="words"
          error={fields.name}
        />
      )}
      <Field
        label="E-posta"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoComplete="email"
        textContentType="emailAddress"
        autoCapitalize="none"
        autoCorrect={false}
        error={fields.email}
      />
      <Field
        label="Şifre"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete={register ? "new-password" : "current-password"}
        textContentType={register ? "newPassword" : "password"}
        hint={register ? "En az 8 karakter" : undefined}
        error={fields.password}
        onSubmitEditing={submit}
        returnKeyType="go"
      />

      <Button title={register ? "Hesap oluştur" : "Giriş yap"} loading={pending} onPress={submit} />
      <Button
        title={register ? "Zaten hesabım var, giriş yap" : "Hesabım yok, hemen oluştur"}
        variant="ghost"
        onPress={() => setRegister((value) => !value)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: "center", gap: spacing.sm, marginVertical: spacing.lg },
  logo: {
    width: 68,
    height: 68,
    borderRadius: 24,
    backgroundColor: colors.brand600,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  center: { textAlign: "center" },
  subtitle: { color: colors.inkSoft },
});
