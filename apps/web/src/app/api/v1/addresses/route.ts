import { addressSchema } from "@patipaket/shared";
import { parseBody, requireUser, route } from "@/server/http";
import { createAddress, listAddresses } from "@/server/services/account";

export const GET = route(async (request) => {
  const user = await requireUser(request);
  return { addresses: await listAddresses(user.id) };
});

export const POST = route(async (request) => {
  const user = await requireUser(request);
  const input = await parseBody(request, addressSchema);
  return Response.json({ address: await createAddress(user.id, input) }, { status: 201 });
});
