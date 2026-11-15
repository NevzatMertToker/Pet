import {
  ORDER_STATUS_LABELS,
  SUBSCRIPTION_STATUS_LABELS,
  formatPrice,
  type Order,
  type OrderStatus,
  type SubscriptionStatus,
} from "@patipaket/shared";
import { Icon } from "./icons";

const ORDER_BADGES: Record<OrderStatus, string> = {
  pending: "badge-warn",
  paid: "badge-brand",
  preparing: "badge-brand",
  shipped: "badge-accent",
  delivered: "badge-muted",
  cancelled: "badge-muted",
  payment_failed: "badge-danger",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <span className={"badge " + ORDER_BADGES[status]}>{ORDER_STATUS_LABELS[status]}</span>;
}

const SUBSCRIPTION_BADGES: Record<SubscriptionStatus, string> = {
  active: "badge-brand",
  paused: "badge-warn",
  cancelled: "badge-muted",
};

export function SubscriptionStatusBadge({ status }: { status: SubscriptionStatus }) {
  return <span className={"badge " + SUBSCRIPTION_BADGES[status]}>{SUBSCRIPTION_STATUS_LABELS[status]}</span>;
}

/** Sipariş kalemleri, tutarlar, adres ve ödeme bilgisi. */
export function OrderDetails({ order }: { order: Order }) {
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
      <div className="card p-5 sm:p-6">
        <h2 className="text-lg font-semibold">Ürünler</h2>
        <ul className="mt-3 divide-y divide-ink/[0.07]">
          {order.items.map((item) => (
            <li key={item.id} className="flex items-start justify-between gap-4 py-3.5 text-sm">
              <div>
                <p className="font-semibold text-ink">{item.name}</p>
                <p className="mt-0.5 text-ink/55">
                  {item.packageSize} · {item.quantity} adet × {formatPrice(item.unitPrice)}
                </p>
                {item.isSubscription && (
                  <span className="badge badge-brand mt-1.5">
                    <Icon name="repeat" className="h-3.5 w-3.5" />
                    Abonelik
                  </span>
                )}
              </div>
              <p className="font-semibold">{formatPrice(item.lineTotal)}</p>
            </li>
          ))}
        </ul>
        <dl className="mt-2 space-y-2 border-t border-ink/10 pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-ink/60">Ara toplam</dt>
            <dd>{formatPrice(order.subtotal)}</dd>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-brand-700">
              <dt>Abonelik indirimi</dt>
              <dd className="font-semibold">−{formatPrice(order.discount)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-ink/60">Kargo</dt>
            <dd>{order.shipping === 0 ? "Ücretsiz" : formatPrice(order.shipping)}</dd>
          </div>
          <div className="flex items-baseline justify-between border-t border-ink/10 pt-3">
            <dt className="font-semibold">Toplam</dt>
            <dd className="text-xl font-bold">{formatPrice(order.total)}</dd>
          </div>
        </dl>
      </div>

      <div className="space-y-5">
        <div className="card p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-ink/60">
            <Icon name="pin" className="h-4 w-4" />
            Teslimat adresi
          </h2>
          <p className="mt-2 font-semibold">{order.address.fullName}</p>
          <p className="mt-0.5 text-sm leading-relaxed text-ink/65">
            {order.address.line}
            <br />
            {order.address.district} / {order.address.city}
            <br />
            {order.address.phone}
          </p>
        </div>
        <div className="card p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-ink/60">
            <Icon name="card" className="h-4 w-4" />
            Ödeme
          </h2>
          <p className="mt-2 font-semibold">{order.paymentSummary ?? "—"}</p>
          {order.trackingNumber && (
            <p className="mt-3 text-sm text-ink/65">
              Kargo takip no: <span className="font-semibold text-ink">{order.trackingNumber}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
