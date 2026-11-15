import { subscriptionUpdateSchema } from "@patipaket/shared";
import { parseBody, requireUser, route } from "@/server/http";
import { getSubscription, updateSubscription } from "@/server/services/subscriptions";

type Context = { params: Promise<{ id: string }> };

export const GET = route(async (request, context: Context) => {
  const user = await requireUser(request);
  const { id } = await context.params;
  return { subscription: await getSubscription(user.id, id) };
});

export const PATCH = route(async (request, context: Context) => {
  const user = await requireUser(request);
  const { id } = await context.params;
  const input = await parseBody(request, subscriptionUpdateSchema);
  return { subscription: await updateSubscription(user.id, id, input) };
});
