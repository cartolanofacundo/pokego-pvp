// CP, niveles y producto de estadísticas con las fórmulas del juego.

import { COSTS } from "./data";

export interface BaseStats {
  atk: number;
  def: number;
  sta: number;
}

export interface Ivs {
  atk: number;
  def: number;
  sta: number;
}

/** Niveles válidos: del 1 al 51 en medios niveles (el 51 es con mejor amigo). */
export const MIN_LEVEL = 1;
export const MAX_LEVEL = 51;

export function cpmAt(level: number): number {
  return COSTS.cpm[Math.round((level - 1) * 2)];
}

export function cpAt(base: BaseStats, iv: Ivs, level: number): number {
  const m = cpmAt(level);
  const cp = Math.floor(((base.atk + iv.atk) * Math.sqrt(base.def + iv.def) * Math.sqrt(base.sta + iv.sta) * m * m) / 10);
  return Math.max(10, cp);
}

/** Estadísticas efectivas y producto (ataque × defensa × vida entera). */
export function statsAt(base: BaseStats, iv: Ivs, level: number) {
  const m = cpmAt(level);
  const atk = (base.atk + iv.atk) * m;
  const def = (base.def + iv.def) * m;
  const hp = Math.floor((base.sta + iv.sta) * m);
  return { atk, def, hp, product: atk * def * hp };
}

/** Niveles (de menor a mayor) en los que esos IV dan exactamente ese CP. */
export function levelsForCp(base: BaseStats, iv: Ivs, cp: number): number[] {
  const out: number[] = [];
  for (let lvl = MIN_LEVEL; lvl <= MAX_LEVEL; lvl += 0.5) {
    const c = cpAt(base, iv, lvl);
    if (c === cp) out.push(lvl);
    if (c > cp) break;
  }
  return out;
}

export function formatLevel(level: number): string {
  return Number.isInteger(level) ? String(level) : level.toFixed(1);
}
