import {
  pawMarkSvg,
  productArtSvg,
  speciesArtSvg,
  type ProductType,
  type Species,
} from "@patipaket/shared";
import { Image } from "expo-image";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { SvgXml } from "react-native-svg";
import { radius } from "@/lib/theme";

interface ArtProduct {
  slug: string;
  species: Species;
  type: ProductType;
  imageUrl: string | null;
}

/** Ürün görseli: fotoğraf varsa onu, yoksa web ile aynı vektörel ambalaj çizimini gösterir. */
export function ProductArt({
  product,
  style,
  rounded = radius.lg,
}: {
  product: ArtProduct;
  style?: StyleProp<ViewStyle>;
  rounded?: number;
}) {
  return (
    <View style={[styles.frame, { borderRadius: rounded }, style]}>
      {product.imageUrl ? (
        <Image source={{ uri: product.imageUrl }} style={styles.fill} contentFit="cover" />
      ) : (
        <SvgXml
          xml={productArtSvg({ species: product.species, type: product.type, seed: product.slug })}
          width="100%"
          height="100%"
        />
      )}
    </View>
  );
}

export function SpeciesArt({ species, style }: { species: Species; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.frame, { borderRadius: radius.lg }, style]}>
      <SvgXml xml={speciesArtSvg(species)} width="100%" height="100%" />
    </View>
  );
}

export function PawMark({ size = 24, color = "#FFFFFF" }: { size?: number; color?: string }) {
  return <SvgXml xml={pawMarkSvg(color)} width={size} height={size} />;
}

const styles = StyleSheet.create({
  frame: { aspectRatio: 1, overflow: "hidden", backgroundColor: "#f6efe3" },
  fill: { width: "100%", height: "100%" },
});
