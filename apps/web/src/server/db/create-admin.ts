import "./env";
import { eq } from "drizzle-orm";
import { hashPassword } from "../auth";
import { closeDb, getDb } from "./index";
import { users } from "./schema";

/**
 * Yönetici hesabı oluşturur veya var olan hesabı yöneticiye yükseltir.
 *
 *   ADMIN_PASSWORD='güçlü-bir-şifre' npm run create-admin -- yonetici@ornek.com "Ad Soyad"
 *
 * Şifre komut geçmişinde kalmasın diye ortam değişkeninden okunur.
 */
async function main() {
  const [emailArg, nameArg] = process.argv.slice(2);
  const email = emailArg?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !email.includes("@")) {
    throw new Error('Kullanım: ADMIN_PASSWORD=... npm run create-admin -- e-posta "Ad Soyad"');
  }

  const db = getDb();
  const [existing] = await db.select().from(users).where(eq(users.email, email));

  if (existing) {
    await db
      .update(users)
      .set({ role: "admin", ...(password ? { passwordHash: await hashPassword(password) } : {}) })
      .where(eq(users.id, existing.id));
    console.log(email + " yönetici yapıldı" + (password ? " ve şifresi güncellendi." : "."));
    return;
  }

  if (!password || password.length < 10) {
    throw new Error("Yeni hesap için ADMIN_PASSWORD en az 10 karakter olmalıdır.");
  }
  await db.insert(users).values({
    email,
    name: nameArg?.trim() || "Yönetici",
    role: "admin",
    passwordHash: await hashPassword(password),
  });
  console.log("Yönetici hesabı oluşturuldu: " + email);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => closeDb());
