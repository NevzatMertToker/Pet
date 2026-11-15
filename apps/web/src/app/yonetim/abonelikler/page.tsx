import { formatDate, intervalLabel } from "@patipaket/shared";
import { SubscriptionStatusBadge } from "@/components/order-summary";
import { listAllSubscriptions } from "@/server/services/admin";

export default async function AdminSubscriptionsPage() {
  const subscriptions = await listAllSubscriptions();

  return (
    <div className="card overflow-x-auto">
      <table className="table-base min-w-[720px]">
        <thead>
          <tr>
            <th>Müşteri</th>
            <th>Durum</th>
            <th>Sıklık</th>
            <th>Sonraki teslimat</th>
            <th className="text-right">Ürün adedi</th>
            <th>Not</th>
          </tr>
        </thead>
        <tbody>
          {subscriptions.map((subscription) => (
            <tr key={subscription.id}>
              <td>
                <p className="font-semibold">{subscription.customerName}</p>
                <p className="text-ink/55">{subscription.customerEmail}</p>
              </td>
              <td>
                <SubscriptionStatusBadge status={subscription.status} />
              </td>
              <td className="whitespace-nowrap">{intervalLabel(subscription.intervalWeeks)}</td>
              <td className="whitespace-nowrap">
                {subscription.status === "active" ? formatDate(subscription.nextDeliveryDate) : "—"}
              </td>
              <td className="text-right">{subscription.itemCount}</td>
              <td className="max-w-64 text-[13px] text-amber-800">{subscription.lastRenewalError}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {subscriptions.length === 0 && <p className="p-8 text-center text-ink/55">Henüz abonelik yok.</p>}
    </div>
  );
}
