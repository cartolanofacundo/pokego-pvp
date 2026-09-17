import type { Metadata } from "next";
import { Press_Start_2P } from "next/font/google";
import "./globals.css";

const pixelFont = Press_Start_2P({
  variable: "--font-pixel",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PokéGO PVP",
  description:
    "Consulta rápida de tipos, ataques recomendados y switches para PVP de Pokémon GO, con datos de PvPoke.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${pixelFont.variable} h-full`}>
      <body className="min-h-full flex flex-col items-center bg-neutral-950 text-neutral-900">
        {children}
      </body>
    </html>
  );
}
