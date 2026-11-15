"use client";

import { cartCount } from "@patipaket/shared";
import Link from "next/link";
import { useEffect } from "react";
import { useCart } from "@/lib/cart";
import { Icon } from "./icons";

/** Sepeti tarayıcı deposundan bir kez yükler. Kök layout'ta bir kere kullanılır. */
export function CartHydrator() {
  useEffect(() => {
    void Promise.resolve(useCart.persist.rehydrate()).then(() => useCart.setState({ hydrated: true }));
  }, []);
  return null;
}

export function CartButton() {
  const count = useCart((state) => (state.hydrated ? cartCount(state.items) : 0));
  return (
    <Link
      href="/sepet"
      aria-label={count > 0 ? "Sepet, " + count + " ürün" : "Sepet"}
      className="relative grid h-11 w-11 place-items-center rounded-full text-ink/80 transition hover:bg-ink/5 hover:text-ink"
    >
      <Icon name="cart" className="h-[22px] w-[22px]" />
      {count > 0 && (
        <span className="absolute top-1 right-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-accent-400 px-1 text-[11px] font-bold text-ink ring-2 ring-cream">
          {count}
        </span>
      )}
    </Link>
  );
}
