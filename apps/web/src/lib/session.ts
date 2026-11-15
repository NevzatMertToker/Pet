import type { User } from "@patipaket/shared";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { SESSION_COOKIE, readSessionToken } from "@/server/auth";
import { toUser } from "@/server/mappers";
import { getUserById } from "@/server/services/account";

/** Sunucu bileşenleri için: oturum çerezindeki kullanıcı (istek başına bir kez sorgulanır). */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const userId = await readSessionToken(token);
  if (!userId) return null;
  const row = await getUserById(userId);
  return row ? toUser(row) : null;
});

/** Giriş yapılmamışsa giriş sayfasına, sonrasında geri dönmek üzere yönlendirir. */
export async function requireCurrentUser(returnTo: string): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/giris?sonra=" + encodeURIComponent(returnTo));
  return user;
}

export async function requireAdminUser(): Promise<User> {
  const user = await requireCurrentUser("/yonetim");
  if (user.role !== "admin") redirect("/");
  return user;
}
