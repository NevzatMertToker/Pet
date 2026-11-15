import { timingSafeEqual } from "node:crypto";
import { unauthorized } from "@/server/errors";
import { route } from "@/server/http";
import { releaseStalePendingOrders } from "@/server/services/orders";
import { processDueSubscriptions } from "@/server/services/subscriptions";

export const maxDuration = 300;

function authorize(request: Request): void {
  const secret = process.env.CRON_SECRET;
  const header = request.headers.get("authorization") ?? "";
  const given = Buffer.from(header.startsWith("Bearer ") ? header.slice(7) : "");
  const expected = Buffer.from(secret ?? "");
  if (!secret || given.length !== expected.length || !timingSafeEqual(given, expected)) {
    throw unauthorized("Geçersiz zamanlanmış görev anahtarı.");
  }
}

/**
 * Günlük abonelik yenileme görevi. Teslimat günü gelen abonelikler için
 * karttan tahsilat yapıp sipariş oluşturur.
 *
 * Bir zamanlayıcı (Vercel Cron, GitHub Actions, sunucu crontab'ı...) günde en az
 * bir kez şu isteği atmalıdır:
 *
 *   curl -X POST https://SITENIZ/api/v1/cron/renew-subscriptions \
 *        -H "Authorization: Bearer $CRON_SECRET"
 *
 * Aynı gün birden çok kez çağrılması güvenlidir; mükerrer tahsilat yapılmaz.
 */
const handler = route(async (request) => {
  authorize(request);
  const releasedPendingOrders = await releaseStalePendingOrders();
  const summary = await processDueSubscriptions();
  return { ...summary, releasedPendingOrders };
});

// Vercel Cron GET ile çağırır; diğer zamanlayıcılar POST kullanabilir.
export const GET = handler;
export const POST = handler;
