import type { Metadata } from "next";
import { CombateApp } from "@/components/CombateApp";
import { APP_NAME, SITE_URL } from "@/lib/site";

const title = `Combate PvP en vivo: multiplicadores y turnos · ${APP_NAME}`;
const description = "Segunda pantalla para PVP de Pokémon GO: qué ataque te pega fuerte, cuánto tarda cada cargado y a quién conviene mandar.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: `${SITE_URL}/combate/` },
  openGraph: { title, description, url: `${SITE_URL}/combate/`, locale: "es_AR" },
};

export default function CombatePage() {
  return <CombateApp />;
}
