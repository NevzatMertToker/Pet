import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ortak paket TypeScript kaynağı olarak tüketilir; derlemeyi Next yapar.
  transpilePackages: ["@patipaket/shared"],
  // node-postgres sunucu tarafında paketlenmeden kullanılır.
  serverExternalPackages: ["pg"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
