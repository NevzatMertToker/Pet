import { createApiClient } from "@patipaket/shared";
import { useAuth } from "./auth";

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

export const api = createApiClient({
  baseUrl: API_URL,
  getToken: () => useAuth.getState().token,
  // Jetonun süresi dolduysa ya da hesap silindiyse oturum yerelde de kapanır.
  onUnauthorized: () => useAuth.getState().signOut(),
});
