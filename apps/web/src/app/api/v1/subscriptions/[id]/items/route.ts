import { subscriptionItemsSchema } from "@patipaket/shared";
import { parseBody, requireUser, route } from "@/server/http";
import { setSubscriptionItems } from "@/server/services/subscriptions";

export const PUT = route(async (request, context: { params: Promise<{ id: string }> }) => {
  const user = await requireUser(request);
  const { id } = await context.params;
  const input = await parseBody(request, subscriptionItemsSchema);
  return { subscription: await setSubscriptionItems(user.id, id, input) };
});
