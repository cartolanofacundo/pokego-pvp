import type { Metadata } from "next";
import { RankerApp } from "@/components/ranker/RankerApp";
import { ToolMobileNotice } from "@/components/ToolMobileNotice";
import { APP_NAME, SITE_URL } from "@/lib/site";

const title = `Ranking de IV por liga para Pokémon GO · ${APP_NAME}`;
const description = "Rango de IV por liga para tus Pokémon y sus evoluciones, con el puesto en PvPoke y lo que cuesta llegar.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: `${SITE_URL}/rankeador/` },
  openGraph: { title, description, url: `${SITE_URL}/rankeador/`, locale: "es_AR" },
};

export default function RankeadorPage() {
  return (
    <>
      <ToolMobileNotice section="rankeador" path="/rankeador/" />
      <div className="tool-desktop">
        <RankerApp />
      </div>
    </>
  );
}
