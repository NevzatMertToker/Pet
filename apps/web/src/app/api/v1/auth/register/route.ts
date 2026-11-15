import { registerSchema } from "@patipaket/shared";
import { parseBody, rateLimit, route, setSessionCookieIfRequested } from "@/server/http";
import { registerUser } from "@/server/services/account";

export const POST = route(async (request) => {
  rateLimit(request, "register", 10, 60 * 60_000);
  const input = await parseBody(request, registerSchema);
  const result = await registerUser(input);
  await setSessionCookieIfRequested(request, result.token);
  return Response.json(result, { status: 201 });
});
