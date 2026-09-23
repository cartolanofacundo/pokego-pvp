// Acceso tipado a los JSON estáticos generados por scripts/build-data.mjs.
// Nada de esto hace fetch: los JSON se importan al bundle en build time.

import pokemonRaw from "@/data/pokemon.json";
import movesRaw from "@/data/moves.json";
import metaRaw from "@/data/meta.json";

// Ligas de la temporada vigente de GO Battle League, en el orden en que las
// recorre el selector. Espejo de LEAGUES en scripts/build-data.mjs: al cambiar
// la rotación se editan las dos listas y se corre `npm run build-data`.
export type LeagueKey = "ultra" | "megamaster" | "retro";

export const LEAGUES: { key: LeagueKey; label: string; cp: number }[] = [
  { key: "ultra", label: "Ultra League", cp: 2500 },
  { key: "megamaster", label: "Master League Mega Edition", cp: 10000 },
  { key: "retro", label: "Retro Cup", cp: 1500 },
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
  /** Mega o Primal (etiqueta "mega" de PvPoke). Solo una por equipo. */
  mega: boolean;
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

/**
 * Regla de GO Battle League: una sola Mega (o Primal) por equipo. Se evalúa
 * por lado, así que vale igual para tu equipo y para el del rival.
 */
export function teamHasMega(ids: readonly (string | null)[]): boolean {
  return ids.some((id) => (id ? getPokemon(id)?.mega === true : false));
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

/**
 * "Rival" sin tipos, para cuando el otro lado todavía no tiene un Pokémon
 * activo: sirve como defensor neutral (multiplicador x1 siempre) al calcular
 * el moveset, así se ven los ataques sin badges de efectividad engañosos.
 */
export const NEUTRAL_OPPONENT: Pokemon = {
  speciesId: "__neutral__",
  speciesName: "",
  dex: 0,
  types: ["none", "none"],
  shadow: false,
  mega: false,
  fastMoves: [],
  chargedMoves: [],
  eliteMoves: [],
  leagues: {},
};

export function displayName(p: Pokemon): string {
  // PvPoke ya incluye "(Shadow)" en speciesName para las formas Shadow.
  return p.speciesName;
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
