import { clearSessionCookie, route } from "@/server/http";

export const POST = route(async () => {
  await clearSessionCookie();
  return { ok: true };
});
