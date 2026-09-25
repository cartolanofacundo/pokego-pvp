// Datos estáticos del rankeador (scripts/build-ranker-data.mjs). Solo los
// importa la sección del rankeador, así no pesan en la pantalla de combate.

import speciesRaw from "@/data/ranker/species.json";
import ranksRaw from "@/data/ranker/ranks.json";
import costsRaw from "@/data/ranker/costs.json";

export interface Species {
  id: string;
  name: string;
  dex: number;
  atk: number;
  def: number;
  sta: number;
  types: [string, string];
  shadow: boolean;
  mega: boolean;
  /** Especie de la que evoluciona, o null si es la primera de su familia (o una Mega). */
  parent: string | null;
  evolutions: string[];
  /** Caramelos para evolucionar a cada id de `evolutions` (falta si Niantic no lo publica). */
  evolveCandy: Record<string, number>;
  /** Caramelos para evolucionar un Purificado a cada id de `evolutions`. */
  evolveCandyPurified: Record<string, number>;
  megas: string[];
  /** Energía para la primera Megaevolución hacia cada id de `megas`. */
  megaEnergy: Record<string, number>;
  /**
   * Regla real de Little Cup: sin evolucionar (primera de su familia) y con
   * al menos una evolución disponible, salvo Shuckle y Smeargle. Es
   * independiente de si PvPoke llegó a rankearla en esa liga.
   */
  littleEligible: boolean;
  third: { candy: number | null; dust: number | null } | null;
}

export interface Costs {
  cpm: number[];
  candy: number[];
  stardust: number[];
  xlCandy: number[];
  xlFromLevel: number;
  maxPowerUpLevel: number;
  shadowCandy: number;
  shadowDust: number;
  purifiedCandy: number;
  purifiedDust: number;
  luckyDust: number;
}

/** Variantes de un Pokémon cargado. Afectan el costo y, en Oscuro, el puesto en PvPoke; nunca el rango de IV. */
export type Variant = "normal" | "shadow" | "purified";

/** Ligas del rankeador. `cap` define el rango de IV; `pvpoke` es la clave del puesto de la especie. */
export type RankerLeagueKey = "little" | "great" | "ultra" | "master" | "megagreat" | "megaultra" | "megamaster";

export interface RankerLeague {
  key: RankerLeagueKey;
  label: string;
  short: string;
  cap: number;
  /** En las ligas Mega se permiten Megas y Primales. */
  mega: boolean;
}

export const RANKER_LEAGUES: RankerLeague[] = [
  { key: "little", label: "Little League", short: "Little", cap: 500, mega: false },
  { key: "great", label: "Great League", short: "Great", cap: 1500, mega: false },
  { key: "ultra", label: "Ultra League", short: "Ultra", cap: 2500, mega: false },
  { key: "master", label: "Master League", short: "Master", cap: Infinity, mega: false },
  { key: "megagreat", label: "Mega Great League", short: "Mega Great", cap: 1500, mega: true },
  { key: "megaultra", label: "Mega Ultra League", short: "Mega Ultra", cap: 2500, mega: true },
  { key: "megamaster", label: "Mega Master League", short: "Mega Master", cap: Infinity, mega: true },
];

/** Las cuatro columnas de tope de CP del detalle (las Mega comparten tope con su liga base). */
export const CAP_LEAGUES = RANKER_LEAGUES.filter((l) => !l.mega);

export const SPECIES = speciesRaw as unknown as Species[];
export const COSTS = costsRaw as unknown as Costs;
const RANKS = ranksRaw as unknown as Record<RankerLeagueKey, Record<string, number>>;

const byId = new Map(SPECIES.map((s) => [s.id, s]));

export function getSpecies(id: string): Species | undefined {
  return byId.get(id);
}

/** Puesto de la especie en el ranking de PvPoke de esa liga, o null si no está rankeada. */
export function pvpokeRank(id: string, league: RankerLeagueKey): number | null {
  return RANKS[league]?.[id] ?? null;
}

/**
 * Puesto en PvPoke de una forma según la variante: el Oscuro es una especie
 * aparte a los ojos de PvPoke (`<id>_shadow`), y suele rankear distinto que
 * la forma normal. Si esa especie Shadow no existe (no todas las tienen),
 * queda sin puesto.
 */
export function pvpokeRankForVariant(id: string, variant: Variant, league: RankerLeagueKey): number | null {
  if (variant !== "shadow") return pvpokeRank(id, league);
  const shadowId = `${id}_shadow`;
  return byId.has(shadowId) ? pvpokeRank(shadowId, league) : null;
}

function stripAccents(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

// La caja se carga por especie base: el Oscuro y el Purificado son una
// variante de esa misma carga, no una especie aparte. Por eso el buscador de
// especie no ofrece formas Shadow (aunque siguen en SPECIES, para buscar su
// puesto en PvPoke) ni Megas (se llega a ellas desde su especie base, en la
// grilla del detalle).
const PICKABLE = SPECIES.filter((s) => !s.shadow && !s.mega);

/** Búsqueda por nombre o número de pokédex, en orden de pokédex. */
export function searchSpecies(query: string, limit = 40): Species[] {
  const q = stripAccents(query.trim().toLowerCase());
  if (!q) return PICKABLE.slice(0, limit);
  if (/^\d+$/.test(q)) {
    const n = Number(q);
    return PICKABLE.filter((s) => s.dex === n || String(s.dex).startsWith(q)).slice(0, limit);
  }
  const starts: Species[] = [];
  const contains: Species[] = [];
  for (const s of PICKABLE) {
    const name = stripAccents(s.name.toLowerCase());
    if (name.startsWith(q)) starts.push(s);
    else if (name.includes(q)) contains.push(s);
  }
  return [...starts, ...contains].slice(0, limit);
}

/**
 * El primer ancestro de la familia evolutiva de una especie (subiendo por
 * `parent`). "Cargados de esta línea" agrupa por este id: un Mudkip, un
 * Marshtomp y un Swampert cargados por separado son la misma línea.
 */
export function familyRootOf(id: string): string {
  let cur = getSpecies(id);
  let rootId = id;
  const seen = new Set<string>();
  while (cur?.parent && !seen.has(cur.parent)) {
    seen.add(cur.parent);
    rootId = cur.parent;
    cur = getSpecies(cur.parent);
  }
  return rootId;
}

/** La especie anterior y siguiente en orden de pokédex, dentro de las elegibles (sin Shadow ni Mega). */
export function adjacentSpecies(id: string): { prev: Species | null; next: Species | null } {
  const i = PICKABLE.findIndex((s) => s.id === id);
  if (i === -1) return { prev: null, next: null };
  return { prev: PICKABLE[i - 1] ?? null, next: PICKABLE[i + 1] ?? null };
}
