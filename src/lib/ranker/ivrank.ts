// Rango de IV para PvP, con el mismo criterio que el Rank Checker de Stadium
// Gaming (leído de su código y verificado contra sus números): para cada una
// de las 4096 combinaciones se busca el nivel más alto que no pasa el tope de
// CP de la liga, se calcula el producto de estadísticas a ese nivel y se
// ordena de mayor a menor; en empate va primero la de más suma de IV.

import { COSTS } from "./data";
import type { BaseStats, Ivs } from "./cp";

export interface RankSettings {
  /** Nivel máximo: 40, 41, 50 o 51 (41 y 51 son con mejor amigo). */
  maxLevel: number;
  /** IV mínimo de cada estadística (0 salvaje, 1 bueno, 2 gran, 3 ultra, 4 mejor amigo o clima, 5 afortunado, 10 incursión, 12 afortunado de mejor amigo...). */
  minIv: number;
}

export interface RankRow {
  atk: number;
  def: number;
  sta: number;
  level: number;
  cp: number;
  product: number;
  rank: number;
  /** Producto relativo al rango 1, en porcentaje. */
  pct: number;
}

export interface RankTable {
  rows: RankRow[];
  byIv: Map<number, RankRow>;
  total: number;
}

const ivKey = (a: number, d: number, s: number) => (a << 8) | (d << 4) | s;

const cache = new Map<string, RankTable | null>();

/**
 * Tabla de rangos de una especie para un tope de CP. Devuelve null si ninguna
 * combinación entra ni al nivel 1 (por ejemplo, Mewtwo en Little League).
 * Se cachea por estadísticas base: una Shadow comparte tabla con su normal.
 */
export function rankTable(base: BaseStats, cap: number, settings: RankSettings): RankTable | null {
  const key = `${base.atk}/${base.def}/${base.sta}|${cap}|${settings.maxLevel}|${settings.minIv}`;
  if (cache.has(key)) return cache.get(key)!;

  const maxIdx = Math.round((settings.maxLevel - 1) * 2);
  const cpm2 = COSTS.cpm.slice(0, maxIdx + 1).map((m) => m * m);
  const rows: Omit<RankRow, "rank" | "pct">[] = [];

  for (let a = settings.minIv; a <= 15; a++) {
    for (let d = settings.minIv; d <= 15; d++) {
      const sqD = Math.sqrt(base.def + d);
      for (let s = settings.minIv; s <= 15; s++) {
        const k = ((base.atk + a) * sqD * Math.sqrt(base.sta + s)) / 10;
        const cpOf = (i: number) => Math.max(10, Math.floor(k * cpm2[i]));
        let idx: number;
        if (!Number.isFinite(cap) || cpOf(maxIdx) <= cap) {
          idx = maxIdx;
        } else if (cpOf(0) > cap) {
          continue;
        } else {
          // El CP crece con el nivel: búsqueda binaria del último nivel que entra.
          let lo = 0;
          let hi = maxIdx;
          while (lo < hi) {
            const mid = (lo + hi + 1) >> 1;
            if (cpOf(mid) <= cap) lo = mid;
            else hi = mid - 1;
          }
          idx = lo;
        }
        const m = COSTS.cpm[idx];
        // Misma expresión y mismo orden de operaciones que Stadium: en coma
        // flotante, otro orden cambia qué combinaciones quedan empatadas.
        const product = m * m * (base.atk + a) * (base.def + d) * Math.floor(m * (base.sta + s));
        rows.push({ atk: a, def: d, sta: s, level: 1 + idx / 2, cp: cpOf(idx), product });
      }
    }
  }

  if (!rows.length) {
    cache.set(key, null);
    return null;
  }

  // Comparador de Stadium tal cual: producto de mayor a menor y, si es
  // idéntico, primero la de más suma de IV. Con la misma suma devuelve -1
  // igual que el suyo, así el desempate final lo decide el mismo algoritmo
  // de ordenamiento del navegador sobre el mismo orden de entrada.
  const ivSum = (r: { atk: number; def: number; sta: number }) => r.atk + r.def + r.sta;
  rows.sort((x, y) =>
    x.product === y.product ? (ivSum(x) < ivSum(y) ? 1 : -1) : x.product < y.product ? 1 : -1
  );
  const top = rows[0].product;
  const ranked: RankRow[] = rows.map((r, i) => ({ ...r, rank: i + 1, pct: (r.product / top) * 100 }));
  const table: RankTable = {
    rows: ranked,
    byIv: new Map(ranked.map((r) => [ivKey(r.atk, r.def, r.sta), r])),
    total: ranked.length,
  };
  cache.set(key, table);
  return table;
}

/** Fila de rango de unos IV concretos, o null si esos IV no entran en esa liga. */
export function rankOf(base: BaseStats, iv: Ivs, cap: number, settings: RankSettings): RankRow | null {
  return rankTable(base, cap, settings)?.byIv.get(ivKey(iv.atk, iv.def, iv.sta)) ?? null;
}
