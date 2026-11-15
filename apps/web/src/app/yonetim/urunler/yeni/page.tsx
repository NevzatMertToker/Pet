import { ProductForm } from "@/components/product-form";

export default function NewProductPage() {
  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-semibold">Yeni ürün</h2>
      <ProductForm />
    </div>
  );
}
