// Semáforo de banca: resultado (gana / parejo / pierde) de un Pokémon del
// banco contra el activo del otro lado.
//
// FUENTE, documentada según pide el brief (sección 3, "Semáforo de banca"):
//   1. Rating de PvPoke, cuando existe. El ranking de PvPoke guarda para cada
//      Pokémon sus 5 mejores matchups y sus 5 peores counters, con un rating
//      0–1000 desde la perspectiva de ese Pokémon. Si el activo rival aparece
//      ahí: rating >= 600 → gana, <= 400 → pierde, entre medio → parejo.
//   2. Heurística de tipos como respaldo, cuando PvPoke no rankea el par:
//      se compara la efectividad máxima de los ataques recomendados de cada
//      lado contra los tipos del otro. Súper efectivo de un solo lado decide;
//      cualquier otra combinación es parejo.
// No modela escudos, energía ni stats: es una señal de lectura rápida.

import type { LeagueKey, Pokemon } from "./data";
import { analyzeMoveset } from "./recommend";

export type Verdict = "win" | "even" | "lose";

const WIN_RATING = 600;
const LOSE_RATING = 400;
const SUPER_EFFECTIVE = 1.6;

function pvpokeRating(me: Pokemon, other: Pokemon, league: LeagueKey): number | null {
  const stats = me.leagues[league];
  if (!stats) return null;
  if (stats.matchups[other.speciesId] !== undefined) return stats.matchups[other.speciesId];
  if (stats.counters[other.speciesId] !== undefined) return stats.counters[other.speciesId];
  return null;
}

function maxEffectiveness(attacker: Pokemon, defender: Pokemon, league: LeagueKey): number {
  const a = analyzeMoveset(attacker, defender, league);
  return Math.max(a.fast?.effectiveness ?? 1, ...a.charged.map((m) => m.effectiveness));
}

/** Resultado de `me` (el del banco) contra `other` (el activo del otro lado), desde la perspectiva de `me`. */
export function verdict(me: Pokemon, other: Pokemon, league: LeagueKey): Verdict {
  const rating = pvpokeRating(me, other, league);
  if (rating !== null) {
    if (rating >= WIN_RATING) return "win";
    if (rating <= LOSE_RATING) return "lose";
    return "even";
  }
  const mine = maxEffectiveness(me, other, league);
  const theirs = maxEffectiveness(other, me, league);
  const iHitHard = mine >= SUPER_EFFECTIVE;
  const theyHitHard = theirs >= SUPER_EFFECTIVE;
  if (iHitHard && !theyHitHard) return "win";
  if (theyHitHard && !iHitHard) return "lose";
  return "even";
}
