import type { Metadata } from "next";
import { ProfileForm } from "@/components/account-managers";
import { PageHeader } from "@/components/ui";
import { requireCurrentUser } from "@/lib/session";

export const metadata: Metadata = { title: "Profilim" };

export default async function ProfilePage() {
  const user = await requireCurrentUser("/hesap/profil");
  return (
    <div className="space-y-6">
      <PageHeader title="Profilim" description="İletişim bilgileriniz." />
      <ProfileForm user={user} />
    </div>
  );
}
