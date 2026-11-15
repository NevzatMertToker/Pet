/**
 * Müşteri bildirimleri için tek giriş noktası.
 *
 * Şu an olaylar yalnızca sunucu günlüğüne yazılır. E-posta / SMS / push göndermek
 * için bu fonksiyonun içine bir sağlayıcı (ör. Resend, Postmark, Netgsm, Expo Push)
 * bağlamak yeterlidir; çağıran kodun değişmesi gerekmez.
 */
export type NotificationEvent =
  | { type: "order_confirmed"; userId: string; orderNumber: string; total: number }
  | { type: "subscription_renewed"; userId: string; subscriptionId: string; orderNumber: string; total: number }
  | { type: "subscription_payment_failed"; userId: string; subscriptionId: string; message: string; paused: boolean }
  | { type: "subscription_delayed_no_stock"; userId: string; subscriptionId: string };

export function notify(event: NotificationEvent): void {
  if (process.env.NODE_ENV === "test") return;
  console.info("[bildirim]", JSON.stringify(event));
}
