import { requireUser, route } from "@/server/http";
import { listOrders } from "@/server/services/orders";

export const GET = route(async (request) => {
  const user = await requireUser(request);
  return { orders: await listOrders(user.id) };
});
