// Cruza un Pokémon cargado con cada forma a la que puede llegar (él mismo,
// sus evoluciones y sus Megas) y cada liga: rango de IV, puesto de la especie
// en PvPoke y lo que cuesta llegar.

import {
  CAP_LEAGUES,
  RANKER_LEAGUES,
  getSpecies,
  pvpokeRankForVariant,
  type RankerLeague,
  type RankerLeagueKey,
  type Species,
  type Variant,
} from "./data";
import { rankOf, type RankRow, type RankSettings } from "./ivrank";
import { evolveCost, levelCost, megaEnergyCost, thirdMoveCost, type LevelCost, type ThirdMoveCost } from "./costs";
import { formatLevel } from "./cp";

export interface BoxEntry {
  id: string;
  speciesId: string;
  atk: number;
  def: number;
  sta: number;
  cp: number;
  level: number;
  variant: Variant;
  /** Suertudo: nunca junto con Oscuro. */
  lucky: boolean;
  addedAt: number;
}

export interface Target {
  species: Species;
  /** Ids desde la especie cargada hasta esta forma (sin la Mega, que no es evolución). */
  path: string[];
  isMega: boolean;
}

/** La especie, cada evolución (en orden de profundidad) y las Megas de cada una. */
export function targetsOf(src: Species): Target[] {
  const out: Target[] = [];
  const visit = (s: Species, path: string[]) => {
    out.push({ species: s, path, isMega: false });
    for (const megaId of s.megas) {
      const mega = getSpecies(megaId);
      if (mega) out.push({ species: mega, path, isMega: true });
    }
    for (const next of s.evolutions) {
      const n = getSpecies(next);
      if (n && !path.includes(next)) visit(n, [...path, next]);
    }
  };
  visit(src, [src.id]);
  return out;
}

export type CellKind = "rank" | "excluded" | "short" | "over";

export interface Cell {
  league: RankerLeague;
  kind: CellKind;
  row: RankRow | null;
  level: LevelCost | null;
  pvpoke: number | null;
  /** Solo se marca en el rango más bajo de toda la grilla del detalle. */
  best: boolean;
  /** Texto de la celda "No entra" / "No llega" / "Te pasaste". */
  note: string | null;
}

function formatCp(n: number): string {
  return n.toLocaleString("es-AR");
}

function cellFor(entry: BoxEntry, target: Target, league: RankerLeague, pvpokeKey: RankerLeagueKey, settings: RankSettings): Cell {
  const pvpoke = pvpokeRankForVariant(target.species.id, entry.variant, pvpokeKey);

  if (league.key === "little" && !target.species.littleEligible) {
    return { league, kind: "excluded", row: null, level: null, pvpoke, best: false, note: "La Little es solo para Pokémon sin evolucionar." };
  }

  const row = rankOf(target.species, entry, league.cap, settings);
  if (!row) {
    return { league, kind: "excluded", row: null, level: null, pvpoke, best: false, note: "Ningún nivel entra en esta liga." };
  }

  if (entry.level > row.level) {
    return {
      league,
      kind: "over",
      row,
      level: null,
      pvpoke,
      best: false,
      note: `Rinde en nivel ${formatLevel(row.level)} y ya está en ${formatLevel(entry.level)}. Los niveles no se bajan.`,
    };
  }

  // "No llega": ni con el nivel máximo elegido esta forma alcanza el tope de
  // la liga. Cuando pasa, pasa para las 4.096 combinaciones de esa especie
  // por igual: si la mejor IV posible no llega, ninguna llega.
  if (Number.isFinite(league.cap) && row.level === settings.maxLevel && row.cp < league.cap) {
    return {
      league,
      kind: "short",
      row,
      level: null,
      pvpoke,
      best: false,
      note: `Tope ${formatCp(row.cp)} PC en nivel ${formatLevel(row.level)}. No alcanza los ${formatCp(league.cap)}.`,
    };
  }

  return {
    league,
    kind: "rank",
    row,
    level: levelCost(entry.level, row.level, entry.variant, entry.lucky, settings.maxLevel),
    pvpoke,
    best: false,
    note: null,
  };
}

export interface TargetResult {
  target: Target;
  /** true en la forma que el usuario cargó (ni evolucionada ni Mega). */
  isCurrent: boolean;
  cells: Cell[];
  evolveCandy: number | null;
  megaEnergy: number | null;
  third: ThirdMoveCost | null;
}

/** Grilla del detalle: una fila por forma, una columna por tope de CP (Little, Great, Ultra, Master). */
export function analyzeEntry(entry: BoxEntry, settings: RankSettings): TargetResult[] {
  const src = getSpecies(entry.speciesId);
  if (!src) return [];
  const results: TargetResult[] = targetsOf(src).map((target) => {
    const baseId = target.path[target.path.length - 1];
    return {
      target,
      isCurrent: !target.isMega && target.path.length === 1,
      // Para una Mega, el puesto de PvPoke sale de la liga Mega con el mismo tope.
      cells: CAP_LEAGUES.map((l) => {
        const megaKey = RANKER_LEAGUES.find((m) => m.mega && m.cap === l.cap)?.key;
        return cellFor(entry, target, l, target.isMega && megaKey ? megaKey : l.key, settings);
      }),
      evolveCandy: target.path.length > 1 ? evolveCost(target.path, entry.variant) : null,
      megaEnergy: target.isMega ? megaEnergyCost(getSpecies(baseId)!, target.species.id) : null,
      third: thirdMoveCost(target.species, entry.variant, entry.lucky),
    };
  });

  // MEJOR: el rango más bajo de toda la grilla. Dos ligas distintas pueden
  // compartir el mismo número de rango (cada una compara contra sus propias
  // 4.096 combinaciones, no entre sí); en ese empate gana la de mayor tope de
  // CP, porque rendir igual de bien en una liga más grande pesa más.
  let best: Cell | null = null;
  for (const r of results) {
    for (const c of r.cells) {
      if (c.kind !== "rank" || !c.row) continue;
      if (!best || c.row.rank < best.row!.rank || (c.row.rank === best.row!.rank && c.league.cap > best.league.cap)) {
        best = c;
      }
    }
  }
  if (best) best.best = true;

  return results;
}

export interface DexRow {
  entry: BoxEntry;
  target: Target;
  cell: Cell;
  evolveCandy: number | null;
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
      if (cell.kind !== "rank" || !cell.row || cell.row.rank > DEX_MAX_RANK) continue;
      rows.push({
        entry,
        target,
        cell,
        evolveCandy: target.path.length > 1 ? evolveCost(target.path, entry.variant) : null,
        third: thirdMoveCost(target.species, entry.variant, entry.lucky),
      });
    }
  }
  return rows.sort(
    (a, b) =>
      (a.cell.pvpoke ?? Infinity) - (b.cell.pvpoke ?? Infinity) ||
      a.cell.row!.rank - b.cell.row!.rank ||
      a.target.species.dex - b.target.species.dex
  );
}

export interface BestRank {
  rank: number;
  league: RankerLeague;
  species: Species;
  pvpoke: number | null;
}

/** El mejor rango de un cargado entre todas sus formas, en la liga dada o en todas (sin Megas fuera de sus ligas Mega). */
export function bestRankOf(entry: BoxEntry, settings: RankSettings, onlyLeague?: RankerLeagueKey): BestRank | null {
  const src = getSpecies(entry.speciesId);
  if (!src) return null;
  const leagues = onlyLeague ? RANKER_LEAGUES.filter((l) => l.key === onlyLeague) : RANKER_LEAGUES;
  let best: BestRank | null = null;
  for (const target of targetsOf(src)) {
    for (const league of leagues) {
      if (target.isMega !== league.mega) continue;
      const cell = cellFor(entry, target, league, league.key, settings);
      if (
        cell.kind === "rank" &&
        cell.row &&
        (!best || cell.row.rank < best.rank || (cell.row.rank === best.rank && league.cap > best.league.cap))
      ) {
        best = { rank: cell.row.rank, league, species: target.species, pvpoke: cell.pvpoke };
      }
    }
  }
  return best;
}

/** true si el cargado sirve (rango 100 o mejor) en alguna liga, en cualquiera de sus formas. */
export function servesAnyLeague(entry: BoxEntry, settings: RankSettings): boolean {
  const best = bestRankOf(entry, settings);
  return best !== null && best.rank <= DEX_MAX_RANK;
}

/** true si el cargado sirve (rango 100 o mejor) en esa liga puntual, en cualquiera de sus formas. */
export function servesLeague(entry: BoxEntry, settings: RankSettings, league: RankerLeagueKey): boolean {
  const best = bestRankOf(entry, settings, league);
  return best !== null && best.rank <= DEX_MAX_RANK;
}
