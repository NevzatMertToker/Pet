import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  addToCart,
  removeFromCart,
  setCartInterval,
  setCartQuantity,
  type CartItem,
  type CartProduct,
} from "@patipaket/shared";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface CartState {
  items: CartItem[];
  add: (product: CartProduct, quantity: number, intervalWeeks: number | null) => void;
  setQuantity: (key: string, quantity: number) => void;
  setInterval: (key: string, intervalWeeks: number | null) => void;
  remove: (key: string) => void;
  replace: (items: CartItem[]) => void;
  clear: () => void;
}

/** Sepet cihazda saklanır; uygulama kapansa da kaybolmaz. Mantığı web ile ortaktır. */
export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      add: (product, quantity, intervalWeeks) =>
        set((state) => ({ items: addToCart(state.items, product, quantity, intervalWeeks) })),
      setQuantity: (key, quantity) => set((state) => ({ items: setCartQuantity(state.items, key, quantity) })),
      setInterval: (key, intervalWeeks) =>
        set((state) => ({ items: setCartInterval(state.items, key, intervalWeeks) })),
      remove: (key) => set((state) => ({ items: removeFromCart(state.items, key) })),
      replace: (items) => set({ items }),
      clear: () => set({ items: [] }),
    }),
    {
      name: "patipaket-sepet",
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ items: state.items }),
    },
  ),
);
