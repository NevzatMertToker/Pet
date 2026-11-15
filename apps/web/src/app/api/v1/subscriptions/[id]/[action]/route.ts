import { SUBSCRIPTION_ACTIONS, type SubscriptionAction } from "@patipaket/shared";
import { notFound } from "@/server/errors";
import { requireUser, route } from "@/server/http";
import { performSubscriptionAction } from "@/server/services/subscriptions";

/** POST /subscriptions/:id/(pause|resume|skip|cancel|ship-now) */
export const POST = route(async (request, context: { params: Promise<{ id: string; action: string }> }) => {
  const user = await requireUser(request);
  const { id, action } = await context.params;
  if (!(SUBSCRIPTION_ACTIONS as readonly string[]).includes(action)) throw notFound();
  return performSubscriptionAction(user.id, id, action as SubscriptionAction);
});
