import { categoryLabel, formatPrice } from "@patipaket/shared";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { ProductArt } from "@/components/product-art";
import { Notice } from "@/components/ui";
import { listAllProducts } from "@/server/services/admin";

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const products = await listAllProducts();

  return (
    <div className="space-y-5">
      {query.kaydedildi && <Notice tone="success">Ürün kaydedildi.</Notice>}
      <div className="flex items-center justify-between">
        <p className="text-ink/60">{products.length} ürün</p>
        <Link href="/yonetim/urunler/yeni" className="btn btn-primary">
          <Icon name="plus" className="h-4 w-4" />
          Yeni ürün
        </Link>
      </div>

      <div className="card overflow-x-auto">
        <table className="table-base min-w-[760px]">
          <thead>
            <tr>
              <th>Ürün</th>
              <th>Kategori</th>
              <th className="text-right">Fiyat</th>
              <th className="text-right">Stok</th>
              <th>Durum</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className={product.isActive ? "" : "opacity-55"}>
                <td>
                  <div className="flex items-center gap-3">
                    <span className="h-11 w-11 shrink-0 overflow-hidden rounded-xl">
                      <ProductArt product={product} />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{product.name}</p>
                      <p className="text-ink/55">
                        {product.brand} · {product.packageSize}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="whitespace-nowrap">{categoryLabel(product.species, product.type)}</td>
                <td className="text-right font-semibold whitespace-nowrap">{formatPrice(product.price)}</td>
                <td className="text-right">
                  <span
                    className={
                      "badge " + (product.stock === 0 ? "badge-danger" : product.stock <= 10 ? "badge-warn" : "badge-muted")
                    }
                  >
                    {product.stock}
                  </span>
                </td>
                <td>
                  <div className="flex flex-wrap gap-1">
                    <span className={"badge " + (product.isActive ? "badge-brand" : "badge-muted")}>
                      {product.isActive ? "Satışta" : "Pasif"}
                    </span>
                    {product.isFeatured && <span className="badge badge-accent">Öne çıkan</span>}
                    {!product.subscribable && <span className="badge badge-muted">Aboneliksiz</span>}
                  </div>
                </td>
                <td className="text-right">
                  <Link href={"/yonetim/urunler/" + product.id} className="btn btn-sm btn-outline">
                    Düzenle
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
