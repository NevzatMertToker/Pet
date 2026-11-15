import { formatDate, formatPrice, intervalLabel, type Subscription } from "@patipaket/shared";
import Link from "next/link";
import { Icon } from "./icons";
import { SubscriptionStatusBadge } from "./order-summary";
import { ProductArt } from "./product-art";

export function SubscriptionCard({ subscription }: { subscription: Subscription }) {
  const active = subscription.status === "active";
  return (
    <Link
      href={"/hesap/abonelikler/" + subscription.id}
      className="card group block p-5 transition hover:-translate-y-0.5 hover:shadow-lift"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <SubscriptionStatusBadge status={subscription.status} />
          <p className="mt-2.5 font-display text-xl font-semibold">{intervalLabel(subscription.intervalWeeks)}</p>
        </div>
        <div className="flex -space-x-3">
          {subscription.items.slice(0, 3).map((item) => (
            <span key={item.id} className="h-12 w-12 overflow-hidden rounded-xl ring-2 ring-white">
              <ProductArt product={item} />
            </span>
          ))}
          {subscription.items.length > 3 && (
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-sand text-sm font-bold text-ink/60 ring-2 ring-white">
              +{subscription.items.length - 3}
            </span>
          )}
        </div>
      </div>

      <p className="mt-3 line-clamp-2 text-sm text-ink/60">
        {subscription.items.map((item) => item.name + " ×" + item.quantity).join(" · ")}
      </p>

      {subscription.lastRenewalError && subscription.status !== "cancelled" && (
        <p className="mt-3 flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2 text-[13px] font-medium text-amber-900">
          <Icon name="alert" className="mt-0.5 h-4 w-4" />
          {subscription.lastRenewalError}
        </p>
      )}

      <div className="mt-4 flex items-end justify-between border-t border-ink/[0.07] pt-4">
        <div>
          <p className="text-xs font-medium text-ink/50">{active ? "Sonraki teslimat" : "Durum"}</p>
          <p className="font-semibold">
            {active
              ? formatDate(subscription.nextDeliveryDate)
              : subscription.status === "paused"
                ? "Teslimatlar durduruldu"
                : "Abonelik sonlandı"}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs font-medium text-ink/50">Teslimat başına</p>
          <p className="font-semibold">{formatPrice(subscription.estimatedTotal)}</p>
        </div>
      </div>
      <span className="mt-4 flex items-center gap-1.5 text-sm font-semibold text-brand-700">
        Yönet
        <Icon name="arrow-right" className="h-4 w-4 transition group-hover:translate-x-1" />
      </span>
    </Link>
  );
}
