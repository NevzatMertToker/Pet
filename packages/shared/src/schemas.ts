import { z } from "zod";
import {
  MAX_QUANTITY_PER_LINE,
  PRODUCT_TYPES,
  SPECIES,
  SUBSCRIPTION_INTERVALS,
} from "./constants";
import { isValidISODate } from "./dates";
import { isValidCardNumber } from "./pricing";

const email = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email("Geçerli bir e-posta adresi girin"));

const phone = z
  .string()
  .transform((value) => value.replace(/[\s()-]/g, ""))
  .pipe(z.string().regex(/^(\+90|0)?5\d{9}$/, "Telefon 05XX XXX XX XX biçiminde olmalı"));

const intervalWeeks = z
  .number()
  .int()
  .refine((n) => (SUBSCRIPTION_INTERVALS as readonly number[]).includes(n), "Geçersiz teslimat sıklığı");

const isoDate = z.string().refine(isValidISODate, "Geçersiz tarih");

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Adınızı ve soyadınızı girin").max(80),
  email,
  password: z.string().min(8, "Şifre en az 8 karakter olmalı").max(100),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Şifrenizi girin").max(100),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const profileSchema = z.object({
  name: z.string().trim().min(2, "Adınızı ve soyadınızı girin").max(80),
  phone: phone.nullable().optional(),
});
export type ProfileInput = z.infer<typeof profileSchema>;

export const addressSchema = z.object({
  title: z.string().trim().min(1, "Adres başlığı girin (örn. Ev)").max(40),
  fullName: z.string().trim().min(2, "Teslim alacak kişinin adını girin").max(80),
  phone,
  city: z.string().trim().min(2, "İl seçin").max(40),
  district: z.string().trim().min(2, "İlçe girin").max(60),
  line: z.string().trim().min(10, "Açık adresi girin (mahalle, sokak, no)").max(300),
  postalCode: z
    .string()
    .trim()
    .regex(/^\d{5}$/, "Posta kodu 5 haneli olmalı")
    .nullable()
    .optional(),
  isDefault: z.boolean().optional(),
});
export type AddressInput = z.infer<typeof addressSchema>;

export const cardSchema = z.object({
  cardHolder: z.string().trim().min(3, "Kart üzerindeki adı girin").max(80),
  cardNumber: z
    .string()
    .transform((value) => value.replace(/[\s-]/g, ""))
    .refine(isValidCardNumber, "Kart numarası geçersiz"),
  expMonth: z.number().int().min(1, "Ay geçersiz").max(12, "Ay geçersiz"),
  expYear: z
    .number()
    .int()
    .transform((year) => (year < 100 ? 2000 + year : year))
    .refine((year) => year >= 2024 && year <= 2100, "Yıl geçersiz"),
  cvc: z.string().regex(/^\d{3,4}$/, "Güvenlik kodu geçersiz"),
});
export type CardInput = z.input<typeof cardSchema>;

export const cartLineSchema = z.object({
  productId: z.uuid("Geçersiz ürün"),
  quantity: z.number().int().min(1).max(MAX_QUANTITY_PER_LINE),
  intervalWeeks: intervalWeeks.nullable(),
});

export const quoteSchema = z.object({
  lines: z.array(cartLineSchema).max(50),
});

export const checkoutSchema = z.object({
  lines: z.array(cartLineSchema).min(1, "Sepetiniz boş").max(50),
  addressId: z.uuid("Teslimat adresi seçin"),
  paymentMethodId: z.uuid("Ödeme yöntemi seçin"),
});
export type CheckoutInput = z.infer<typeof checkoutSchema>;

export const subscriptionUpdateSchema = z
  .object({
    intervalWeeks: intervalWeeks.optional(),
    nextDeliveryDate: isoDate.optional(),
    addressId: z.uuid().optional(),
    paymentMethodId: z.uuid().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, "Değiştirilecek bir alan gönderin");
export type SubscriptionUpdateInput = z.infer<typeof subscriptionUpdateSchema>;

export const subscriptionItemsSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.uuid(),
        quantity: z.number().int().min(1).max(MAX_QUANTITY_PER_LINE),
      }),
    )
    .min(1, "Abonelikte en az bir ürün olmalı")
    .max(50),
});
export type SubscriptionItemsInput = z.infer<typeof subscriptionItemsSchema>;

export const SUBSCRIPTION_ACTIONS = ["pause", "resume", "skip", "cancel", "ship-now"] as const;
export type SubscriptionAction = (typeof SUBSCRIPTION_ACTIONS)[number];

export const petSchema = z.object({
  name: z.string().trim().min(1, "Dostunuzun adını girin").max(40),
  species: z.enum(SPECIES),
  breed: z.string().trim().max(60).nullable().optional(),
  birthDate: isoDate.nullable().optional(),
  weightKg: z.number().min(0.01).max(120).nullable().optional(),
});
export type PetInput = z.infer<typeof petSchema>;

export const productListSchema = z.object({
  species: z.enum(SPECIES).optional(),
  type: z.enum(PRODUCT_TYPES).optional(),
  q: z.string().trim().max(80).optional(),
  sort: z.enum(["featured", "price_asc", "price_desc", "name"]).optional(),
  featured: z.boolean().optional(),
});
