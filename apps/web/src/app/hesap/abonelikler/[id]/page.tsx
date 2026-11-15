import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/icons";
import { SubscriptionManager } from "@/components/subscription-manager";
import { requireCurrentUser } from "@/lib/session";
import { HttpError } from "@/server/errors";
import { listAddresses, listPaymentMethods } from "@/server/services/account";
import { getSubscription } from "@/server/services/subscriptions";

export const metadata: Metadata = { title: "Abonelik" };

export default async function SubscriptionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireCurrentUser("/hesap/abonelikler/" + id);

  const subscription = await getSubscription(user.id, id).catch((error) => {
    if (error instanceof HttpError && error.status === 404) notFound();
    throw error;
  });
  const [addresses, paymentMethods] = await Promise.all([listAddresses(user.id), listPaymentMethods(user.id)]);

  return (
    <div>
      <Link href="/hesap/abonelikler" className="flex items-center gap-1 text-sm font-semibold text-ink/55 hover:text-ink">
        <Icon name="chevron-right" className="h-4 w-4 rotate-180" />
        Aboneliklerim
      </Link>
      <h1 className="mt-3 mb-6 text-3xl font-semibold">Aboneliği yönet</h1>
      <SubscriptionManager initial={subscription} addresses={addresses} paymentMethods={paymentMethods} />
    </div>
  );
}
