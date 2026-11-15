import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * API için CORS. Yerel (native) iOS/Android uygulaması CORS'a tabi değildir;
 * bu ayar yalnızca tarayıcıdan başka bir origin'den gelen istekler içindir
 * (ör. Expo'nun web geliştirme sunucusu). İzinli origin'ler CORS_ORIGINS ile verilir.
 */
const CORS_HEADERS = {
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Session-Mode",
  "Access-Control-Max-Age": "86400",
};

function allowedOrigins(): string[] {
  return (process.env.CORS_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function proxy(request: NextRequest) {
  const origin = request.headers.get("origin") ?? "";
  const allowed = origin !== "" && allowedOrigins().includes(origin);

  if (request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: allowed ? { ...CORS_HEADERS, "Access-Control-Allow-Origin": origin, Vary: "Origin" } : {},
    });
  }

  const response = NextResponse.next();
  if (allowed) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Vary", "Origin");
    for (const [key, value] of Object.entries(CORS_HEADERS)) response.headers.set(key, value);
  }
  return response;
}

export const config = {
  matcher: "/api/:path*",
};
