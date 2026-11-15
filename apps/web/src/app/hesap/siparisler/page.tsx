import { formatDate, formatPrice } from "@patipaket/shared";
import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { OrderStatusBadge } from "@/components/order-summary";
import { EmptyState, PageHeader } from "@/components/ui";
import { requireCurrentUser } from "@/lib/session";
import { listOrders } from "@/server/services/orders";

export const metadata: Metadata = { title: "Siparişlerim" };

export default async function OrdersPage() {
  const user = await requireCurrentUser("/hesap/siparisler");
  const orders = await listOrders(user.id);

  return (
    <div className="space-y-6">
      <PageHeader title="Siparişlerim" description="Tek seferlik siparişleriniz ve abonelik teslimatlarınız." />
      {orders.length > 0 ? (
        <ul className="space-y-3">
          {orders.map((order) => (
            <li key={order.id}>
              <Link
                href={"/hesap/siparisler/" + order.id}
                className="card flex flex-wrap items-center justify-between gap-4 p-5 transition hover:-translate-y-0.5 hover:shadow-lift"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <p className="font-display text-lg font-semibold">{order.orderNumber}</p>
                    <OrderStatusBadge status={order.status} />
                    {order.subscriptionId && (
                      <span className="badge badge-muted">
                        <Icon name="repeat" className="h-3.5 w-3.5" />
                        Abonelik teslimatı
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-ink/55">{formatDate(order.createdAt)}</p>
                  <p className="mt-1.5 line-clamp-1 text-sm text-ink/70">
                    {order.items.map((item) => item.name + " ×" + item.quantity).join(" · ")}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-lg font-bold">{formatPrice(order.total)}</p>
                  <Icon name="chevron-right" className="h-5 w-5 text-ink/35" />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          icon="package"
          title="Henüz siparişiniz yok"
          text="İlk siparişinizi verdiğinizde burada görünecek."
          action={
            <Link href="/urunler" className="btn btn-primary">
              Alışverişe başla
            </Link>
          }
        />
      )}
    </div>
  );
}
