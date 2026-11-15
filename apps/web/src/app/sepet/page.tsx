import type { Metadata } from "next";
import { CartView } from "@/components/cart-view";

export const metadata: Metadata = { title: "Sepetim" };

export default function CartPage() {
  return (
    <div className="container-page py-10">
      <h1 className="text-4xl font-semibold">Sepetim</h1>
      <div className="mt-8">
        <CartView />
      </div>
    </div>
  );
}
