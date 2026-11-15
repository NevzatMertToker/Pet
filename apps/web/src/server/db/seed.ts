import "./env";
import { eq } from "drizzle-orm";
import { hashPassword } from "../auth";
import { closeDb, getDb } from "./index";
import { products, users } from "./schema";
import { SEED_PRODUCTS } from "./seed-data";

/** Yalnızca yerel geliştirme için örnek hesaplar. Üretimde `npm run create-admin` kullanın. */
const DEMO_USERS = [
  { email: "admin@patipaket.local", name: "Mağaza Yöneticisi", password: "Admin1234!", role: "admin" as const },
  { email: "demo@patipaket.local", name: "Deniz Örnek", password: "Demo1234!", role: "customer" as const },
];

async function main() {
  const db = getDb();

  for (const product of SEED_PRODUCTS) {
    const values = {
      ...product,
      compareAtPrice: product.compareAtPrice ?? null,
      isFeatured: product.isFeatured ?? false,
    };
    // Var olan ürünün stoku ve fiyatı ezilmez; betik tekrar tekrar çalıştırılabilir.
    await db.insert(products).values(values).onConflictDoNothing({ target: products.slug });
  }
  console.log(SEED_PRODUCTS.length + " örnek ürün hazır.");

  if (process.env.NODE_ENV === "production") {
    console.log("Üretim ortamı: örnek kullanıcılar oluşturulmadı.");
    return;
  }

  for (const demo of DEMO_USERS) {
    const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, demo.email));
    if (existing) continue;
    await db.insert(users).values({
      email: demo.email,
      name: demo.name,
      role: demo.role,
      passwordHash: await hashPassword(demo.password),
    });
  }
  console.log("Örnek hesaplar (yalnızca geliştirme):");
  for (const demo of DEMO_USERS) console.log("  " + demo.role.padEnd(8) + " " + demo.email + " / " + demo.password);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => closeDb());
