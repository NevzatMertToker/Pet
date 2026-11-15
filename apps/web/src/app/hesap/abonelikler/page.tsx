import type { Metadata } from "next";
import Link from "next/link";
import { SubscriptionCard } from "@/components/subscription-card";
import { EmptyState, PageHeader } from "@/components/ui";
import { requireCurrentUser } from "@/lib/session";
import { listSubscriptions } from "@/server/services/subscriptions";

export const metadata: Metadata = { title: "Aboneliklerim" };

export default async function SubscriptionsPage() {
  const user = await requireCurrentUser("/hesap/abonelikler");
  const subscriptions = await listSubscriptions(user.id);

  return (
    <div className="space-y-6">
      <PageHeader title="Aboneliklerim" description="Sıklığı değiştirin, teslimat atlayın, duraklatın ya da iptal edin." />
      {subscriptions.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {subscriptions.map((subscription) => (
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
              Ürünlere göz at
            </Link>
          }
        />
      )}
    </div>
  );
}
