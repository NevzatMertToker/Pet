import {
  pawMarkSvg,
  productArtSvg,
  speciesArtSvg,
  svgDataUri,
  type ProductType,
  type Species,
} from "@patipaket/shared";

interface ArtProduct {
  slug: string;
  species: Species;
  type: ProductType;
  imageUrl: string | null;
}

/** Ürün görseli: yönetim panelinden fotoğraf yüklenmişse onu, yoksa vektörel ambalaj çizimini gösterir. */
export function ProductArt({
  product,
  alt = "",
  className = "",
}: {
  product: ArtProduct;
  alt?: string;
  className?: string;
}) {
  const src =
    product.imageUrl ??
    svgDataUri(productArtSvg({ species: product.species, type: product.type, seed: product.slug }));
  return (
    // eslint-disable-next-line @next/next/no-img-element -- veri URI'si ve harici görseller için optimizasyon gerekmez
    <img src={src} alt={alt} loading="lazy" className={"h-full w-full object-cover " + className} />
  );
}

export function SpeciesArt({ species, className = "" }: { species: Species; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={svgDataUri(speciesArtSvg(species))} alt="" className={"h-full w-full object-cover " + className} />
  );
}

export function PawMark({ className = "h-5 w-5", color = "#FFFFFF" }: { className?: string; color?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={svgDataUri(pawMarkSvg(color))} alt="" className={className} />
  );
}
