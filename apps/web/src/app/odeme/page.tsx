import type { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout-form";
import { requireCurrentUser } from "@/lib/session";
import { getPaymentProvider } from "@/server/payment";
import { listAddresses, listPaymentMethods } from "@/server/services/account";

export const metadata: Metadata = { title: "Ödeme" };

export default async function CheckoutPage() {
  const user = await requireCurrentUser("/odeme");
  const [addresses, paymentMethods] = await Promise.all([listAddresses(user.id), listPaymentMethods(user.id)]);

  return (
    <div className="container-page py-10">
      <h1 className="text-4xl font-semibold">Ödeme</h1>
      <div className="mt-8">
        <CheckoutForm
          initialAddresses={addresses}
          initialPaymentMethods={paymentMethods}
          testMode={getPaymentProvider().isTestMode}
        />
      </div>
    </div>
  );
}
