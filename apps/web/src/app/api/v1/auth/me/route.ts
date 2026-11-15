import { profileSchema } from "@patipaket/shared";
import { parseBody, requireUser, route } from "@/server/http";
import { toUser } from "@/server/mappers";
import { updateProfile } from "@/server/services/account";

export const GET = route(async (request) => {
  const user = await requireUser(request);
  return { user: toUser(user) };
});

export const PATCH = route(async (request) => {
  const user = await requireUser(request);
  const input = await parseBody(request, profileSchema);
  return { user: await updateProfile(user.id, input) };
});
