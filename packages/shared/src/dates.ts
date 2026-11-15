/** Tarihler saat dilimi karmaşası olmasın diye "YYYY-AA-GG" metni olarak taşınır. */

export function toISODate(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseISODate(iso: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) throw new Error(`Geçersiz tarih: ${iso}`);
  return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
}

export function isValidISODate(iso: string): boolean {
  try {
    return toISODate(parseISODate(iso)) === iso;
  } catch {
    return false;
  }
}

export function addDays(iso: string, days: number): string {
  const date = parseISODate(iso);
  date.setUTCDate(date.getUTCDate() + days);
  return toISODate(date);
}

export function addWeeks(iso: string, weeks: number): string {
  return addDays(iso, weeks * 7);
}

/** Türkiye yıl boyu UTC+3'tür; "bugün" Türkiye saatine göre hesaplanır. */
export function todayInTurkey(now: Date = new Date()): string {
  return toISODate(new Date(now.getTime() + 3 * 60 * 60 * 1000));
}

export function daysBetween(fromIso: string, toIso: string): number {
  return Math.round((parseISODate(toIso).getTime() - parseISODate(fromIso).getTime()) / 86_400_000);
}
