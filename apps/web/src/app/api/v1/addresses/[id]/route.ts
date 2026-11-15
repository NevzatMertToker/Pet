import { addressSchema } from "@patipaket/shared";
import { parseBody, requireUser, route } from "@/server/http";
import { deleteAddress, updateAddress } from "@/server/services/account";

type Context = { params: Promise<{ id: string }> };

export const PATCH = route(async (request, context: Context) => {
  const user = await requireUser(request);
  const { id } = await context.params;
  const input = await parseBody(request, addressSchema);
  return { address: await updateAddress(user.id, id, input) };
});

export const DELETE = route(async (request, context: Context) => {
  const user = await requireUser(request);
  const { id } = await context.params;
  await deleteAddress(user.id, id);
  return { ok: true };
});
