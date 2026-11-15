"use client";

import {
  ApiError,
  TURKISH_CITIES,
  errorMessage,
  type Address,
  type AddressInput,
  type PaymentMethod,
} from "@patipaket/shared";
import { useState, type FormEvent } from "react";
import { api } from "@/lib/api";
import { Notice, SelectField, TextField } from "./ui";

/** Form gönderimlerinde ortak yükleniyor / hata durumu. */
function useSubmit() {
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

export function AddressForm({
  initial,
  onSaved,
  onCancel,
}: {
  initial?: Address;
  onSaved: (address: Address) => void;
  onCancel?: () => void;
}) {
  const { pending, error, fields, run } = useSubmit();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const text = (name: string) => String(data.get(name) ?? "");
    const input: AddressInput = {
      title: text("title"),
      fullName: text("fullName"),
      phone: text("phone"),
      city: text("city"),
      district: text("district"),
      line: text("line"),
      postalCode: text("postalCode").trim() || null,
      isDefault: data.get("isDefault") === "on",
    };
    void run(async () => {
      const { address } = initial ? await api.addresses.update(initial.id, input) : await api.addresses.create(input);
      onSaved(address);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {error && <Notice tone="error">{error}</Notice>}
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Adres başlığı"
          name="title"
          placeholder="Ev, İş..."
          defaultValue={initial?.title ?? "Ev"}
          error={fields.title}
          required
        />
        <TextField
          label="Teslim alacak kişi"
          name="fullName"
          autoComplete="name"
          defaultValue={initial?.fullName}
          error={fields.fullName}
          required
        />
        <TextField
          label="Cep telefonu"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="05XX XXX XX XX"
          defaultValue={initial?.phone}
          error={fields.phone}
          required
        />
        <SelectField label="İl" name="city" defaultValue={initial?.city ?? ""} error={fields.city} required>
          <option value="" disabled>
            İl seçin
          </option>
          {TURKISH_CITIES.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </SelectField>
        <TextField label="İlçe" name="district" defaultValue={initial?.district} error={fields.district} required />
        <TextField
          label="Posta kodu (isteğe bağlı)"
          name="postalCode"
          inputMode="numeric"
          maxLength={5}
          defaultValue={initial?.postalCode ?? ""}
          error={fields.postalCode}
        />
      </div>
      <TextField
        label="Açık adres"
        name="line"
        autoComplete="street-address"
        placeholder="Mahalle, sokak, bina ve daire no"
        defaultValue={initial?.line}
        error={fields.line}
        required
      />
      <label className="flex items-center gap-2.5 text-sm text-ink/75">
        <input
          type="checkbox"
          name="isDefault"
          defaultChecked={initial?.isDefault}
          className="h-4 w-4 rounded accent-brand-600"
        />
        Varsayılan adresim olsun
      </label>
      <div className="flex flex-wrap gap-2">
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? "Kaydediliyor…" : "Adresi kaydet"}
        </button>
        {onCancel && (
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            Vazgeç
          </button>
        )}
      </div>
    </form>
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
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [expiryError, setExpiryError] = useState<string | undefined>();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const [month, year] = expiry.split("/");
    if (!month || !year || year.length !== 2) {
      setExpiryError("AA/YY biçiminde girin");
      return;
    }
    setExpiryError(undefined);
    void run(async () => {
      const { paymentMethod } = await api.paymentMethods.create({
        cardHolder: String(data.get("cardHolder") ?? ""),
        cardNumber,
        expMonth: Number(month),
        expYear: Number(year),
        cvc: String(data.get("cvc") ?? ""),
      });
      onSaved(paymentMethod);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {testMode && (
        <Notice tone="warn">
          <strong className="font-semibold">Test modu:</strong> gerçek ödeme alınmaz. Onaylanan test kartı{" "}
          <code className="rounded bg-white/70 px-1 font-mono text-[13px]">4242 4242 4242 4242</code>, reddedilen test
          kartı <code className="rounded bg-white/70 px-1 font-mono text-[13px]">4000 0000 0000 0002</code>. Tarih ileri
          bir tarih, güvenlik kodu herhangi 3 hane olabilir.
        </Notice>
      )}
      {error && <Notice tone="error">{error}</Notice>}
      <TextField
        label="Kart üzerindeki ad soyad"
        name="cardHolder"
        autoComplete="cc-name"
        error={fields.cardHolder}
        required
      />
      <TextField
        label="Kart numarası"
        name="cardNumber"
        inputMode="numeric"
        autoComplete="cc-number"
        placeholder="0000 0000 0000 0000"
        value={cardNumber}
        onChange={(event) => setCardNumber(formatCardNumber(event.target.value))}
        error={fields.cardNumber}
        required
      />
      <div className="grid grid-cols-2 gap-4">
        <TextField
          label="Son kullanma"
          name="expiry"
          inputMode="numeric"
          autoComplete="cc-exp"
          placeholder="AA/YY"
          value={expiry}
          onChange={(event) => setExpiry(formatExpiry(event.target.value))}
          error={expiryError ?? fields.expMonth ?? fields.expYear}
          required
        />
        <TextField
          label="Güvenlik kodu"
          name="cvc"
          inputMode="numeric"
          autoComplete="cc-csc"
          placeholder="CVC"
          maxLength={4}
          error={fields.cvc}
          required
        />
      </div>
      <p className="text-[13px] leading-relaxed text-ink/55">
        Kart numaranız ve güvenlik kodunuz sunucularımızda saklanmaz; kartınız ödeme kuruluşunda güvenle saklanır ve
        abonelik teslimatlarında bu kayıt kullanılır.
      </p>
      <div className="flex flex-wrap gap-2">
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? "Kaydediliyor…" : "Kartı kaydet"}
        </button>
        {onCancel && (
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            Vazgeç
          </button>
        )}
      </div>
    </form>
  );
}
