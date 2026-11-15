import { petSchema } from "@patipaket/shared";
import { parseBody, requireUser, route } from "@/server/http";
import { createPet, listPets } from "@/server/services/account";

export const GET = route(async (request) => {
  const user = await requireUser(request);
  return { pets: await listPets(user.id) };
});

export const POST = route(async (request) => {
  const user = await requireUser(request);
  const input = await parseBody(request, petSchema);
  return Response.json({ pet: await createPet(user.id, input) }, { status: 201 });
});
