import { notFound } from "next/navigation";
import { ProductForm } from "@/components/product-form";
import { getProductById } from "@/server/services/admin";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProductById(id);
  if (!product) notFound();

  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-semibold">
        {product.brand} {product.name}
      </h2>
      <ProductForm product={product} />
    </div>
  );
}
