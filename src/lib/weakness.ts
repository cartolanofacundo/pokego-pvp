// Fila "DÉBIL A" de la caja de stats: tipos con multiplicador total >= 1.6,
// hasta tres, ordenados por multiplicador y después alfabéticamente en
// español (así lo muestra el diseño: FUEGO · LUCHA · TIERRA, ELÉCTRICO ·
// PLANTA · VENENO).

import { weaknesses, type PokemonType } from "./types";
import { typeLabelEs } from "./typeLabels";

export function weaknessesTop3(types: readonly (string | null | undefined)[]): PokemonType[] {
  return weaknesses(types)
    .sort((a, b) => {
      if (b.multiplier !== a.multiplier) return b.multiplier - a.multiplier;
      return typeLabelEs(a.type).localeCompare(typeLabelEs(b.type), "es");
    })
    .slice(0, 3)
    .map((w) => w.type);
}
