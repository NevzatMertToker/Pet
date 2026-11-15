import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";

/** Oturum süresi: 30 gün. */
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
export const SESSION_COOKIE = "pp_session";

const DEV_SECRET = "patipaket-gelistirme-anahtari-uretimde-kullanmayin";
let warnedAboutSecret = false;

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (secret && secret.length >= 32) return new TextEncoder().encode(secret);
  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET üretimde zorunludur ve en az 32 karakter olmalıdır.");
  }
  if (!warnedAboutSecret) {
    warnedAboutSecret = true;
    console.warn("[auth] AUTH_SECRET tanımlı değil; geliştirme anahtarı kullanılıyor.");
  }
  return new TextEncoder().encode(DEV_SECRET);
}

function scryptAsync(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password.normalize("NFKC"), salt, 64, (error, key) => (error ? reject(error) : resolve(key)));
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scryptAsync(password, salt);
  return ["scrypt", salt.toString("base64"), key.toString("base64")].join("$");
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, saltText, keyText] = stored.split("$");
  if (scheme !== "scrypt" || !saltText || !keyText) return false;
  const expected = Buffer.from(keyText, "base64");
  const actual = await scryptAsync(password, Buffer.from(saltText, "base64"));
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export async function createSessionToken(userId: string): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS)
    .sign(getSecret());
}

/** Geçerliyse kullanıcı kimliğini, değilse null döner. */
export async function readSessionToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), { algorithms: ["HS256"] });
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}
