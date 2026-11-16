import type { ProductType, Species } from "./constants";

/**
 * Ürün fotoğrafı yüklenmemiş ürünler için vektörel ambalaj illüstrasyonu üretir.
 * Çıktı düz SVG metnidir; web'de <img> ile, mobilde react-native-svg ile çizilir.
 * Böylece iki uygulamada da görseller birebir aynıdır ve ağ isteği gerektirmez.
 */

interface Palette {
  bg1: string;
  bg2: string;
  pack: string;
  packDark: string;
  label: string;
  ink: string;
  accent: string;
}

const PALETTES: Record<Species, Palette[]> = {
  cat: [
    { bg1: "#FFF3E3", bg2: "#FFD9B0", pack: "#FF8A3D", packDark: "#E2671A", label: "#FFF9F1", ink: "#5A2A0C", accent: "#FFD166" },
    { bg1: "#FFECEF", bg2: "#FFC9D2", pack: "#F2637E", packDark: "#D2415E", label: "#FFF7F8", ink: "#5C1626", accent: "#FFD166" },
    { bg1: "#F4EEFF", bg2: "#DDCDFF", pack: "#8B6CE0", packDark: "#6A4AC2", label: "#FBF8FF", ink: "#2E1B66", accent: "#FFC857" },
  ],
  dog: [
    { bg1: "#E8F4FF", bg2: "#C2E0FF", pack: "#3B8FE0", packDark: "#236DBB", label: "#F6FAFF", ink: "#0E3360", accent: "#FFC857" },
    { bg1: "#E5F8F3", bg2: "#B7E9DD", pack: "#1F9D85", packDark: "#147A66", label: "#F4FCFA", ink: "#0B3B32", accent: "#FFB86B" },
    { bg1: "#FFF4D9", bg2: "#FFE19C", pack: "#E3A51E", packDark: "#B8820A", label: "#FFFCF0", ink: "#4D3400", accent: "#3B8FE0" },
  ],
  bird: [
    { bg1: "#F0FAE2", bg2: "#D3EFAA", pack: "#6FAE2E", packDark: "#52891B", label: "#FAFDF2", ink: "#24400A", accent: "#FFC857" },
    { bg1: "#FFF9DC", bg2: "#FFEC97", pack: "#F0B400", packDark: "#C99400", label: "#FFFDF1", ink: "#4A3800", accent: "#6FAE2E" },
    { bg1: "#E4F9F9", bg2: "#B4EAEB", pack: "#18A6AB", packDark: "#0D8286", label: "#F3FCFC", ink: "#063E40", accent: "#FFC857" },
  ],
};

function hash(text: string): number {
  let value = 0;
  for (let i = 0; i < text.length; i++) value = (value * 31 + text.charCodeAt(i)) >>> 0;
  return value;
}

function paletteFor(species: Species, seed: string): Palette {
  const options = PALETTES[species];
  return options[hash(seed) % options.length];
}

/** Merkezi (0,0) olan, yaklaşık 45 birim yarıçapa sığan tür simgeleri. */
function glyph(species: Species, p: Palette): string {
  if (species === "cat") {
    return [
      `<path d="M-31 -6 L-27 -41 L-5 -23 Z" fill="${p.ink}"/>`,
      `<path d="M31 -6 L27 -41 L5 -23 Z" fill="${p.ink}"/>`,
      `<path d="M-25 -14 L-23 -31 L-12 -22 Z" fill="${p.pack}"/>`,
      `<path d="M25 -14 L23 -31 L12 -22 Z" fill="${p.pack}"/>`,
      `<ellipse cx="0" cy="5" rx="33" ry="27" fill="${p.ink}"/>`,
      `<circle cx="-12" cy="1" r="4.6" fill="${p.label}"/>`,
      `<circle cx="12" cy="1" r="4.6" fill="${p.label}"/>`,
      `<path d="M-4.5 11 L4.5 11 L0 16 Z" fill="${p.accent}"/>`,
      `<path d="M0 16 Q-5 23 -10 20 M0 16 Q5 23 10 20" stroke="${p.label}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`,
      `<path d="M-20 12 H-38 M-20 17 L-37 22 M20 12 H38 M20 17 L37 22" stroke="${p.ink}" stroke-width="2" stroke-linecap="round" opacity="0.55"/>`,
    ].join("");
  }
  if (species === "dog") {
    return [
      `<ellipse cx="-29" cy="-1" rx="11" ry="25" transform="rotate(16 -29 -1)" fill="${p.packDark}"/>`,
      `<ellipse cx="29" cy="-1" rx="11" ry="25" transform="rotate(-16 29 -1)" fill="${p.packDark}"/>`,
      `<ellipse cx="0" cy="2" rx="27" ry="30" fill="${p.ink}"/>`,
      `<ellipse cx="0" cy="15" rx="15" ry="12" fill="${p.label}"/>`,
      `<ellipse cx="0" cy="9" rx="6" ry="4.4" fill="${p.ink}"/>`,
      `<circle cx="-11" cy="-7" r="4.2" fill="${p.label}"/>`,
      `<circle cx="11" cy="-7" r="4.2" fill="${p.label}"/>`,
      `<path d="M0 13 V18 M-6 19 Q0 25 6 19" stroke="${p.ink}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`,
    ].join("");
  }
  return [
    `<path d="M-30 12 L-52 2 L-47 27 Z" fill="${p.packDark}"/>`,
    `<ellipse cx="-6" cy="9" rx="30" ry="24" fill="${p.ink}"/>`,
    `<circle cx="17" cy="-12" r="18" fill="${p.ink}"/>`,
    `<path d="M32 -18 L50 -11 L32 -4 Z" fill="${p.accent}"/>`,
    `<circle cx="21" cy="-16" r="3.8" fill="${p.label}"/>`,
    `<path d="M-26 7 Q-8 -9 11 8 Q-8 26 -26 7 Z" fill="${p.pack}"/>`,
    `<path d="M-8 33 V42 M4 33 V42" stroke="${p.ink}" stroke-width="3" stroke-linecap="round"/>`,
  ].join("");
}

function pack(type: ProductType, p: Palette): string {
  if (type === "food") {
    return [
      `<path d="M124 92 H276 L292 122 V316 Q292 340 268 340 H132 Q108 340 108 316 V122 Z" fill="${p.pack}"/>`,
      `<path d="M124 92 H276 L292 122 H108 Z" fill="${p.packDark}"/>`,
      `<path d="M108 258 H292 V316 Q292 340 268 340 H132 Q108 340 108 316 Z" fill="${p.packDark}" opacity="0.45"/>`,
      `<path d="M126 136 V300" stroke="#FFFFFF" stroke-width="9" stroke-linecap="round" opacity="0.22"/>`,
      `<circle cx="200" cy="190" r="58" fill="${p.label}"/>`,
      `<rect x="148" y="280" width="104" height="9" rx="4.5" fill="${p.label}" opacity="0.92"/>`,
      `<rect x="168" y="298" width="64" height="7" rx="3.5" fill="${p.label}" opacity="0.6"/>`,
    ].join("");
  }
  if (type === "litter") {
    return [
      `<path d="M152 78 H248 Q262 78 262 92 V124 H138 V92 Q138 78 152 78 Z" fill="${p.packDark}"/>`,
      `<rect x="174" y="92" width="52" height="15" rx="7.5" fill="${p.bg1}"/>`,
      `<path d="M120 118 H280 Q302 118 302 140 V318 Q302 340 280 340 H120 Q98 340 98 318 V140 Q98 118 120 118 Z" fill="${p.pack}"/>`,
      `<path d="M98 262 Q200 226 302 262 V318 Q302 340 280 340 H120 Q98 340 98 318 Z" fill="${p.packDark}" opacity="0.5"/>`,
      `<path d="M116 150 V300" stroke="#FFFFFF" stroke-width="9" stroke-linecap="round" opacity="0.22"/>`,
      `<circle cx="200" cy="196" r="56" fill="${p.label}"/>`,
      `<circle cx="140" cy="302" r="5.5" fill="${p.label}" opacity="0.85"/>`,
      `<circle cx="166" cy="316" r="4.2" fill="${p.label}" opacity="0.7"/>`,
      `<circle cx="202" cy="306" r="5" fill="${p.label}" opacity="0.85"/>`,
      `<circle cx="236" cy="318" r="4.2" fill="${p.label}" opacity="0.7"/>`,
      `<circle cx="262" cy="300" r="5.5" fill="${p.label}" opacity="0.85"/>`,
    ].join("");
  }
  return [
    `<path d="M156 122 Q176 62 200 100 Q226 58 246 122 Z" fill="#FFFFFF"/>`,
    `<path d="M156 122 Q176 62 200 100 Q226 58 246 122" fill="none" stroke="${p.bg2}" stroke-width="3"/>`,
    `<rect x="102" y="116" width="196" height="224" rx="22" fill="${p.pack}"/>`,
    `<path d="M124 116 H276 Q298 116 298 138 V156 H102 V138 Q102 116 124 116 Z" fill="${p.packDark}"/>`,
    `<rect x="158" y="129" width="84" height="13" rx="6.5" fill="${p.ink}" opacity="0.35"/>`,
    `<path d="M120 176 V318" stroke="#FFFFFF" stroke-width="9" stroke-linecap="round" opacity="0.22"/>`,
    `<circle cx="200" cy="234" r="56" fill="${p.label}"/>`,
    `<rect x="150" y="306" width="100" height="9" rx="4.5" fill="${p.label}" opacity="0.9"/>`,
  ].join("");
}

const GLYPH_CENTER: Record<ProductType, number> = { food: 190, litter: 196, supplies: 234 };

export interface ProductArtInput {
  species: Species;
  type: ProductType;
  /** Renk çeşitliliği için — genellikle ürünün slug'ı. */
  seed: string;
}

export function productArtSvg({ species, type, seed }: ProductArtInput): string {
  const p = paletteFor(species, seed);
  // Aynı sayfada birden çok satır içi SVG olduğunda degrade kimlikleri çakışmasın.
  const gradient = "pp-" + hash([species, type, seed].join("/")).toString(36);
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">`,
    `<defs><linearGradient id="${gradient}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${p.bg1}"/><stop offset="1" stop-color="${p.bg2}"/></linearGradient></defs>`,
    `<rect width="400" height="400" fill="url(#${gradient})"/>`,
    `<circle cx="336" cy="62" r="92" fill="#FFFFFF" opacity="0.38"/>`,
    `<circle cx="52" cy="352" r="64" fill="#FFFFFF" opacity="0.28"/>`,
    `<ellipse cx="200" cy="350" rx="116" ry="13" fill="${p.ink}" opacity="0.13"/>`,
    pack(type, p),
    `<g transform="translate(200 ${GLYPH_CENTER[type]})">${glyph(species, p)}</g>`,
    `</svg>`,
  ].join("");
}

/** Kategori kartları için büyük tür portresi. */
export function speciesArtSvg(species: Species): string {
  const p = PALETTES[species][0];
  const gradient = "pp-tur-" + species;
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">`,
    `<defs><linearGradient id="${gradient}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${p.bg1}"/><stop offset="1" stop-color="${p.bg2}"/></linearGradient></defs>`,
    `<rect width="400" height="400" fill="url(#${gradient})"/>`,
    `<circle cx="330" cy="70" r="110" fill="#FFFFFF" opacity="0.35"/>`,
    `<circle cx="60" cy="350" r="80" fill="#FFFFFF" opacity="0.25"/>`,
    `<circle cx="200" cy="205" r="128" fill="${p.label}"/>`,
    `<g transform="translate(200 205) scale(2.25)">${glyph(species, p)}</g>`,
    `</svg>`,
  ].join("");
}

/** Marka simgesi: pati izi. `color` ana renk, `background` verilirse yuvarlak köşeli zemin çizilir. */
export function pawMarkSvg(color = "#FFFFFF", background?: string): string {
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">`,
    background ? `<rect width="100" height="100" rx="28" fill="${background}"/>` : "",
    `<g fill="${color}">`,
    `<ellipse cx="27" cy="45" rx="8" ry="10.5" transform="rotate(-18 27 45)"/>`,
    `<ellipse cx="41" cy="30" rx="8.5" ry="11.5" transform="rotate(-6 41 30)"/>`,
    `<ellipse cx="59" cy="30" rx="8.5" ry="11.5" transform="rotate(6 59 30)"/>`,
    `<ellipse cx="73" cy="45" rx="8" ry="10.5" transform="rotate(18 73 45)"/>`,
    `<path d="M50 48 C38 48 28 59 28 68 C28 76 35 79 41 77 C45 75.5 47 75 50 75 C53 75 55 75.5 59 77 C65 79 72 76 72 68 C72 59 62 48 50 48 Z"/>`,
    `</g></svg>`,
  ].join("");
}

export function svgDataUri(svg: string): string {
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}
