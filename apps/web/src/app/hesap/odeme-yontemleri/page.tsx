import type { Metadata } from "next";
import { PaymentMethodManager } from "@/components/account-managers";
import { PageHeader } from "@/components/ui";
import { requireCurrentUser } from "@/lib/session";
import { getPaymentProvider } from "@/server/payment";
import { listPaymentMethods } from "@/server/services/account";

export const metadata: Metadata = { title: "Ödeme yöntemlerim" };

export default async function PaymentMethodsPage() {
  const user = await requireCurrentUser("/hesap/odeme-yontemleri");
  return (
    <div className="space-y-6">
      <PageHeader title="Ödeme yöntemlerim" description="Abonelik teslimatlarınız kayıtlı kartınızdan tahsil edilir." />
      <PaymentMethodManager initial={await listPaymentMethods(user.id)} testMode={getPaymentProvider().isTestMode} />
    </div>
  );
}
