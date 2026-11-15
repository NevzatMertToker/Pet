import { formatDate } from "@patipaket/shared";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/icons";
import { OrderDetails, OrderStatusBadge } from "@/components/order-summary";
import { requireCurrentUser } from "@/lib/session";
import { HttpError } from "@/server/errors";
import { getOrder } from "@/server/services/orders";

export const metadata: Metadata = { title: "Sipariş detayı" };

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireCurrentUser("/hesap/siparisler/" + id);
  const order = await getOrder(user.id, id).catch((error) => {
    if (error instanceof HttpError && error.status === 404) notFound();
    throw error;
  });

  return (
    <div>
      <Link href="/hesap/siparisler" className="flex items-center gap-1 text-sm font-semibold text-ink/55 hover:text-ink">
        <Icon name="chevron-right" className="h-4 w-4 rotate-180" />
        Siparişlerim
      </Link>
      <div className="mt-3 mb-6 flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-semibold">Sipariş {order.orderNumber}</h1>
        <OrderStatusBadge status={order.status} />
      </div>
      <p className="-mt-3 mb-6 text-ink/60">
        {formatDate(order.createdAt)}
        {order.subscriptionId && (
          <>
            {" · "}
            <Link href={"/hesap/abonelikler/" + order.subscriptionId} className="link">
              Abonelik teslimatı
            </Link>
          </>
        )}
      </p>
      <OrderDetails order={order} />
    </div>
  );
}
