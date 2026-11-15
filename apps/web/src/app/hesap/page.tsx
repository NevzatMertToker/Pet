import { formatDate, formatPrice } from "@patipaket/shared";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { OrderStatusBadge } from "@/components/order-summary";
import { SubscriptionCard } from "@/components/subscription-card";
import { EmptyState } from "@/components/ui";
import { requireCurrentUser } from "@/lib/session";
import { listOrders } from "@/server/services/orders";
import { listSubscriptions } from "@/server/services/subscriptions";

export default async function AccountPage() {
  const user = await requireCurrentUser("/hesap");
  const [subscriptions, orders] = await Promise.all([listSubscriptions(user.id), listOrders(user.id)]);
  const current = subscriptions.filter((subscription) => subscription.status !== "cancelled");

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-semibold">Merhaba, {user.name.split(" ")[0]}</h1>
        <p className="mt-1.5 text-ink/60">Aboneliklerinizi ve siparişlerinizi buradan takip edebilirsiniz.</p>
      </div>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Aboneliklerim</h2>
          {current.length > 0 && (
            <Link href="/hesap/abonelikler" className="link text-sm">
              Tümü
            </Link>
          )}
        </div>
        <div className="mt-4">
          {current.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {current.slice(0, 4).map((subscription) => (
                <SubscriptionCard key={subscription.id} subscription={subscription} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon="repeat"
              title="Henüz aboneliğiniz yok"
              text="Bir ürünü “Düzenli gönder” seçeneğiyle alın; her teslimatta %10 indirim ve ücretsiz kargo kazanın."
              action={
                <Link href="/urunler" className="btn btn-primary">
                  Abonelik oluştur
                </Link>
              }
            />
          )}
        </div>
      </section>

      {orders.length > 0 && (
        <section>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Son siparişler</h2>
            <Link href="/hesap/siparisler" className="link text-sm">
              Tümü
            </Link>
          </div>
          <ul className="card mt-4 divide-y divide-ink/[0.07]">
            {orders.slice(0, 3).map((order) => (
              <li key={order.id}>
                <Link
                  href={"/hesap/siparisler/" + order.id}
                  className="flex items-center justify-between gap-4 p-4 transition hover:bg-sand/40 sm:px-5"
                >
                  <div className="min-w-0">
                    <p className="font-semibold">
                      {order.orderNumber} <span className="font-normal text-ink/50">· {formatDate(order.createdAt)}</span>
                    </p>
                    <p className="mt-0.5 truncate text-sm text-ink/55">
                      {order.items.map((item) => item.name).join(", ")}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <OrderStatusBadge status={order.status} />
                    <span className="hidden font-semibold sm:inline">{formatPrice(order.total)}</span>
                    <Icon name="chevron-right" className="h-4 w-4 text-ink/35" />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
