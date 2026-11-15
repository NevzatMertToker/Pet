import { loginSchema } from "@patipaket/shared";
import { parseBody, rateLimit, route, setSessionCookieIfRequested } from "@/server/http";
import { loginUser } from "@/server/services/account";

export const POST = route(async (request) => {
  rateLimit(request, "login", 10, 5 * 60_000);
  const input = await parseBody(request, loginSchema);
  const result = await loginUser(input);
  await setSessionCookieIfRequested(request, result.token);
  return result;
});
