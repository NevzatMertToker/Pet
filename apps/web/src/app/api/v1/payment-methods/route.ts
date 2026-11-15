import { cardSchema } from "@patipaket/shared";
import { parseBody, rateLimit, requireUser, route } from "@/server/http";
import { createPaymentMethod, listPaymentMethods } from "@/server/services/account";

export const GET = route(async (request) => {
  const user = await requireUser(request);
  return { paymentMethods: await listPaymentMethods(user.id) };
});

export const POST = route(async (request) => {
  const user = await requireUser(request);
  rateLimit(request, "card:" + user.id, 10, 60 * 60_000);
  const card = await parseBody(request, cardSchema);
  return Response.json({ paymentMethod: await createPaymentMethod(user.id, card) }, { status: 201 });
});
