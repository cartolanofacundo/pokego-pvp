// "Borrar los que no sirven": decide qué entradas de la caja se van, según el
// alcance elegido, y si alguna de las que se borran igual sirve en otra liga.

import { bestRankOf, servesAnyLeague, servesLeague, type BoxEntry } from "./analysis";
import type { RankerSettings } from "./box";
import type { RankerLeagueKey } from "./data";

/** "any": no sirve en ninguna liga. Una liga puntual: no sirve en esa, aunque sirva en otra. */
export type CleanupScope = "any" | RankerLeagueKey;

export interface CleanupPlan {
  scope: CleanupScope;
  toDelete: BoxEntry[];
  toKeep: BoxEntry[];
  /** De los que se borran, cuántos igual sirven en alguna otra liga (solo tiene sentido con una liga puntual). */
  servesElsewhere: number;
}

export function planCleanup(entries: BoxEntry[], settings: RankerSettings, scope: CleanupScope): CleanupPlan {
  const toDelete: BoxEntry[] = [];
  const toKeep: BoxEntry[] = [];
  let servesElsewhere = 0;
  for (const entry of entries) {
    const serves = scope === "any" ? servesAnyLeague(entry, settings) : servesLeague(entry, settings, scope);
    if (serves) {
      toKeep.push(entry);
    } else {
      toDelete.push(entry);
      if (scope !== "any" && servesAnyLeague(entry, settings)) servesElsewhere++;
    }
  }
  return { scope, toDelete, toKeep, servesElsewhere };
}

export { bestRankOf };
