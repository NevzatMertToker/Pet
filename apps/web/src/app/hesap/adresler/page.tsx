import type { Metadata } from "next";
import { AddressManager } from "@/components/account-managers";
import { PageHeader } from "@/components/ui";
import { requireCurrentUser } from "@/lib/session";
import { listAddresses } from "@/server/services/account";

export const metadata: Metadata = { title: "Adreslerim" };

export default async function AddressesPage() {
  const user = await requireCurrentUser("/hesap/adresler");
  return (
    <div className="space-y-6">
      <PageHeader title="Adreslerim" description="Sipariş ve abonelik teslimatlarınızın gönderileceği adresler." />
      <AddressManager initial={await listAddresses(user.id)} />
    </div>
  );
}
