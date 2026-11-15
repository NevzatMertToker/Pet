import { requireUser, route } from "@/server/http";
import { getOrder } from "@/server/services/orders";

export const GET = route(async (request, context: { params: Promise<{ id: string }> }) => {
  const user = await requireUser(request);
  const { id } = await context.params;
  return { order: await getOrder(user.id, id) };
});
