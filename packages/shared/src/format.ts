const MONTHS_TR = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];

/** 124990 -> "1.249,90 ₺" */
export function formatPrice(kurus: number): string {
  const rounded = Math.round(kurus);
  const sign = rounded < 0 ? "-" : "";
  const abs = Math.abs(rounded);
  const lira = Math.floor(abs / 100);
  const kr = abs % 100;
  const liraText = String(lira).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${sign}${liraText},${String(kr).padStart(2, "0")} ₺`;
}

/** "2026-11-15" veya tam ISO tarih -> "15 Kasım 2026" */
export function formatDate(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!match) return iso;
  const [, year, month, day] = match;
  return `${Number(day)} ${MONTHS_TR[Number(month) - 1]} ${year}`;
}

export function intervalLabel(weeks: number): string {
  if (weeks === 4) return "4 haftada bir";
  if (weeks === 1) return "Her hafta";
  return `${weeks} haftada bir`;
}

export function intervalHint(weeks: number): string {
  if (weeks === 2) return "Ayda yaklaşık 2 teslimat";
  if (weeks === 4) return "Ayda bir teslimat";
  if (weeks === 6) return "6 haftada bir teslimat";
  if (weeks === 8) return "2 ayda bir teslimat";
  if (weeks === 12) return "3 ayda bir teslimat";
  return `${weeks} haftada bir teslimat`;
}

export function maskedCard(brand: string, last4: string): string {
  return `${brand} •••• ${last4}`;
}
