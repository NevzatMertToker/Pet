import {
  ORDER_STATUSES,
  ORDER_STATUS_LABELS,
  formatDate,
  formatPrice,
  type OrderStatus,
} from "@patipaket/shared";
import Link from "next/link";
import { OrderStatusBadge } from "@/components/order-summary";
import { Notice } from "@/components/ui";
import { listAllOrders } from "@/server/services/admin";
import { updateOrderAction } from "../actions";

/** Yönetici bir siparişi bu durumlara elle çekebilir. */
const EDITABLE: OrderStatus[] = ["paid", "preparing", "shipped", "delivered", "cancelled"];

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const filter = ORDER_STATUSES.find((status) => status === query.durum);
  const orders = await listAllOrders(filter);

  return (
    <div className="space-y-5">
      {typeof query.hata === "string" && <Notice tone="error">{query.hata}</Notice>}

      <div className="flex gap-1.5 overflow-x-auto text-sm [&::-webkit-scrollbar]:hidden">
        <Link
          href="/yonetim/siparisler"
          className={"shrink-0 rounded-full px-3.5 py-1.5 font-semibold " + (!filter ? "bg-brand-600 text-white" : "bg-white text-ink/65")}
        >
          Tümü
        </Link>
        {ORDER_STATUSES.map((status) => (
          <Link
            key={status}
            href={"/yonetim/siparisler?durum=" + status}
            className={
              "shrink-0 rounded-full px-3.5 py-1.5 font-semibold " +
              (filter === status ? "bg-brand-600 text-white" : "bg-white text-ink/65")
            }
          >
            {ORDER_STATUS_LABELS[status]}
          </Link>
        ))}
      </div>

      <div className="card overflow-x-auto">
        <table className="table-base min-w-[860px]">
          <thead>
            <tr>
              <th>Sipariş</th>
              <th>Müşteri ve adres</th>
              <th>Ürünler</th>
              <th className="text-right">Tutar</th>
              <th>Durum</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => {
              const locked = order.status === "cancelled" || order.status === "payment_failed" || order.status === "pending";
              return (
                <tr key={order.id}>
                  <td className="whitespace-nowrap">
                    <p className="font-semibold">{order.orderNumber}</p>
                    <p className="text-ink/55">{formatDate(order.createdAt)}</p>
                    {order.subscriptionId && <span className="badge badge-muted mt-1">Abonelik</span>}
                  </td>
                  <td className="max-w-56">
                    <p className="font-semibold">{order.customerName}</p>
                    <p className="truncate text-ink/55">{order.customerEmail}</p>
                    <p className="mt-1 text-[13px] leading-snug text-ink/60">
                      {order.address.line}, {order.address.district} / {order.address.city} · {order.address.phone}
                    </p>
                  </td>
                  <td className="max-w-64 text-[13px] leading-relaxed">
                    {order.items.map((item) => (
                      <p key={item.id}>
                        {item.quantity} × {item.name} <span className="text-ink/50">({item.packageSize})</span>
                      </p>
                    ))}
                  </td>
                  <td className="text-right font-semibold whitespace-nowrap">{formatPrice(order.total)}</td>
                  <td>
                    {locked ? (
                      <OrderStatusBadge status={order.status} />
                    ) : (
                      <form action={updateOrderAction} className="flex min-w-52 flex-col gap-2">
                        <input type="hidden" name="id" value={order.id} />
                        <select name="status" defaultValue={order.status} className="input py-2" aria-label="Durum">
                          {EDITABLE.map((status) => (
                            <option key={status} value={status}>
                              {ORDER_STATUS_LABELS[status]}
                            </option>
                          ))}
                        </select>
                        <input
                          name="trackingNumber"
                          defaultValue={order.trackingNumber ?? ""}
                          placeholder="Kargo takip no"
                          aria-label="Kargo takip numarası"
                          className="input py-2"
                        />
                        <button type="submit" className="btn btn-sm btn-outline self-start">
                          Güncelle
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {orders.length === 0 && <p className="p-8 text-center text-ink/55">Bu filtrede sipariş yok.</p>}
      </div>
    </div>
  );
}
