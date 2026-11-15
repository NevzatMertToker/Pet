import type { Metadata } from "next";
import { PetManager } from "@/components/account-managers";
import { PageHeader } from "@/components/ui";
import { requireCurrentUser } from "@/lib/session";
import { listPets } from "@/server/services/account";

export const metadata: Metadata = { title: "Dostlarım" };

export default async function PetsPage() {
  const user = await requireCurrentUser("/hesap/dostlarim");
  return (
    <div className="space-y-6">
      <PageHeader title="Dostlarım" description="Evinizin tüylü ve kanatlı üyeleri." />
      <PetManager initial={await listPets(user.id)} />
    </div>
  );
}
