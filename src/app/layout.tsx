import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PokéGO PVP",
  description:
    "Segunda pantalla para PVP de Pokémon GO: qué ataque te pega fuerte, cuánto tarda cada cargado y a quién conviene mandar.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* El brief pide las tres familias en un solo <link> css2 de Google Fonts.
            La app es una sola página, así que la advertencia de Next no aplica. */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@700;800&family=IBM+Plex+Mono:wght@500;600&family=IBM+Plex+Sans:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
