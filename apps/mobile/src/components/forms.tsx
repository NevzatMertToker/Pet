import {
  ApiError,
  errorMessage,
  type Address,
  type PaymentMethod,
} from "@patipaket/shared";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { api } from "@/lib/api";
import { spacing } from "@/lib/theme";
import { Button, Field, Notice, Row, T } from "./ui";

/** Form gönderimlerinde ortak yükleniyor / hata durumu. */
export function useSubmit() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});

  async function run(action: () => Promise<void>) {
    setPending(true);
    setError(null);
    setFields({});
    try {
      await action();
    } catch (caught) {
      setError(errorMessage(caught));
      if (caught instanceof ApiError) setFields(caught.fields);
    } finally {
      setPending(false);
    }
  }
  return { pending, error, fields, run };
}

export function AddressForm({ onSaved, onCancel }: { onSaved: (address: Address) => void; onCancel?: () => void }) {
  const { pending, error, fields, run } = useSubmit();
  const [form, setForm] = useState({
    title: "Ev",
    fullName: "",
    phone: "",
    city: "",
    district: "",
    line: "",
  });
  const set = (key: keyof typeof form) => (value: string) => setForm((current) => ({ ...current, [key]: value }));

  return (
    <View style={styles.form}>
      {error && <Notice tone="error">{error}</Notice>}
      <Field label="Adres başlığı" value={form.title} onChangeText={set("title")} placeholder="Ev, İş..." error={fields.title} />
      <Field
        label="Teslim alacak kişi"
        value={form.fullName}
        onChangeText={set("fullName")}
        autoComplete="name"
        textContentType="name"
        error={fields.fullName}
      />
      <Field
        label="Cep telefonu"
        value={form.phone}
        onChangeText={set("phone")}
        keyboardType="phone-pad"
        autoComplete="tel"
        textContentType="telephoneNumber"
        placeholder="05XX XXX XX XX"
        error={fields.phone}
      />
      <Row style={styles.pair}>
        <View style={styles.flex}>
          <Field label="İl" value={form.city} onChangeText={set("city")} placeholder="İstanbul" error={fields.city} />
        </View>
        <View style={styles.flex}>
          <Field label="İlçe" value={form.district} onChangeText={set("district")} placeholder="Kadıköy" error={fields.district} />
        </View>
      </Row>
      <Field
        label="Açık adres"
        value={form.line}
        onChangeText={set("line")}
        placeholder="Mahalle, sokak, bina ve daire no"
        multiline
        error={fields.line}
      />
      <Row>
        <Button
          title="Adresi kaydet"
          loading={pending}
          style={styles.flex}
          onPress={() =>
            run(async () => {
              const { address } = await api.addresses.create(form);
              onSaved(address);
            })
          }
        />
        {onCancel && <Button title="Vazgeç" variant="ghost" onPress={onCancel} />}
      </Row>
    </View>
  );
}

function formatCardNumber(value: string): string {
  return value
    .replace(/\D/g, "")
    .slice(0, 19)
    .replace(/(\d{4})(?=\d)/g, "$1 ");
}

function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  return digits.length > 2 ? digits.slice(0, 2) + "/" + digits.slice(2) : digits;
}

export function CardForm({
  testMode,
  onSaved,
  onCancel,
}: {
  testMode: boolean;
  onSaved: (paymentMethod: PaymentMethod) => void;
  onCancel?: () => void;
}) {
  const { pending, error, fields, run } = useSubmit();
  const [cardHolder, setCardHolder] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [expiryError, setExpiryError] = useState<string | undefined>();

  function submit() {
    const [month, year] = expiry.split("/");
    if (!month || !year || year.length !== 2) {
      setExpiryError("AA/YY biçiminde girin");
      return;
    }
    setExpiryError(undefined);
    void run(async () => {
      const { paymentMethod } = await api.paymentMethods.create({
        cardHolder,
        cardNumber,
        expMonth: Number(month),
        expYear: Number(year),
        cvc,
      });
      onSaved(paymentMethod);
    });
  }

  return (
    <View style={styles.form}>
      {testMode && (
        <Notice tone="warn">
          Test modu: gerçek ödeme alınmaz. Onaylanan test kartı 4242 4242 4242 4242, reddedilen test kartı 4000 0000 0000
          0002. Tarih ileri bir tarih, güvenlik kodu herhangi 3 hane olabilir.
        </Notice>
      )}
      {error && <Notice tone="error">{error}</Notice>}
      <Field
        label="Kart üzerindeki ad soyad"
        value={cardHolder}
        onChangeText={setCardHolder}
        autoComplete="cc-name"
        autoCapitalize="words"
        error={fields.cardHolder}
      />
      <Field
        label="Kart numarası"
        value={cardNumber}
        onChangeText={(value) => setCardNumber(formatCardNumber(value))}
        keyboardType="number-pad"
        autoComplete="cc-number"
        placeholder="0000 0000 0000 0000"
        error={fields.cardNumber}
      />
      <Row style={styles.pair}>
        <View style={styles.flex}>
          <Field
            label="Son kullanma"
            value={expiry}
            onChangeText={(value) => setExpiry(formatExpiry(value))}
            keyboardType="number-pad"
            autoComplete="cc-exp"
            placeholder="AA/YY"
            error={expiryError ?? fields.expMonth ?? fields.expYear}
          />
        </View>
        <View style={styles.flex}>
          <Field
            label="Güvenlik kodu"
            value={cvc}
            onChangeText={(value) => setCvc(value.replace(/\D/g, "").slice(0, 4))}
            keyboardType="number-pad"
            autoComplete="cc-csc"
            placeholder="CVC"
            secureTextEntry
            error={fields.cvc}
          />
        </View>
      </Row>
      <T variant="small">
        Kart numaranız ve güvenlik kodunuz sunucularımızda saklanmaz; kartınız ödeme kuruluşunda güvenle saklanır.
      </T>
      <Row>
        <Button title="Kartı kaydet" loading={pending} style={styles.flex} onPress={submit} />
        {onCancel && <Button title="Vazgeç" variant="ghost" onPress={onCancel} />}
      </Row>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  form: { gap: spacing.md },
  pair: { alignItems: "flex-start" },
});
