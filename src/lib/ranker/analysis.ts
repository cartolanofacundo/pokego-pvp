// Cruza un Pokémon cargado con cada forma a la que puede llegar (él mismo,
// sus evoluciones y sus Megas) y cada liga: rango de IV, puesto de la especie
// en PvPoke y lo que cuesta llegar.

import { CAP_LEAGUES, RANKER_LEAGUES, getSpecies, pvpokeRank, type RankerLeague, type RankerLeagueKey, type Species } from "./data";
import { rankOf, type RankRow, type RankSettings } from "./ivrank";
import { evolveCost, levelCost, thirdMoveCost, type LevelCost, type ThirdMoveCost } from "./costs";

export interface BoxEntry {
  id: string;
  speciesId: string;
  atk: number;
  def: number;
  sta: number;
  cp: number;
  level: number;
  addedAt: number;
}

export interface Target {
  species: Species;
  /** Ids desde la especie cargada hasta esta forma (sin la Mega, que no es evolución). */
  path: string[];
  isMega: boolean;
  evolveCandy: number | null;
}

/** La especie, cada evolución (en orden de profundidad) y las Megas de cada una. */
export function targetsOf(src: Species): Target[] {
  const out: Target[] = [];
  const visit = (s: Species, path: string[]) => {
    out.push({ species: s, path, isMega: false, evolveCandy: evolveCost(path) });
    for (const megaId of s.megas) {
      const mega = getSpecies(megaId);
      if (mega) out.push({ species: mega, path, isMega: true, evolveCandy: evolveCost(path) });
    }
    for (const next of s.evolutions) {
      const n = getSpecies(next);
      if (n && !path.includes(next)) visit(n, [...path, next]);
    }
  };
  visit(src, [src.id]);
  return out;
}

export interface Cell {
  league: RankerLeague;
  row: RankRow | null;
  /** Ya está por encima del nivel que necesita esa liga: no se puede bajar. */
  overLevel: boolean;
  level: LevelCost | null;
  pvpoke: number | null;
}

export interface TargetResult {
  target: Target;
  cells: Cell[];
  third: ThirdMoveCost | null;
}

function cellFor(entry: BoxEntry, target: Target, league: RankerLeague, pvpokeKey: RankerLeagueKey, settings: RankSettings): Cell {
  const row = rankOf(target.species, entry, league.cap, settings);
  const overLevel = row !== null && entry.level > row.level;
  return {
    league,
    row,
    overLevel,
    level: row && !overLevel ? levelCost(entry.level, row.level, target.species.shadow, settings.maxLevel) : null,
    pvpoke: pvpokeRank(target.species.id, pvpokeKey),
  };
}

/** Grilla del detalle: una fila por forma, una columna por tope de CP (Little, Great, Ultra, Master). */
export function analyzeEntry(entry: BoxEntry, settings: RankSettings): TargetResult[] {
  const src = getSpecies(entry.speciesId);
  if (!src) return [];
  return targetsOf(src).map((target) => ({
    target,
    // Para una Mega, el puesto de PvPoke sale de la liga Mega con el mismo tope.
    cells: CAP_LEAGUES.map((l) => {
      const megaKey = RANKER_LEAGUES.find((m) => m.mega && m.cap === l.cap)?.key;
      return cellFor(entry, target, l, target.isMega && megaKey ? megaKey : l.key, settings);
    }),
    third: thirdMoveCost(target.species, target.species.shadow),
  }));
}

export interface DexRow {
  entry: BoxEntry;
  target: Target;
  cell: Cell;
  third: ThirdMoveCost | null;
}

export const DEX_MAX_RANK = 100;

/**
 * Filas de la pokédex para una liga: cada combinación de Pokémon cargado y
 * forma legal con rango de IV de 100 o mejor, que todavía no se pasó de
 * nivel. Ordenadas por el puesto de la especie en PvPoke (sin puesto, al
 * final) y después por rango de IV.
 */
export function dexRows(entries: BoxEntry[], leagueKey: RankerLeagueKey, settings: RankSettings): DexRow[] {
  const league = RANKER_LEAGUES.find((l) => l.key === leagueKey)!;
  const rows: DexRow[] = [];
  for (const entry of entries) {
    const src = getSpecies(entry.speciesId);
    if (!src) continue;
    for (const target of targetsOf(src)) {
      if (target.isMega && !league.mega) continue;
      const cell = cellFor(entry, target, league, league.key, settings);
      if (!cell.row || cell.row.rank > DEX_MAX_RANK || cell.overLevel) continue;
      rows.push({ entry, target, cell, third: thirdMoveCost(target.species, target.species.shadow) });
    }
  }
  return rows.sort(
    (a, b) =>
      (a.cell.pvpoke ?? Infinity) - (b.cell.pvpoke ?? Infinity) ||
      a.cell.row!.rank - b.cell.row!.rank ||
      a.target.species.dex - b.target.species.dex
  );
}
