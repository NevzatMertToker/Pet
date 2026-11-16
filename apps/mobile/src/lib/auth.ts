import type { AuthResult, User } from "@patipaket/shared";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { create } from "zustand";

const TOKEN_KEY = "patipaket_oturum";

/**
 * Oturum jetonu telefonda şifreli depoda (Keychain / Keystore) tutulur.
 * Web önizlemesinde SecureStore bulunmadığından tarayıcı deposu kullanılır.
 */
const tokenStorage = {
  async get(): Promise<string | null> {
    try {
      if (Platform.OS === "web") return globalThis.localStorage?.getItem(TOKEN_KEY) ?? null;
      return await SecureStore.getItemAsync(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  async set(token: string | null): Promise<void> {
    try {
      if (Platform.OS === "web") {
        if (token) globalThis.localStorage?.setItem(TOKEN_KEY, token);
        else globalThis.localStorage?.removeItem(TOKEN_KEY);
      } else if (token) {
        await SecureStore.setItemAsync(TOKEN_KEY, token);
      } else {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
      }
    } catch {
      // Depoya yazılamazsa oturum yalnızca uygulama açıkken geçerli olur.
    }
  },
};

interface AuthState {
  token: string | null;
  user: User | null;
  /** Kayıtlı oturum okunana kadar false. */
  ready: boolean;
  signIn: (result: AuthResult) => void;
  setUser: (user: User) => void;
  signOut: () => void;
  restore: (loadUser: () => Promise<User>) => Promise<void>;
}

export const useAuth = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  ready: false,
  signIn: (result) => {
    set({ token: result.token, user: result.user });
    void tokenStorage.set(result.token);
  },
  setUser: (user) => set({ user }),
  signOut: () => {
    if (!get().token) return;
    set({ token: null, user: null });
    void tokenStorage.set(null);
  },
  restore: async (loadUser) => {
    const token = await tokenStorage.get();
    // Uygulama ağ yanıtını beklemeden açılır; kullanıcı bilgisi arka planda gelir.
    set({ token, ready: true });
    if (!token) return;
    try {
      const user = await loadUser();
      if (get().token === token) set({ user });
    } catch {
      // Jeton geçersizse API istemcisi oturumu zaten kapatır; ağ hatasında jeton korunur.
    }
  },
}));
