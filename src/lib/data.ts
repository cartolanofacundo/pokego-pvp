// Acceso tipado a los JSON estáticos generados por scripts/build-data.mjs.
// Nada de esto hace fetch: los JSON se importan al bundle en build time.

import pokemonRaw from "@/data/pokemon.json";
import movesRaw from "@/data/moves.json";
import metaRaw from "@/data/meta.json";

export type LeagueKey = "great" | "ultra" | "master";

export const LEAGUES: { key: LeagueKey; label: string; cp: number }[] = [
  { key: "great", label: "Great League", cp: 1500 },
  { key: "ultra", label: "Ultra League", cp: 2500 },
  { key: "master", label: "Master League", cp: 10000 },
];

export interface LeagueStats {
  rank: number;
  score: number | null;
  rating: number | null;
  moveset: string[];
  fastUsage: Record<string, number>;
  chargedUsage: Record<string, number>;
  matchups: Record<string, number>;
  counters: Record<string, number>;
}

export interface Pokemon {
  speciesId: string;
  speciesName: string;
  dex: number;
  types: [string, string];
  shadow: boolean;
  fastMoves: string[];
  chargedMoves: string[];
  eliteMoves: string[];
  leagues: Partial<Record<LeagueKey, LeagueStats>>;
}

export interface Move {
  name: string;
  type: string;
  power: number;
  energy: number;
  energyGain: number;
  turns: number;
  buffs?: [number, number];
  buffTarget?: "opponent" | "self";
  buffApplyChance?: string;
  archetype?: string;
}

export const POKEMON = pokemonRaw as unknown as Pokemon[];
export const MOVES = movesRaw as unknown as Record<string, Move>;
export const META = metaRaw as {
  generatedAt: string;
  gamemasterTimestamp: string | null;
  pokemonCount: number;
  moveCount: number;
};

const byId = new Map(POKEMON.map((p) => [p.speciesId, p]));

export function getPokemon(speciesId: string): Pokemon | undefined {
  return byId.get(speciesId);
}

export function getMove(moveId: string): Move | undefined {
  return MOVES[moveId];
}

/** Pokémon que tienen ranking en la liga dada, ordenados por rank. */
export function getPokemonForLeague(league: LeagueKey): Pokemon[] {
  return POKEMON.filter((p) => p.leagues[league]).sort(
    (a, b) => (a.leagues[league]?.rank ?? 9999) - (b.leagues[league]?.rank ?? 9999)
  );
}

function stripAccents(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

/** Búsqueda de Pokémon por nombre, insensible a mayúsculas/acentos, dentro de una liga. */
export function searchPokemon(query: string, league: LeagueKey): Pokemon[] {
  const q = stripAccents(query.trim().toLowerCase());
  const pool = getPokemonForLeague(league);
  if (!q) return pool;
  return pool.filter((p) => stripAccents(p.speciesName.toLowerCase()).includes(q));
}

export function displayName(p: Pokemon): string {
  return p.shadow ? `${p.speciesName} (Shadow)` : p.speciesName;
}

/** Movimiento rápido y 2 cargados recomendados por PvPoke para esa liga (o el pool completo si no hay ranking). */
export function recommendedMoveset(
  p: Pokemon,
  league: LeagueKey
): { fast: string | null; charged: string[] } {
  const stats = p.leagues[league];
  if (stats?.moveset?.length) {
    const [fast, ...charged] = stats.moveset;
    return { fast: fast ?? null, charged };
  }
  return { fast: p.fastMoves[0] ?? null, charged: p.chargedMoves.slice(0, 2) };
}
