import { formatDate, formatPrice, intervalLabel } from "@patipaket/shared";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/icons";
import { OrderDetails } from "@/components/order-summary";
import { requireCurrentUser } from "@/lib/session";
import { HttpError } from "@/server/errors";
import { getOrder } from "@/server/services/orders";
import { listSubscriptions } from "@/server/services/subscriptions";

export const metadata: Metadata = { title: "Siparişiniz alındı" };

export default async function OrderCompletePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireCurrentUser("/hesap/siparisler/" + id);

  const order = await getOrder(user.id, id).catch((error) => {
    if (error instanceof HttpError && error.status === 404) notFound();
    throw error;
  });
  // Bu siparişle birlikte (aynı anda) oluşturulan abonelikler gösterilir.
  const orderedAt = new Date(order.createdAt).getTime();
  const subscriptions = order.items.some((item) => item.isSubscription)
    ? (await listSubscriptions(user.id)).filter(
        (subscription) => Math.abs(new Date(subscription.createdAt).getTime() - orderedAt) < 5 * 60_000,
      )
    : [];

  return (
    <div className="container-page py-12">
      <div className="mx-auto max-w-2xl text-center">
        <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-brand-600 text-white shadow-lift">
          <Icon name="check" className="h-10 w-10" />
        </span>
        <h1 className="mt-6 text-4xl font-semibold">Teşekkürler, siparişiniz alındı!</h1>
        <p className="mt-3 text-lg text-ink/65">
          Sipariş numaranız <strong className="text-ink">{order.orderNumber}</strong>. Toplam{" "}
          <strong className="text-ink">{formatPrice(order.total)}</strong> kartınızdan tahsil edildi.
        </p>
      </div>

      {subscriptions.length > 0 && (
        <div className="mx-auto mt-10 max-w-4xl rounded-3xl bg-brand-800 p-6 text-white sm:p-8">
          <h2 className="text-2xl font-semibold">Aboneliğiniz başladı</h2>
          <p className="mt-1.5 text-white/70">Sonraki teslimatlarınız otomatik oluşturulacak. Tarihleri dilediğiniz an değiştirebilirsiniz.</p>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {subscriptions.map((subscription) => (
              <li key={subscription.id} className="rounded-2xl bg-white/10 p-4">
                <p className="flex items-center gap-2 font-semibold">
                  <Icon name="repeat" className="h-4 w-4 text-accent-300" />
                  {intervalLabel(subscription.intervalWeeks)}
                </p>
                <p className="mt-1 text-sm text-white/75">
                  {subscription.items.map((item) => item.name).join(", ")}
                </p>
                <p className="mt-2 text-sm">
                  Sonraki teslimat: <strong>{formatDate(subscription.nextDeliveryDate)}</strong>
                </p>
              </li>
            ))}
          </ul>
          <Link href="/hesap/abonelikler" className="btn btn-accent mt-6">
            Aboneliklerimi yönet
            <Icon name="arrow-right" className="h-4 w-4" />
          </Link>
        </div>
      )}

      <div className="mx-auto mt-8 max-w-4xl">
        <OrderDetails order={order} />
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/hesap/siparisler" className="btn btn-outline">
            Siparişlerim
          </Link>
          <Link href="/urunler" className="btn btn-primary">
            Alışverişe devam et
          </Link>
        </div>
      </div>
    </div>
  );
}
