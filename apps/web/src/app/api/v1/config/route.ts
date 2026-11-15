import { route } from "@/server/http";
import { getPaymentProvider } from "@/server/payment";

/** İstemcilerin (web/mobil) ihtiyaç duyduğu herkese açık ayarlar. */
export const GET = route(async () => {
  return { paymentTestMode: getPaymentProvider().isTestMode };
});
