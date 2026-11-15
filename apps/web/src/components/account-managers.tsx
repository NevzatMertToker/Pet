"use client";

import {
  ApiError,
  SPECIES,
  SPECIES_LABELS,
  errorMessage,
  formatDate,
  maskedCard,
  type Address,
  type PaymentMethod,
  type Pet,
  type Species,
  type User,
} from "@patipaket/shared";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { api } from "@/lib/api";
import { AddressForm, CardForm } from "./account-forms";
import { Icon } from "./icons";
import { SpeciesArt } from "./product-art";
import { EmptyState, Notice, SelectField, TextField } from "./ui";

/* ---------------------------------------------------------------- adresler */

export function AddressManager({ initial }: { initial: Address[] }) {
  const router = useRouter();
  const [addresses, setAddresses] = useState(initial);
  const [editing, setEditing] = useState<string | "new" | null>(initial.length === 0 ? "new" : null);
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    const { addresses: fresh } = await api.addresses.list();
    setAddresses(fresh);
    router.refresh();
  }

  async function remove(id: string) {
    setError(null);
    try {
      await api.addresses.remove(id);
      await reload();
    } catch (caught) {
      setError(errorMessage(caught));
    }
  }

  return (
    <div className="space-y-4">
      {error && <Notice tone="error">{error}</Notice>}

      {addresses.map((address) =>
        editing === address.id ? (
          <div key={address.id} className="card p-5 sm:p-6">
            <p className="mb-4 font-semibold">Adresi düzenle</p>
            <AddressForm
              initial={address}
              onSaved={() => {
                setEditing(null);
                void reload();
              }}
              onCancel={() => setEditing(null)}
            />
          </div>
        ) : (
          <div key={address.id} className="card flex flex-wrap items-start justify-between gap-4 p-5">
            <div className="flex gap-3.5">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-700">
                <Icon name="pin" />
              </span>
              <div>
                <p className="flex items-center gap-2 font-semibold">
                  {address.title}
                  {address.isDefault && <span className="badge badge-brand">Varsayılan</span>}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-ink/65">
                  {address.fullName} · {address.phone}
                  <br />
                  {address.line}, {address.district} / {address.city}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button type="button" className="btn btn-sm btn-outline" onClick={() => setEditing(address.id)}>
                <Icon name="edit" className="h-4 w-4" />
                Düzenle
              </button>
              <button type="button" className="btn btn-sm btn-danger" onClick={() => remove(address.id)}>
                Sil
              </button>
            </div>
          </div>
        ),
      )}

      {editing === "new" ? (
        <div className="card p-5 sm:p-6">
          <p className="mb-4 font-semibold">Yeni adres</p>
          <AddressForm
            onSaved={() => {
              setEditing(null);
              void reload();
            }}
            onCancel={addresses.length > 0 ? () => setEditing(null) : undefined}
          />
        </div>
      ) : (
        <button type="button" className="btn btn-primary" onClick={() => setEditing("new")}>
          <Icon name="plus" className="h-4 w-4" />
          Yeni adres ekle
        </button>
      )}
    </div>
  );
}

/* --------------------------------------------------------- ödeme yöntemleri */

export function PaymentMethodManager({ initial, testMode }: { initial: PaymentMethod[]; testMode: boolean }) {
  const router = useRouter();
  const [methods, setMethods] = useState(initial);
  const [adding, setAdding] = useState(initial.length === 0);
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    const { paymentMethods } = await api.paymentMethods.list();
    setMethods(paymentMethods);
    router.refresh();
  }

  async function remove(id: string) {
    setError(null);
    try {
      await api.paymentMethods.remove(id);
      await reload();
    } catch (caught) {
      setError(errorMessage(caught));
    }
  }

  return (
    <div className="space-y-4">
      {error && <Notice tone="error">{error}</Notice>}

      {methods.map((method) => (
        <div key={method.id} className="card flex flex-wrap items-center justify-between gap-4 p-5">
          <div className="flex items-center gap-3.5">
            <span className="grid h-11 w-14 shrink-0 place-items-center rounded-xl bg-ink text-white">
              <Icon name="card" />
            </span>
            <div>
              <p className="flex items-center gap-2 font-semibold">
                {maskedCard(method.brand, method.last4)}
                {method.isDefault && <span className="badge badge-brand">Varsayılan</span>}
              </p>
              <p className="text-sm text-ink/60">
                {method.cardHolder} · Son kullanma {String(method.expMonth).padStart(2, "0")}/
                {String(method.expYear).slice(-2)}
              </p>
            </div>
          </div>
          <button type="button" className="btn btn-sm btn-danger" onClick={() => remove(method.id)}>
            Sil
          </button>
        </div>
      ))}

      {adding ? (
        <div className="card p-5 sm:p-6">
          <p className="mb-4 font-semibold">Yeni kart</p>
          <CardForm
            testMode={testMode}
            onSaved={() => {
              setAdding(false);
              void reload();
            }}
            onCancel={methods.length > 0 ? () => setAdding(false) : undefined}
          />
        </div>
      ) : (
        <button type="button" className="btn btn-primary" onClick={() => setAdding(true)}>
          <Icon name="plus" className="h-4 w-4" />
          Yeni kart ekle
        </button>
      )}
    </div>
  );
}

/* ----------------------------------------------------------------- dostlar */

export function PetManager({ initial }: { initial: Pet[] }) {
  const [pets, setPets] = useState(initial);
  const [adding, setAdding] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const weight = String(data.get("weightKg") ?? "").replace(",", ".");
    setPending(true);
    setError(null);
    setFields({});
    try {
      const { pet } = await api.pets.create({
        name: String(data.get("name") ?? ""),
        species: String(data.get("species")) as Species,
        breed: String(data.get("breed") ?? "").trim() || null,
        birthDate: String(data.get("birthDate") ?? "") || null,
        weightKg: weight ? Number(weight) : null,
      });
      setPets((list) => [...list, pet]);
      setAdding(false);
    } catch (caught) {
      setError(errorMessage(caught));
      if (caught instanceof ApiError) setFields(caught.fields);
    } finally {
      setPending(false);
    }
  }

  async function remove(id: string) {
    setError(null);
    try {
      await api.pets.remove(id);
      setPets((list) => list.filter((pet) => pet.id !== id));
    } catch (caught) {
      setError(errorMessage(caught));
    }
  }

  return (
    <div className="space-y-4">
      {error && <Notice tone="error">{error}</Notice>}

      {pets.length === 0 && !adding && (
        <EmptyState
          icon="heart"
          title="Dostunuzu tanıyalım"
          text="Kedinizi, köpeğinizi veya kuşunuzu ekleyin; ona uygun ürünleri daha kolay bulun."
          action={
            <button type="button" className="btn btn-primary" onClick={() => setAdding(true)}>
              Dost ekle
            </button>
          }
        />
      )}

      {pets.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {pets.map((pet) => (
            <div key={pet.id} className="card flex items-center gap-4 p-4">
              <span className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl">
                <SpeciesArt species={pet.species} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-lg font-semibold">{pet.name}</p>
                <p className="text-sm text-ink/60">
                  {[SPECIES_LABELS[pet.species], pet.breed, pet.weightKg ? pet.weightKg + " kg" : null]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                {pet.birthDate && <p className="text-[13px] text-ink/50">Doğum: {formatDate(pet.birthDate)}</p>}
              </div>
              <button
                type="button"
                onClick={() => remove(pet.id)}
                className="grid h-9 w-9 place-items-center rounded-full text-ink/40 transition hover:bg-red-50 hover:text-red-600"
                aria-label={pet.name + " kaydını sil"}
              >
                <Icon name="trash" className="h-[18px] w-[18px]" />
              </button>
            </div>
          ))}
        </div>
      )}

      {adding ? (
        <form onSubmit={handleSubmit} className="card space-y-4 p-5 sm:p-6" noValidate>
          <p className="font-semibold">Yeni dost</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Adı" name="name" error={fields.name} required autoFocus />
            <SelectField label="Türü" name="species" defaultValue="cat" error={fields.species}>
              {SPECIES.map((species) => (
                <option key={species} value={species}>
                  {SPECIES_LABELS[species]}
                </option>
              ))}
            </SelectField>
            <TextField label="Irkı (isteğe bağlı)" name="breed" error={fields.breed} />
            <TextField
              label="Kilosu (isteğe bağlı)"
              name="weightKg"
              inputMode="decimal"
              placeholder="örn. 4,5"
              error={fields.weightKg}
            />
            <TextField label="Doğum tarihi (isteğe bağlı)" name="birthDate" type="date" error={fields.birthDate} />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn btn-primary" disabled={pending}>
              {pending ? "Kaydediliyor…" : "Kaydet"}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setAdding(false)}>
              Vazgeç
            </button>
          </div>
        </form>
      ) : (
        pets.length > 0 && (
          <button type="button" className="btn btn-primary" onClick={() => setAdding(true)}>
            <Icon name="plus" className="h-4 w-4" />
            Dost ekle
          </button>
        )
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ profil */

export function ProfileForm({ user }: { user: User }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setPending(true);
    setSaved(false);
    setError(null);
    setFields({});
    try {
      await api.auth.updateProfile({
        name: String(data.get("name") ?? ""),
        phone: String(data.get("phone") ?? "").trim() || null,
      });
      setSaved(true);
      router.refresh();
    } catch (caught) {
      setError(errorMessage(caught));
      if (caught instanceof ApiError) setFields(caught.fields);
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card max-w-xl space-y-4 p-5 sm:p-6" noValidate>
      {error && <Notice tone="error">{error}</Notice>}
      {saved && <Notice tone="success">Bilgileriniz güncellendi.</Notice>}
      <TextField label="Ad soyad" name="name" autoComplete="name" defaultValue={user.name} error={fields.name} required />
      <TextField label="E-posta" name="email" defaultValue={user.email} disabled hint="E-posta adresi değiştirilemez." />
      <TextField
        label="Cep telefonu"
        name="phone"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        placeholder="05XX XXX XX XX"
        defaultValue={user.phone ?? ""}
        error={fields.phone}
      />
      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? "Kaydediliyor…" : "Kaydet"}
      </button>
    </form>
  );
}
