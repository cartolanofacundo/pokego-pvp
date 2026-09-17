// Heurística de recomendación de ataques: poder x STAB x efectividad de tipo.
// No reemplaza el simulador de PvPoke (no lo tenemos, es estático), pero da
// una señal clara y explicable de con qué conviene atacar.

import { getMove, getPokemon, recommendedMoveset, type LeagueKey, type Pokemon } from "./data";
import { effectiveness, normalizeTypes, STAB_MULTIPLIER, type PokemonType } from "./types";

export type EffectTier = "double-super" | "super" | "neutral" | "resisted" | "double-resisted";

// Los multiplicadores posibles son discretos: 2.56, 1.6, 1, 0.625, 0.390625
// (producto de hasta dos factores x1.6/x1/x0.625). Los cortes van a mitad de
// camino entre cada par para no confundir 0.625 con 0.390625.
export function effectTier(mult: number): EffectTier {
  if (mult >= 2) return "double-super";
  if (mult >= 1.5) return "super";
  if (mult >= 0.9) return "neutral";
  if (mult >= 0.5) return "resisted";
  return "double-resisted";
}

export const EFFECT_SYMBOL: Record<EffectTier, string> = {
  "double-super": "▲▲",
  super: "▲",
  neutral: "●",
  resisted: "▼",
  "double-resisted": "▼▼",
};

export const EFFECT_LABEL: Record<EffectTier, string> = {
  "double-super": "Muy efectivo",
  super: "Efectivo",
  neutral: "Neutral",
  resisted: "Poco efectivo",
  "double-resisted": "Muy poco efectivo",
};

export interface MoveScore {
  moveId: string;
  name: string;
  type: string;
  power: number;
  energy: number;
  isFast: boolean;
  isStab: boolean;
  effectiveness: number;
  tier: EffectTier;
  score: number;
  /** Golpes rápidos necesarios para cargar este ataque (solo cargados). */
  hitsToCharge: number | null;
  /** Turnos (0.5s c/u) que tarda en cargarse usando el rápido dado. */
  turnsToCharge: number | null;
  reason: string;
}

function typeLabel(t: string): string {
  const labels: Record<string, string> = {
    normal: "normal",
    fighting: "lucha",
    flying: "volador",
    poison: "veneno",
    ground: "tierra",
    rock: "roca",
    bug: "bicho",
    ghost: "fantasma",
    steel: "acero",
    fire: "fuego",
    water: "agua",
    grass: "planta",
    electric: "eléctrico",
    psychic: "psíquico",
    ice: "hielo",
    dragon: "dragón",
    dark: "siniestro",
    fairy: "hada",
  };
  return labels[t] ?? t;
}

function scoreMove(
  moveId: string,
  isFast: boolean,
  attackerTypes: readonly (string | null | undefined)[],
  defenderTypes: readonly (string | null | undefined)[],
  fastMoveForCharge?: { energyGain: number; turns: number } | null
): MoveScore | null {
  const move = getMove(moveId);
  if (!move) return null;

  const attackerTypeSet = normalizeTypes(attackerTypes);
  const isStab = attackerTypeSet.includes(move.type as PokemonType);
  const mult = effectiveness(move.type, defenderTypes);
  const tier = effectTier(mult);
  const power = move.power ?? 0;
  const score = power * (isStab ? STAB_MULTIPLIER : 1) * mult;

  let hitsToCharge: number | null = null;
  let turnsToCharge: number | null = null;
  if (!isFast && fastMoveForCharge && fastMoveForCharge.energyGain > 0) {
    hitsToCharge = Math.ceil(move.energy / fastMoveForCharge.energyGain);
    turnsToCharge = hitsToCharge * fastMoveForCharge.turns;
  }

  const defTypeLabel = normalizeTypes(defenderTypes).map(typeLabel).join("/") || "normal";
  const stabTxt = isStab ? " (STAB)" : "";
  const reason = `${move.name}${stabTxt}: ${typeLabel(move.type)} ${EFFECT_SYMBOL[tier]} vs ${defTypeLabel}`;

  return {
    moveId,
    name: move.name,
    type: move.type,
    power,
    energy: move.energy,
    isFast,
    isStab,
    effectiveness: mult,
    tier,
    score,
    hitsToCharge,
    turnsToCharge,
    reason,
  };
}

export interface MovesetAnalysis {
  fast: MoveScore | null;
  charged: MoveScore[]; // ordenados: mejor score primero
  best: MoveScore | null; // mejor cargado (el que se resalta)
  otherFast: MoveScore[]; // resto del pool de rápidos, por uso
  otherCharged: MoveScore[]; // resto del pool de cargados, por uso
}

/**
 * Analiza el moveset recomendado por PvPoke de `attacker` en `league` contra
 * `defender`: puntúa cada ataque (poder x STAB x efectividad) y arma la lista
 * de alternativas restantes del pool completo, ordenadas por popularidad.
 */
export function analyzeMoveset(
  attacker: Pokemon,
  defender: Pokemon,
  league: LeagueKey
): MovesetAnalysis {
  const { fast: fastId, charged: chargedIds } = recommendedMoveset(attacker, league);

  const fast = fastId
    ? scoreMove(fastId, true, attacker.types, defender.types)
    : null;

  const fastMoveData = fast ? getMove(fast.moveId) : null;
  const fastForCharge = fastMoveData
    ? { energyGain: fastMoveData.energyGain, turns: fastMoveData.turns }
    : null;

  const charged = chargedIds
    .map((id) => scoreMove(id, false, attacker.types, defender.types, fastForCharge))
    .filter((m): m is MoveScore => m !== null)
    .sort((a, b) => b.score - a.score);

  const stats = attacker.leagues[league];
  const usedFast = new Set(fastId ? [fastId] : []);
  const usedCharged = new Set(chargedIds);

  const otherFast = attacker.fastMoves
    .filter((id) => !usedFast.has(id))
    .map((id) => scoreMove(id, true, attacker.types, defender.types))
    .filter((m): m is MoveScore => m !== null)
    .sort((a, b) => (stats?.fastUsage[b.moveId] ?? 0) - (stats?.fastUsage[a.moveId] ?? 0));

  const otherCharged = attacker.chargedMoves
    .filter((id) => !usedCharged.has(id))
    .map((id) => scoreMove(id, false, attacker.types, defender.types, fastForCharge))
    .filter((m): m is MoveScore => m !== null)
    .sort(
      (a, b) => (stats?.chargedUsage[b.moveId] ?? 0) - (stats?.chargedUsage[a.moveId] ?? 0)
    );

  return {
    fast,
    charged,
    best: charged[0] ?? null,
    otherFast,
    otherCharged,
  };
}

/** Ataques del rival que más me pegan (para el panel "Cuidado con"). */
export function topThreats(
  defender: Pokemon, // yo, quien recibe el daño
  attacker: Pokemon, // el rival, quien ataca
  league: LeagueKey
): MovesetAnalysis {
  return analyzeMoveset(attacker, defender, league);
}

export function getPokemonSafe(speciesId: string | null): Pokemon | null {
  if (!speciesId) return null;
  return getPokemon(speciesId) ?? null;
}
