// Caramelos, caramelos XL y polvo estelar: subir de nivel, evolucionar,
// megaevolucionar y desbloquear el tercer ataque. Tablas del game master de
// Niantic. El rango de IV no cambia con ninguna variante: la tabla de 4.096
// combinaciones es la misma para un Normal, un Oscuro o un Purificado. Lo que
// cambia es el costo, y en el Oscuro además el puesto en PvPoke (usa el id
// `_shadow`, que suele rankear distinto que la forma normal).

import { COSTS, getSpecies, type Species, type Variant } from "./data";

export interface LevelCost {
  candy: number;
  xl: number;
  dust: number;
  /** El nivel pedido supera lo que se sube con caramelos: falta el +1 de mejor amigo. */
  needsBuddy: boolean;
}

/** Hasta qué nivel se sube con caramelos según el nivel máximo elegido (41 y 51 suman mejor amigo). */
export function powerUpCap(maxLevel: number): number {
  return maxLevel === 41 || maxLevel === 51 ? maxLevel - 1 : maxLevel;
}

/**
 * Multiplicadores de costo por variante. Un Oscuro paga 20 % más de todo; un
 * Purificado paga 10 % menos de todo. Suertudo, aparte, paga la mitad de
 * polvo nada más (nunca junto con Oscuro: no hay Oscuros Suertudos). Cada
 * multiplicador se aplica y redondea hacia arriba en cada subida por
 * separado, no sobre el total.
 */
export function costMultipliers(variant: Variant, lucky: boolean): { candy: number; dust: number } {
  const candy = variant === "shadow" ? COSTS.shadowCandy : variant === "purified" ? COSTS.purifiedCandy : 1;
  let dust = variant === "shadow" ? COSTS.shadowDust : variant === "purified" ? COSTS.purifiedDust : 1;
  if (lucky && variant !== "shadow") dust *= COSTS.luckyDust;
  return { candy, dust };
}

export function levelCost(from: number, to: number, variant: Variant, lucky: boolean, maxLevel: number): LevelCost {
  const cap = Math.min(powerUpCap(maxLevel), COSTS.maxPowerUpLevel);
  const end = Math.min(to, cap);
  const { candy: cm, dust: dm } = costMultipliers(variant, lucky);
  // Se suma primero el costo real (sin variante) y el multiplicador se
  // aplica una sola vez sobre el total, no en cada subida por separado:
  // aplicarlo por subida redondea hacia arriba en cada paso chico y termina
  // subiendo el total en vez de bajarlo para un Purificado.
  let candy = 0;
  let xl = 0;
  let dust = 0;
  for (let lvl = from; lvl < end; lvl += 0.5) {
    const whole = Math.floor(lvl);
    if (whole < COSTS.xlFromLevel) candy += COSTS.candy[whole - 1] ?? 0;
    else xl += COSTS.xlCandy[whole - COSTS.xlFromLevel] ?? 0;
    dust += COSTS.stardust[whole - 1] ?? 0;
  }
  return {
    candy: Math.ceil(candy * cm),
    xl: Math.ceil(xl * cm),
    dust: Math.ceil(dust * dm),
    needsBuddy: to > cap,
  };
}

/**
 * Caramelos para evolucionar a lo largo de un camino de ids. Un Purificado
 * usa el costo propio que publica Niantic (más bajo); un Oscuro paga lo
 * mismo que un Normal, porque evolucionar un Shadow no tiene premio. null si
 * falta el dato para algún paso.
 */
export function evolveCost(path: string[], variant: Variant = "normal"): number | null {
  let total = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const from = getSpecies(path[i]);
    const table = variant === "purified" ? from?.evolveCandyPurified : from?.evolveCandy;
    const c = table?.[path[i + 1]] ?? from?.evolveCandy[path[i + 1]];
    if (c === undefined) return null;
    total += c;
  }
  return total;
}

/** Energía para la primera Megaevolución hacia esa forma; null si no está publicada. */
export function megaEnergyCost(base: Species, megaId: string): number | null {
  return base.megaEnergy[megaId] ?? null;
}

export interface ThirdMoveCost {
  candy: number | null;
  dust: number | null;
}

/** Tercer ataque de la especie final, con el multiplicador de la variante. */
export function thirdMoveCost(target: Species, variant: Variant, lucky: boolean): ThirdMoveCost | null {
  if (!target.third) return null;
  const { candy: cm, dust: dm } = costMultipliers(variant, lucky);
  return {
    candy: target.third.candy === null ? null : Math.ceil(target.third.candy * cm),
    dust: target.third.dust === null ? null : Math.ceil(target.third.dust * dm),
  };
}

/** IV resultante de purificar: +2 a cada estadística, con tope 15. */
export function purifiedIvs(iv: { atk: number; def: number; sta: number }) {
  return {
    atk: Math.min(15, iv.atk + 2),
    def: Math.min(15, iv.def + 2),
    sta: Math.min(15, iv.sta + 2),
  };
}
