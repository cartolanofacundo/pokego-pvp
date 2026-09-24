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
  evolutions: string[];
  /** Caramelos para evolucionar a cada id de `evolutions` (falta si Niantic no lo publica). */
  evolveCandy: Record<string, number>;
  megas: string[];
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
}

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

function stripAccents(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

/** Búsqueda por nombre o número de pokédex, en orden de pokédex. */
export function searchSpecies(query: string, limit = 40): Species[] {
  const q = stripAccents(query.trim().toLowerCase());
  if (!q) return SPECIES.slice(0, limit);
  if (/^\d+$/.test(q)) {
    const n = Number(q);
    return SPECIES.filter((s) => s.dex === n || String(s.dex).startsWith(q)).slice(0, limit);
  }
  const starts: Species[] = [];
  const contains: Species[] = [];
  for (const s of SPECIES) {
    const name = stripAccents(s.name.toLowerCase());
    if (name.startsWith(q)) starts.push(s);
    else if (name.includes(q)) contains.push(s);
  }
  return [...starts, ...contains].slice(0, limit);
}
