// Caramelos, caramelos XL y polvo estelar: subir de nivel, evolucionar y
// desbloquear el segundo ataque cargado. Tablas del game master de Niantic.

import { COSTS, getSpecies, type Species } from "./data";

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

export function levelCost(from: number, to: number, shadow: boolean, maxLevel: number): LevelCost {
  const cap = Math.min(powerUpCap(maxLevel), COSTS.maxPowerUpLevel);
  const end = Math.min(to, cap);
  let candy = 0;
  let xl = 0;
  let dust = 0;
  const cm = shadow ? COSTS.shadowCandy : 1;
  const dm = shadow ? COSTS.shadowDust : 1;
  for (let lvl = from; lvl < end; lvl += 0.5) {
    const whole = Math.floor(lvl);
    if (whole < COSTS.xlFromLevel) candy += Math.ceil((COSTS.candy[whole - 1] ?? 0) * cm);
    else xl += Math.ceil((COSTS.xlCandy[whole - COSTS.xlFromLevel] ?? 0) * cm);
    dust += Math.ceil((COSTS.stardust[whole - 1] ?? 0) * dm);
  }
  return { candy, xl, dust, needsBuddy: to > cap };
}

/** Caramelos para evolucionar a lo largo de un camino de ids; null si falta algún dato. */
export function evolveCost(path: string[]): number | null {
  let total = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const c = getSpecies(path[i])?.evolveCandy[path[i + 1]];
    if (c === undefined) return null;
    total += c;
  }
  return total;
}

export interface ThirdMoveCost {
  candy: number | null;
  dust: number | null;
}

/** Segundo ataque cargado de la especie final; las Shadow pagan 1.2 veces. */
export function thirdMoveCost(target: Species, shadow: boolean): ThirdMoveCost | null {
  if (!target.third) return null;
  const cm = shadow ? COSTS.shadowCandy : 1;
  const dm = shadow ? COSTS.shadowDust : 1;
  return {
    candy: target.third.candy === null ? null : Math.ceil(target.third.candy * cm),
    dust: target.third.dust === null ? null : Math.ceil(target.third.dust * dm),
  };
}
