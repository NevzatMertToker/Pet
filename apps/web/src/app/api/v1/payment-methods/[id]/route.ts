import { requireUser, route } from "@/server/http";
import { deletePaymentMethod } from "@/server/services/account";

export const DELETE = route(async (request, context: { params: Promise<{ id: string }> }) => {
  const user = await requireUser(request);
  const { id } = await context.params;
  await deletePaymentMethod(user.id, id);
  return { ok: true };
});
