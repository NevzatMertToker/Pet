"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminUser } from "@/lib/session";
import { HttpError } from "@/server/errors";
import {
  createProduct,
  orderUpdateSchema,
  productInputSchema,
  updateOrderStatus,
  updateProduct,
} from "@/server/services/admin";
import { releaseStalePendingOrders } from "@/server/services/orders";
import { processDueSubscriptions } from "@/server/services/subscriptions";

/** "1.249,90" veya "1249.90" biçimindeki TL tutarını kuruşa çevirir. */
function parsePrice(value: FormDataEntryValue | null): number | null {
  const text = String(value ?? "").replace(/[\s₺]/g, "");
  if (!text) return null;
  const normalized = text.includes(",") ? text.replace(/\./g, "").replace(",", ".") : text;
  const amount = Number(normalized);
  return Number.isFinite(amount) ? Math.round(amount * 100) : Number.NaN;
}

export async function updateOrderAction(formData: FormData): Promise<void> {
  await requireAdminUser();
  const id = String(formData.get("id") ?? "");
  const parsed = orderUpdateSchema.safeParse({
    status: formData.get("status"),
    trackingNumber: String(formData.get("trackingNumber") ?? ""),
  });

  let failure: string | null = null;
  if (!parsed.success) {
    failure = "Geçersiz sipariş durumu.";
  } else {
    try {
      await updateOrderStatus(id, parsed.data);
    } catch (error) {
      if (!(error instanceof HttpError)) throw error;
      failure = error.message;
    }
  }
  if (failure) redirect("/yonetim/siparisler?hata=" + encodeURIComponent(failure));
  revalidatePath("/yonetim", "layout");
}

export async function runRenewalsAction(): Promise<void> {
  await requireAdminUser();
  await releaseStalePendingOrders();
  const summary = await processDueSubscriptions();
  redirect(
    "/yonetim?calisti=1&yenilenen=" +
      summary.renewed +
      "&basarisiz=" +
      summary.paymentFailed +
      "&ertelenen=" +
      summary.delayedForStock,
  );
}

export interface ProductFormState {
  error: string | null;
  fields: Record<string, string>;
}

export async function saveProductAction(_previous: ProductFormState, formData: FormData): Promise<ProductFormState> {
  await requireAdminUser();
  const id = String(formData.get("id") ?? "");
  const text = (name: string) => String(formData.get(name) ?? "").trim();
  const interval = text("suggestedIntervalWeeks");

  const parsed = productInputSchema.safeParse({
    name: text("name"),
    brand: text("brand"),
    description: text("description"),
    species: text("species"),
    type: text("type"),
    packageSize: text("packageSize"),
    price: parsePrice(formData.get("price")) ?? Number.NaN,
    compareAtPrice: parsePrice(formData.get("compareAtPrice")),
    imageUrl: text("imageUrl") || null,
    stock: Number(text("stock") || "0"),
    subscribable: formData.get("subscribable") === "on",
    suggestedIntervalWeeks: interval ? Number(interval) : null,
    isFeatured: formData.get("isFeatured") === "on",
    isActive: formData.get("isActive") === "on",
  });

  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "_");
      if (!(key in fields)) fields[key] = issue.message;
    }
    return { error: "Lütfen işaretli alanları düzeltin.", fields };
  }

  try {
    if (id) await updateProduct(id, parsed.data);
    else await createProduct(parsed.data);
  } catch (error) {
    if (!(error instanceof HttpError)) throw error;
    return { error: error.message, fields: {} };
  }

  revalidatePath("/", "layout");
  redirect("/yonetim/urunler?kaydedildi=1");
}
