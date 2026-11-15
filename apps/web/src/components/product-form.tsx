"use client";

import {
  PRODUCT_TYPES,
  PRODUCT_TYPE_LABELS,
  SPECIES,
  SPECIES_LABELS,
  type Product,
} from "@patipaket/shared";
import Link from "next/link";
import { useActionState } from "react";
import { saveProductAction, type ProductFormState } from "@/app/yonetim/actions";
import { Field, Notice, SelectField, TextField } from "./ui";

const INITIAL: ProductFormState = { error: null, fields: {} };

/** Kuruşu form alanında gösterilecek "349,90" biçimine çevirir. */
function priceText(kurus: number | null | undefined): string {
  return kurus ? (kurus / 100).toFixed(2).replace(".", ",") : "";
}

function Toggle({ name, label, hint, defaultChecked }: { name: string; label: string; hint: string; defaultChecked: boolean }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-ink/10 p-4">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="mt-0.5 h-4 w-4 rounded accent-brand-600" />
      <span>
        <span className="block text-sm font-semibold">{label}</span>
        <span className="block text-[13px] text-ink/55">{hint}</span>
      </span>
    </label>
  );
}

export function ProductForm({ product }: { product?: Product }) {
  const [state, action, pending] = useActionState(saveProductAction, INITIAL);

  return (
    <form action={action} className="card max-w-3xl space-y-5 p-5 sm:p-7">
      {product && <input type="hidden" name="id" value={product.id} />}
      {state.error && <Notice tone="error">{state.error}</Notice>}

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Marka" name="brand" defaultValue={product?.brand} error={state.fields.brand} required />
        <TextField label="Ürün adı" name="name" defaultValue={product?.name} error={state.fields.name} required />
        <SelectField label="Hayvan" name="species" defaultValue={product?.species ?? "cat"} error={state.fields.species}>
          {SPECIES.map((species) => (
            <option key={species} value={species}>
              {SPECIES_LABELS[species]}
            </option>
          ))}
        </SelectField>
        <SelectField label="Kategori" name="type" defaultValue={product?.type ?? "food"} error={state.fields.type}>
          {PRODUCT_TYPES.map((type) => (
            <option key={type} value={type}>
              {PRODUCT_TYPE_LABELS[type]}
            </option>
          ))}
        </SelectField>
        <TextField
          label="Paket boyutu"
          name="packageSize"
          placeholder="örn. 10 kg, 100 adet"
          defaultValue={product?.packageSize}
          error={state.fields.packageSize}
          required
        />
        <TextField
          label="Stok adedi"
          name="stock"
          type="number"
          min={0}
          defaultValue={product?.stock ?? 0}
          error={state.fields.stock}
          required
        />
        <TextField
          label="Satış fiyatı (TL)"
          name="price"
          inputMode="decimal"
          placeholder="349,90"
          defaultValue={priceText(product?.price)}
          error={state.fields.price}
          required
        />
        <TextField
          label="Üstü çizili eski fiyat (TL, isteğe bağlı)"
          name="compareAtPrice"
          inputMode="decimal"
          defaultValue={priceText(product?.compareAtPrice)}
          error={state.fields.compareAtPrice}
        />
        <TextField
          label="Ortalama bitme süresi (hafta)"
          name="suggestedIntervalWeeks"
          type="number"
          min={1}
          max={52}
          hint="Abonelik sıklığı önerisi olarak gösterilir."
          defaultValue={product?.suggestedIntervalWeeks ?? ""}
          error={state.fields.suggestedIntervalWeeks}
        />
        <TextField
          label="Görsel adresi (isteğe bağlı)"
          name="imageUrl"
          type="url"
          placeholder="https://..."
          hint="Boş bırakılırsa otomatik çizim kullanılır."
          defaultValue={product?.imageUrl ?? ""}
          error={state.fields.imageUrl}
        />
      </div>

      <Field label="Açıklama" error={state.fields.description}>
        <textarea name="description" rows={4} defaultValue={product?.description} className="input" required />
      </Field>

      <div className="grid gap-3 sm:grid-cols-3">
        <Toggle name="isActive" label="Satışta" hint="Kapalıysa mağazada görünmez." defaultChecked={product?.isActive ?? true} />
        <Toggle
          name="subscribable"
          label="Abonelikle satılır"
          hint="Düzenli gönderim seçeneği sunulur."
          defaultChecked={product?.subscribable ?? true}
        />
        <Toggle name="isFeatured" label="Öne çıkan" hint="Ana sayfada gösterilir." defaultChecked={product?.isFeatured ?? false} />
      </div>

      <div className="flex gap-2">
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? "Kaydediliyor…" : product ? "Değişiklikleri kaydet" : "Ürünü ekle"}
        </button>
        <Link href="/yonetim/urunler" className="btn btn-ghost">
          Vazgeç
        </Link>
      </div>
    </form>
  );
}
