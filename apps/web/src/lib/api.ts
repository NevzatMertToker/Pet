import { createApiClient } from "@patipaket/shared";

/** Tarayıcıdan kullanılan API istemcisi; oturum httpOnly çerezle taşınır. */
export const api = createApiClient({ baseUrl: "", useCookies: true });
