import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { AuthShell } from "@/components/auth-shell";
import { safeRedirectPath } from "@/lib/routes";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = { title: "Giriş yap" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const redirectTo = safeRedirectPath((await searchParams).sonra);
  if (await getCurrentUser()) redirect(redirectTo);

  return (
    <AuthShell title="Tekrar hoş geldiniz" subtitle="Aboneliklerinizi ve siparişlerinizi yönetmek için giriş yapın.">
      <AuthForm mode="login" redirectTo={redirectTo} />
    </AuthShell>
  );
}
