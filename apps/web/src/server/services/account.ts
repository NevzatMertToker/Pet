import type {
  Address,
  AddressInput,
  AuthResult,
  LoginInput,
  PaymentMethod,
  Pet,
  PetInput,
  ProfileInput,
  RegisterInput,
  User,
} from "@patipaket/shared";
import { and, asc, desc, eq, inArray, isNull, ne } from "drizzle-orm";
import { createSessionToken, hashPassword, verifyPassword } from "../auth";
import { getDb, type DbExecutor } from "../db";
import { addresses, paymentMethods, pets, subscriptions, users } from "../db/schema";
import { HttpError, conflict, invalid, notFound } from "../errors";
import {
  isUuid,
  toAddress,
  toPaymentMethod,
  toPet,
  toUser,
  type AddressRow,
  type PaymentMethodRow,
  type UserRow,
} from "../mappers";
import { getPaymentProvider, type CardDetails } from "../payment";

/* ------------------------------------------------------------------ hesap */

function isUniqueViolation(error: unknown): boolean {
  const code = (error as { code?: string; cause?: { code?: string } } | null)?.code;
  const causeCode = (error as { cause?: { code?: string } } | null)?.cause?.code;
  return code === "23505" || causeCode === "23505";
}

export async function registerUser(input: RegisterInput): Promise<AuthResult> {
  const db = getDb();
  const emailTaken = () =>
    new HttpError(409, "email_taken", "Bu e-posta adresiyle kayıtlı bir hesap var. Giriş yapmayı deneyin.", {
      email: "Bu e-posta zaten kayıtlı",
    });

  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, input.email));
  if (existing) throw emailTaken();

  const passwordHash = await hashPassword(input.password);
  try {
    const [row] = await db
      .insert(users)
      .values({ email: input.email, name: input.name, passwordHash })
      .returning();
    return { token: await createSessionToken(row.id), user: toUser(row) };
  } catch (error) {
    if (isUniqueViolation(error)) throw emailTaken();
    throw error;
  }
}

// Kayıtlı olmayan e-postalarda da aynı süre harcansın diye kullanılan sahte özet.
const DUMMY_HASH = "scrypt$AAAAAAAAAAAAAAAAAAAAAA==$" + Buffer.alloc(64).toString("base64");

export async function loginUser(input: LoginInput): Promise<AuthResult> {
  const [row] = await getDb().select().from(users).where(eq(users.email, input.email));
  const valid = await verifyPassword(input.password, row?.passwordHash ?? DUMMY_HASH);
  if (!row || !valid) {
    throw new HttpError(401, "invalid_credentials", "E-posta veya şifre hatalı.");
  }
  return { token: await createSessionToken(row.id), user: toUser(row) };
}

export async function getUserById(id: string): Promise<UserRow | null> {
  if (!isUuid(id)) return null;
  const [row] = await getDb().select().from(users).where(eq(users.id, id));
  return row ?? null;
}

export async function updateProfile(userId: string, input: ProfileInput): Promise<User> {
  const [row] = await getDb()
    .update(users)
    .set({ name: input.name, phone: input.phone ?? null })
    .where(eq(users.id, userId))
    .returning();
  return toUser(row);
}

/* --------------------------------------------------------------- adresler */

export async function listAddresses(userId: string): Promise<Address[]> {
  const rows = await getDb()
    .select()
    .from(addresses)
    .where(and(eq(addresses.userId, userId), isNull(addresses.deletedAt)))
    .orderBy(desc(addresses.isDefault), asc(addresses.createdAt));
  return rows.map(toAddress);
}

export async function getOwnedAddress(executor: DbExecutor, userId: string, id: string): Promise<AddressRow> {
  if (isUuid(id)) {
    const [row] = await executor
      .select()
      .from(addresses)
      .where(and(eq(addresses.id, id), eq(addresses.userId, userId), isNull(addresses.deletedAt)));
    if (row) return row;
  }
  throw invalid("Teslimat adresi bulunamadı. Lütfen bir adres seçin.", { addressId: "Adres bulunamadı" });
}

export async function createAddress(userId: string, input: AddressInput): Promise<Address> {
  return getDb().transaction(async (tx) => {
    const existing = await tx
      .select({ id: addresses.id })
      .from(addresses)
      .where(and(eq(addresses.userId, userId), isNull(addresses.deletedAt)));
    const isDefault = input.isDefault === true || existing.length === 0;
    if (isDefault) {
      await tx.update(addresses).set({ isDefault: false }).where(eq(addresses.userId, userId));
    }
    const [row] = await tx
      .insert(addresses)
      .values({ ...input, postalCode: input.postalCode ?? null, isDefault, userId })
      .returning();
    return toAddress(row);
  });
}

export async function updateAddress(userId: string, id: string, input: AddressInput): Promise<Address> {
  return getDb().transaction(async (tx) => {
    const current = await getOwnedAddress(tx, userId, id).catch(() => null);
    if (!current) throw notFound("Adres bulunamadı.");
    const isDefault = input.isDefault ?? current.isDefault;
    if (isDefault && !current.isDefault) {
      await tx.update(addresses).set({ isDefault: false }).where(eq(addresses.userId, userId));
    }
    const [row] = await tx
      .update(addresses)
      .set({ ...input, postalCode: input.postalCode ?? null, isDefault })
      .where(eq(addresses.id, id))
      .returning();
    return toAddress(row);
  });
}

export async function deleteAddress(userId: string, id: string): Promise<void> {
  await getDb().transaction(async (tx) => {
    const current = await getOwnedAddress(tx, userId, id).catch(() => null);
    if (!current) throw notFound("Adres bulunamadı.");

    const inUse = await tx
      .select({ id: subscriptions.id })
      .from(subscriptions)
      .where(and(eq(subscriptions.addressId, id), inArray(subscriptions.status, ["active", "paused"])));
    if (inUse.length > 0) {
      throw conflict(
        "Bu adres bir aboneliğinizde kullanılıyor. Önce abonelikteki teslimat adresini değiştirin.",
        "address_in_use",
      );
    }

    await tx.update(addresses).set({ deletedAt: new Date(), isDefault: false }).where(eq(addresses.id, id));
    if (current.isDefault) {
      const [next] = await tx
        .select({ id: addresses.id })
        .from(addresses)
        .where(and(eq(addresses.userId, userId), isNull(addresses.deletedAt), ne(addresses.id, id)))
        .orderBy(desc(addresses.createdAt))
        .limit(1);
      if (next) await tx.update(addresses).set({ isDefault: true }).where(eq(addresses.id, next.id));
    }
  });
}

/* ------------------------------------------------------- ödeme yöntemleri */

export async function listPaymentMethods(userId: string): Promise<PaymentMethod[]> {
  const rows = await getDb()
    .select()
    .from(paymentMethods)
    .where(and(eq(paymentMethods.userId, userId), isNull(paymentMethods.deletedAt)))
    .orderBy(desc(paymentMethods.isDefault), asc(paymentMethods.createdAt));
  return rows.map(toPaymentMethod);
}

export async function getOwnedPaymentMethod(
  executor: DbExecutor,
  userId: string,
  id: string,
): Promise<PaymentMethodRow> {
  if (isUuid(id)) {
    const [row] = await executor
      .select()
      .from(paymentMethods)
      .where(
        and(eq(paymentMethods.id, id), eq(paymentMethods.userId, userId), isNull(paymentMethods.deletedAt)),
      );
    if (row) return row;
  }
  throw invalid("Ödeme yöntemi bulunamadı. Lütfen bir kart seçin.", { paymentMethodId: "Kart bulunamadı" });
}

export async function createPaymentMethod(userId: string, card: CardDetails): Promise<PaymentMethod> {
  const provider = getPaymentProvider();
  // Kart yalnızca sağlayıcıya iletilir; veritabanına jeton ve son 4 hane yazılır.
  const saved = await provider.saveCard(card);
  return getDb().transaction(async (tx) => {
    await tx.update(paymentMethods).set({ isDefault: false }).where(eq(paymentMethods.userId, userId));
    const [row] = await tx
      .insert(paymentMethods)
      .values({
        userId,
        provider: provider.name,
        providerToken: saved.token,
        brand: saved.brand,
        last4: saved.last4,
        expMonth: saved.expMonth,
        expYear: saved.expYear,
        cardHolder: card.cardHolder,
        isDefault: true,
      })
      .returning();
    return toPaymentMethod(row);
  });
}

export async function deletePaymentMethod(userId: string, id: string): Promise<void> {
  await getDb().transaction(async (tx) => {
    const current = await getOwnedPaymentMethod(tx, userId, id).catch(() => null);
    if (!current) throw notFound("Kart bulunamadı.");

    const inUse = await tx
      .select({ id: subscriptions.id })
      .from(subscriptions)
      .where(and(eq(subscriptions.paymentMethodId, id), inArray(subscriptions.status, ["active", "paused"])));
    if (inUse.length > 0) {
      throw conflict(
        "Bu kart bir aboneliğinizde kullanılıyor. Önce abonelikteki ödeme yöntemini değiştirin.",
        "payment_method_in_use",
      );
    }

    await tx
      .update(paymentMethods)
      .set({ deletedAt: new Date(), isDefault: false })
      .where(eq(paymentMethods.id, id));
    if (current.isDefault) {
      const [next] = await tx
        .select({ id: paymentMethods.id })
        .from(paymentMethods)
        .where(
          and(eq(paymentMethods.userId, userId), isNull(paymentMethods.deletedAt), ne(paymentMethods.id, id)),
        )
        .orderBy(desc(paymentMethods.createdAt))
        .limit(1);
      if (next) await tx.update(paymentMethods).set({ isDefault: true }).where(eq(paymentMethods.id, next.id));
    }
  });
}

/* ---------------------------------------------------------- evcil dostlar */

export async function listPets(userId: string): Promise<Pet[]> {
  const rows = await getDb().select().from(pets).where(eq(pets.userId, userId)).orderBy(asc(pets.createdAt));
  return rows.map(toPet);
}

export async function createPet(userId: string, input: PetInput): Promise<Pet> {
  const [row] = await getDb()
    .insert(pets)
    .values({
      userId,
      name: input.name,
      species: input.species,
      breed: input.breed || null,
      birthDate: input.birthDate ?? null,
      weightKg: input.weightKg ?? null,
    })
    .returning();
  return toPet(row);
}

export async function deletePet(userId: string, id: string): Promise<void> {
  if (!isUuid(id)) throw notFound();
  const deleted = await getDb()
    .delete(pets)
    .where(and(eq(pets.id, id), eq(pets.userId, userId)))
    .returning({ id: pets.id });
  if (deleted.length === 0) throw notFound();
}
