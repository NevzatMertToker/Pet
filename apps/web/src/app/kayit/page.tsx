import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { AuthShell } from "@/components/auth-shell";
import { safeRedirectPath } from "@/lib/routes";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = { title: "Hesap oluştur" };

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const redirectTo = safeRedirectPath((await searchParams).sonra);
  if (await getCurrentUser()) redirect(redirectTo);

  return (
    <AuthShell title="Hesabınızı oluşturun" subtitle="Bir dakikada üye olun, ilk aboneliğinizi hemen başlatın.">
      <AuthForm mode="register" redirectTo={redirectTo} />
    </AuthShell>
  );
}
