import { cookies } from "next/headers";
import type { z } from "zod";
import { SESSION_COOKIE, SESSION_MAX_AGE_SECONDS, readSessionToken } from "./auth";
import { HttpError, forbidden, invalid, tooManyRequests, unauthorized } from "./errors";
import type { UserRow } from "./mappers";
import { getUserById } from "./services/account";

type Handler<C> = (request: Request, context: C) => Promise<Response | object>;

function errorResponse(error: unknown): Response {
  if (error instanceof HttpError) {
    return Response.json(
      { error: { code: error.code, message: error.message, fields: error.fields } },
      { status: error.status },
    );
  }
  console.error("[api] beklenmeyen hata", error);
  return Response.json(
    { error: { code: "internal_error", message: "Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.", fields: {} } },
    { status: 500 },
  );
}

/** Route handler sarmalayıcısı: düz nesneleri JSON'a, hataları tutarlı bir hata gövdesine çevirir. */
export function route<C = unknown>(handler: Handler<C>) {
  return async (request: Request, context: C): Promise<Response> => {
    try {
      const result = await handler(request, context);
      return result instanceof Response ? result : Response.json(result);
    } catch (error) {
      return errorResponse(error);
    }
  };
}

function fieldErrors(error: z.ZodError): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    if (!(key in fields)) fields[key] = issue.message;
  }
  return fields;
}

export function parseInput<S extends z.ZodType>(schema: S, data: unknown): z.output<S> {
  const result = schema.safeParse(data);
  if (!result.success) {
    const fields = fieldErrors(result.error);
    throw invalid(Object.values(fields)[0] ?? "Gönderilen bilgiler geçersiz.", fields);
  }
  return result.data;
}

export async function parseBody<S extends z.ZodType>(request: Request, schema: S): Promise<z.output<S>> {
  let data: unknown;
  try {
    data = await request.json();
  } catch {
    throw invalid("İstek gövdesi geçerli JSON değil.");
  }
  return parseInput(schema, data);
}

/** Bearer başlığı (mobil) veya oturum çerezi (web) ile gelen kullanıcıyı bulur. */
export async function getRequestUser(request: Request): Promise<UserRow | null> {
  const header = request.headers.get("authorization");
  let token = header?.startsWith("Bearer ") ? header.slice(7).trim() : null;
  if (!token) token = (await cookies()).get(SESSION_COOKIE)?.value ?? null;
  if (!token) return null;
  const userId = await readSessionToken(token);
  return userId ? getUserById(userId) : null;
}

export async function requireUser(request: Request): Promise<UserRow> {
  const user = await getRequestUser(request);
  if (!user) throw unauthorized();
  return user;
}

export async function requireAdmin(request: Request): Promise<UserRow> {
  const user = await requireUser(request);
  if (user.role !== "admin") throw forbidden();
  return user;
}

/** Web istemcisi "X-Session-Mode: cookie" gönderir; mobil yalnızca jetonu kullanır. */
export async function setSessionCookieIfRequested(request: Request, token: string): Promise<void> {
  if (request.headers.get("x-session-mode") !== "cookie") return;
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function clearSessionCookie(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}

/* ------------------------------------------------------------ hız sınırı */

const attempts = new Map<string, { count: number; resetAt: number }>();

/**
 * Basit, bellek içi deneme sınırlayıcı (kaba kuvvet şifre denemelerine karşı).
 * Tek sunucu için yeterlidir; birden çok sunucu/serverless kopyasıyla çalışırken
 * paylaşımlı bir depo (ör. Redis/Upstash) ile değiştirilmelidir.
 */
export function rateLimit(request: Request, bucket: string, limit = 10, windowMs = 5 * 60_000): void {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  // İstemci adresi bilinmiyorsa (önünde vekil sunucu yoksa) herkes tek kovaya düşer ve
  // birkaç denemeden sonra tüm kullanıcılar engellenirdi; bu durumda sınır uygulanmaz.
  if (!ip) return;
  const key = bucket + ":" + ip;
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || entry.resetAt < now) {
    if (attempts.size > 10_000) {
      for (const [k, value] of attempts) if (value.resetAt < now) attempts.delete(k);
    }
    attempts.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }
  entry.count += 1;
  if (entry.count > limit) throw tooManyRequests();
}
