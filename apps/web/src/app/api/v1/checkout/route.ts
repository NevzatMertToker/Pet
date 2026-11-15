import { checkoutSchema } from "@patipaket/shared";
import { parseBody, requireUser, route } from "@/server/http";
import { checkout } from "@/server/services/checkout";

export const POST = route(async (request) => {
  const user = await requireUser(request);
  const input = await parseBody(request, checkoutSchema);
  return Response.json(await checkout(user.id, input), { status: 201 });
});
