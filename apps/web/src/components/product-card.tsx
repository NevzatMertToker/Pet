import { formatPrice, subscriptionUnitPrice, type Product } from "@patipaket/shared";
import Link from "next/link";
import { productHref } from "@/lib/routes";
import { Icon } from "./icons";
import { ProductArt } from "./product-art";

export function ProductCard({ product }: { product: Product }) {
  const soldOut = product.stock <= 0;
  const discountPercent =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
      : 0;

  return (
    <Link
      href={productHref(product.slug)}
      className="group card flex flex-col overflow-hidden transition duration-200 hover:-translate-y-1 hover:shadow-lift focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
    >
      <div className="relative aspect-square overflow-hidden bg-sand">
        <ProductArt
          product={product}
          className={"transition duration-300 group-hover:scale-[1.04] " + (soldOut ? "opacity-60 grayscale-[35%]" : "")}
        />
        <div className="absolute top-3 left-3 flex flex-col items-start gap-1.5">
          {soldOut ? (
            <span className="badge bg-ink/80 text-white">Tükendi</span>
          ) : (
            product.subscribable && (
              <span className="badge bg-white/95 text-brand-800 shadow-sm">
                <Icon name="repeat" className="h-3.5 w-3.5" />
                Abonelikle %10
              </span>
            )
          )}
          {discountPercent > 0 && !soldOut && (
            <span className="badge bg-accent-400 text-ink shadow-sm">%{discountPercent} indirim</span>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className="text-[11px] font-bold tracking-[0.08em] text-ink/45 uppercase">{product.brand}</p>
        <p className="mt-1 line-clamp-2 leading-snug font-semibold text-ink">{product.name}</p>
        <p className="mt-1 text-sm text-ink/55">{product.packageSize}</p>

        <div className="mt-auto flex items-end justify-between gap-2 pt-4">
          <div>
            {discountPercent > 0 && (
              <p className="text-xs text-ink/40 line-through">{formatPrice(product.compareAtPrice!)}</p>
            )}
            <p className="text-lg leading-tight font-bold text-ink">{formatPrice(product.price)}</p>
            {product.subscribable && (
              <p className="mt-0.5 text-xs font-semibold text-brand-700">
                Abonelikle {formatPrice(subscriptionUnitPrice(product.price))}
              </p>
            )}
          </div>
          <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-50 text-brand-700 transition group-hover:bg-brand-600 group-hover:text-white">
            <Icon name="arrow-right" className="h-4 w-4" />
          </span>
        </div>
      </div>
    </Link>
  );
}

export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
