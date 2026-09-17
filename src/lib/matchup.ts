// Ventaja de un Pokémon sobre otro, usada para los badges "!" (enemigo que me
// complica) y "+" (aliado que conviene meter) en las listas de equipo, y para
// resaltar qué tipos importan en los paneles de debilidad/resistencia.

import { analyzeMoveset } from "./recommend";
import { normalizeTypes, type PokemonType } from "./types";
import { getMove, type LeagueKey, type Pokemon } from "./data";

export interface MatchupAdvantage {
  /** Mayor efectividad entre los ataques recomendados de `attacker` contra `defender`. */
  maxMult: number;
  /** Rating 0-1000 de PvPoke si `defender` aparece en los matchups/counters de `attacker`. */
  rating: number | null;
  /** true si a `attacker` le conviene meterse contra `defender`. */
  advantage: boolean;
}

const ADVANTAGE_MULT_THRESHOLD = 1.6;
const ADVANTAGE_RATING_THRESHOLD = 600;

function pvpokeRating(attacker: Pokemon, defender: Pokemon, league: LeagueKey): number | null {
  const stats = attacker.leagues[league];
  if (!stats) return null;
  if (stats.matchups[defender.speciesId] !== undefined) return stats.matchups[defender.speciesId];
  if (stats.counters[defender.speciesId] !== undefined) return stats.counters[defender.speciesId];
  return null;
}

/**
 * ¿Le conviene a `attacker` salir a pelear contra `defender`? Combina la
 * efectividad de tipo de sus ataques recomendados con el rating de PvPoke
 * cuando existe. Se usa simétricamente: enemigo vs mi activo (badge rojo),
 * aliado vs enemigo activo (badge verde) son la misma función.
 */
export function matchupAdvantage(
  attacker: Pokemon,
  defender: Pokemon,
  league: LeagueKey
): MatchupAdvantage {
  const analysis = analyzeMoveset(attacker, defender, league);
  const maxMult = Math.max(
    analysis.fast?.effectiveness ?? 1,
    ...analysis.charged.map((m) => m.effectiveness)
  );
  const rating = pvpokeRating(attacker, defender, league);
  const advantage = maxMult >= ADVANTAGE_MULT_THRESHOLD || (rating ?? 0) >= ADVANTAGE_RATING_THRESHOLD;
  return { maxMult, rating, advantage };
}

/** Tipos normalizados de los ataques recomendados de un Pokémon (rápido + 2 cargados). */
export function attackTypesOf(p: Pokemon, league: LeagueKey): PokemonType[] {
  const stats = p.leagues[league];
  const moveset = stats?.moveset?.length
    ? stats.moveset
    : [p.fastMoves[0], ...p.chargedMoves.slice(0, 2)];
  const types = moveset
    .filter((id): id is string => !!id)
    .map((id) => getMove(id)?.type)
    .filter((t): t is string => !!t);
  return normalizeTypes(types);
}

/**
 * Tipos que "importan" para un equipo de hasta 3 Pokémon: los de sus ataques
 * recomendados (lo que realmente pega), no sus tipos propios. Sirve para
 * resaltar en el panel de tipos del rival qué debilidades/resistencias son
 * relevantes contra este equipo en concreto.
 */
export function relevantAttackTypes(team: (Pokemon | null)[], league: LeagueKey): Set<PokemonType> {
  const types = new Set<PokemonType>();
  for (const p of team) {
    if (!p) continue;
    for (const t of attackTypesOf(p, league)) types.add(t);
  }
  return types;
}
