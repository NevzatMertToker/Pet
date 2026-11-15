/** Marka adı tek yerden değişir. */
export const APP_NAME = "PatiPaket";
export const APP_TAGLINE = "Mama, kum ve sarf malzemeleri kapınıza düzenli gelsin";

export const SPECIES = ["cat", "dog", "bird"] as const;
export type Species = (typeof SPECIES)[number];

export const PRODUCT_TYPES = ["food", "litter", "supplies"] as const;
export type ProductType = (typeof PRODUCT_TYPES)[number];

export const SPECIES_LABELS: Record<Species, string> = {
  cat: "Kedi",
  dog: "Köpek",
  bird: "Kuş",
};

export const SPECIES_EMOJI: Record<Species, string> = {
  cat: "🐱",
  dog: "🐶",
  bird: "🦜",
};

export const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  food: "Mama & Yem",
  litter: "Kum",
  supplies: "Sarf Malzemeleri",
};

export const PRODUCT_TYPE_EMOJI: Record<ProductType, string> = {
  food: "🥣",
  litter: "🪣",
  supplies: "🧻",
};

export interface Category {
  species: Species;
  type: ProductType;
  label: string;
}

/** Satışta olan kategori kombinasyonları (köpek kumu diye bir kategori yoktur). */
export const CATEGORIES: readonly Category[] = [
  { species: "cat", type: "food", label: "Kedi Maması" },
  { species: "cat", type: "litter", label: "Kedi Kumu" },
  { species: "cat", type: "supplies", label: "Kedi Sarf Malzemeleri" },
  { species: "dog", type: "food", label: "Köpek Maması" },
  { species: "dog", type: "supplies", label: "Köpek Sarf Malzemeleri" },
  { species: "bird", type: "food", label: "Kuş Yemi" },
  { species: "bird", type: "litter", label: "Kuş Kumu" },
  { species: "bird", type: "supplies", label: "Kuş Sarf Malzemeleri" },
];

export function categoryLabel(species: Species, type: ProductType): string {
  const found = CATEGORIES.find((c) => c.species === species && c.type === type);
  return found ? found.label : `${SPECIES_LABELS[species]} ${PRODUCT_TYPE_LABELS[type]}`;
}

/** Abonelik teslimat sıklıkları (hafta). */
export const SUBSCRIPTION_INTERVALS = [2, 4, 6, 8, 12] as const;
export type SubscriptionInterval = (typeof SUBSCRIPTION_INTERVALS)[number];
export const DEFAULT_SUBSCRIPTION_INTERVAL: SubscriptionInterval = 4;

/** Abonelik ürünlerine uygulanan indirim yüzdesi. */
export const SUBSCRIPTION_DISCOUNT_PERCENT = 10;

/** Tutarlar kuruş cinsindendir (1 TL = 100 kuruş). */
export const FREE_SHIPPING_THRESHOLD = 75000;
export const SHIPPING_FEE = 6990;

export const MAX_QUANTITY_PER_LINE = 20;

/** Bir abonelikte üst üste bu kadar ödeme başarısız olursa abonelik duraklatılır. */
export const MAX_FAILED_RENEWALS = 3;

export const ORDER_STATUSES = [
  "pending",
  "paid",
  "preparing",
  "shipped",
  "delivered",
  "cancelled",
  "payment_failed",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Ödeme bekleniyor",
  paid: "Sipariş alındı",
  preparing: "Hazırlanıyor",
  shipped: "Kargoya verildi",
  delivered: "Teslim edildi",
  cancelled: "İptal edildi",
  payment_failed: "Ödeme başarısız",
};

export const SUBSCRIPTION_STATUSES = ["active", "paused", "cancelled"] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

export const SUBSCRIPTION_STATUS_LABELS: Record<SubscriptionStatus, string> = {
  active: "Aktif",
  paused: "Duraklatıldı",
  cancelled: "İptal edildi",
};

export const TURKISH_CITIES = [
  "Adana", "Adıyaman", "Afyonkarahisar", "Ağrı", "Aksaray", "Amasya", "Ankara", "Antalya", "Ardahan", "Artvin",
  "Aydın", "Balıkesir", "Bartın", "Batman", "Bayburt", "Bilecik", "Bingöl", "Bitlis", "Bolu", "Burdur",
  "Bursa", "Çanakkale", "Çankırı", "Çorum", "Denizli", "Diyarbakır", "Düzce", "Edirne", "Elazığ", "Erzincan",
  "Erzurum", "Eskişehir", "Gaziantep", "Giresun", "Gümüşhane", "Hakkâri", "Hatay", "Iğdır", "Isparta", "İstanbul",
  "İzmir", "Kahramanmaraş", "Karabük", "Karaman", "Kars", "Kastamonu", "Kayseri", "Kilis", "Kırıkkale", "Kırklareli",
  "Kırşehir", "Kocaeli", "Konya", "Kütahya", "Malatya", "Manisa", "Mardin", "Mersin", "Muğla", "Muş",
  "Nevşehir", "Niğde", "Ordu", "Osmaniye", "Rize", "Sakarya", "Samsun", "Siirt", "Sinop", "Sivas",
  "Şanlıurfa", "Şırnak", "Tekirdağ", "Tokat", "Trabzon", "Tunceli", "Uşak", "Van", "Yalova", "Yozgat", "Zonguldak",
] as const;
