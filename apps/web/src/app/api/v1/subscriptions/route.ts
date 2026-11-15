import { requireUser, route } from "@/server/http";
import { listSubscriptions } from "@/server/services/subscriptions";

export const GET = route(async (request) => {
  const user = await requireUser(request);
  return { subscriptions: await listSubscriptions(user.id) };
});
