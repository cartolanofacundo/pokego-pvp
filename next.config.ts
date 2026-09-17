import type { NextConfig } from "next";

// En GitHub Pages la app vive en https://usuario.github.io/pokego-pvp/, no en
// la raíz del dominio. El workflow de deploy (.github/workflows/deploy.yml)
// setea NEXT_PUBLIC_BASE_PATH="/pokego-pvp" antes del build; en local/Vercel
// queda vacío y la app corre en la raíz como siempre.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  basePath,
  assetPrefix: basePath ? `${basePath}/` : undefined,
};

export default nextConfig;
