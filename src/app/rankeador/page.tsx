import type { Metadata } from "next";
import { RankerApp } from "@/components/ranker/RankerApp";

export const metadata: Metadata = {
  title: "Rankeador · PokéGO PVP",
  description: "Rango de IV por liga para tus Pokémon y sus evoluciones, con el puesto en PvPoke y lo que cuesta llegar.",
};

export default function RankeadorPage() {
  return <RankerApp />;
}
