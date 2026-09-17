// Tabla de efectividad de tipos y utilidades de tipo para Pokémon GO.
// Multiplicadores oficiales de Pokémon GO: x1.6 súper efectivo, x0.625 poco
// efectivo (resistido), x1 neutral. Un "doble" súper efectivo da x2.56, un
// doble resistido da x0.390625.

export const TYPES = [
  "normal",
  "fighting",
  "flying",
  "poison",
  "ground",
  "rock",
  "bug",
  "ghost",
  "steel",
  "fire",
  "water",
  "grass",
  "electric",
  "psychic",
  "ice",
  "dragon",
  "dark",
  "fairy",
] as const;

export type PokemonType = (typeof TYPES)[number];

const SUPER_EFFECTIVE = 1.6;
const NOT_VERY_EFFECTIVE = 0.625;
const NEUTRAL = 1;

// EFFECTIVENESS[attackType][defenderType] = multiplicador
// Basado en la tabla de tipos de Pokémon GO (idéntica a la de los juegos
// principales salvo por los valores numéricos x1.6 / x0.625 en vez de x2 / x0.5).
const EFFECTIVENESS: Record<PokemonType, Partial<Record<PokemonType, number>>> = {
  normal: { rock: NOT_VERY_EFFECTIVE, ghost: 0.390625, steel: NOT_VERY_EFFECTIVE },
  fighting: {
    normal: SUPER_EFFECTIVE,
    flying: NOT_VERY_EFFECTIVE,
    poison: NOT_VERY_EFFECTIVE,
    rock: SUPER_EFFECTIVE,
    bug: NOT_VERY_EFFECTIVE,
    ghost: 0.390625,
    steel: SUPER_EFFECTIVE,
    psychic: NOT_VERY_EFFECTIVE,
    ice: SUPER_EFFECTIVE,
    dark: SUPER_EFFECTIVE,
    fairy: NOT_VERY_EFFECTIVE,
  },
  flying: {
    fighting: SUPER_EFFECTIVE,
    rock: NOT_VERY_EFFECTIVE,
    bug: SUPER_EFFECTIVE,
    steel: NOT_VERY_EFFECTIVE,
    grass: SUPER_EFFECTIVE,
    electric: NOT_VERY_EFFECTIVE,
  },
  poison: {
    poison: NOT_VERY_EFFECTIVE,
    ground: NOT_VERY_EFFECTIVE,
    rock: NOT_VERY_EFFECTIVE,
    ghost: NOT_VERY_EFFECTIVE,
    steel: 0.390625,
    grass: SUPER_EFFECTIVE,
    fairy: SUPER_EFFECTIVE,
  },
  ground: {
    flying: 0.390625,
    poison: SUPER_EFFECTIVE,
    rock: SUPER_EFFECTIVE,
    bug: NOT_VERY_EFFECTIVE,
    steel: SUPER_EFFECTIVE,
    fire: SUPER_EFFECTIVE,
    grass: NOT_VERY_EFFECTIVE,
    electric: SUPER_EFFECTIVE,
  },
  rock: {
    fighting: NOT_VERY_EFFECTIVE,
    flying: SUPER_EFFECTIVE,
    ground: NOT_VERY_EFFECTIVE,
    bug: SUPER_EFFECTIVE,
    steel: NOT_VERY_EFFECTIVE,
    fire: SUPER_EFFECTIVE,
    ice: SUPER_EFFECTIVE,
  },
  bug: {
    fighting: NOT_VERY_EFFECTIVE,
    flying: NOT_VERY_EFFECTIVE,
    poison: NOT_VERY_EFFECTIVE,
    ghost: NOT_VERY_EFFECTIVE,
    steel: NOT_VERY_EFFECTIVE,
    fire: NOT_VERY_EFFECTIVE,
    grass: SUPER_EFFECTIVE,
    psychic: SUPER_EFFECTIVE,
    dark: SUPER_EFFECTIVE,
    fairy: NOT_VERY_EFFECTIVE,
  },
  ghost: {
    normal: 0.390625,
    ghost: SUPER_EFFECTIVE,
    psychic: SUPER_EFFECTIVE,
    dark: NOT_VERY_EFFECTIVE,
  },
  steel: {
    rock: SUPER_EFFECTIVE,
    steel: NOT_VERY_EFFECTIVE,
    fire: NOT_VERY_EFFECTIVE,
    water: NOT_VERY_EFFECTIVE,
    electric: NOT_VERY_EFFECTIVE,
    ice: SUPER_EFFECTIVE,
    fairy: SUPER_EFFECTIVE,
  },
  fire: {
    bug: SUPER_EFFECTIVE,
    steel: SUPER_EFFECTIVE,
    fire: NOT_VERY_EFFECTIVE,
    water: NOT_VERY_EFFECTIVE,
    grass: SUPER_EFFECTIVE,
    ice: SUPER_EFFECTIVE,
    rock: NOT_VERY_EFFECTIVE,
    dragon: NOT_VERY_EFFECTIVE,
  },
  water: {
    ground: SUPER_EFFECTIVE,
    rock: SUPER_EFFECTIVE,
    fire: SUPER_EFFECTIVE,
    water: NOT_VERY_EFFECTIVE,
    grass: NOT_VERY_EFFECTIVE,
    dragon: NOT_VERY_EFFECTIVE,
  },
  grass: {
    flying: NOT_VERY_EFFECTIVE,
    poison: NOT_VERY_EFFECTIVE,
    ground: SUPER_EFFECTIVE,
    bug: NOT_VERY_EFFECTIVE,
    steel: NOT_VERY_EFFECTIVE,
    fire: NOT_VERY_EFFECTIVE,
    water: SUPER_EFFECTIVE,
    grass: NOT_VERY_EFFECTIVE,
    dragon: NOT_VERY_EFFECTIVE,
  },
  electric: {
    flying: SUPER_EFFECTIVE,
    ground: 0.390625,
    water: SUPER_EFFECTIVE,
    grass: NOT_VERY_EFFECTIVE,
    electric: NOT_VERY_EFFECTIVE,
    dragon: NOT_VERY_EFFECTIVE,
  },
  psychic: {
    fighting: SUPER_EFFECTIVE,
    poison: SUPER_EFFECTIVE,
    steel: NOT_VERY_EFFECTIVE,
    psychic: NOT_VERY_EFFECTIVE,
    dark: 0.390625,
  },
  ice: {
    flying: SUPER_EFFECTIVE,
    ground: SUPER_EFFECTIVE,
    steel: NOT_VERY_EFFECTIVE,
    fire: NOT_VERY_EFFECTIVE,
    water: NOT_VERY_EFFECTIVE,
    grass: SUPER_EFFECTIVE,
    ice: NOT_VERY_EFFECTIVE,
    dragon: SUPER_EFFECTIVE,
  },
  dragon: {
    steel: NOT_VERY_EFFECTIVE,
    dragon: SUPER_EFFECTIVE,
    fairy: 0.390625,
  },
  dark: {
    fighting: NOT_VERY_EFFECTIVE,
    ghost: SUPER_EFFECTIVE,
    psychic: SUPER_EFFECTIVE,
    dark: NOT_VERY_EFFECTIVE,
    fairy: NOT_VERY_EFFECTIVE,
  },
  fairy: {
    fighting: SUPER_EFFECTIVE,
    poison: NOT_VERY_EFFECTIVE,
    steel: NOT_VERY_EFFECTIVE,
    fire: NOT_VERY_EFFECTIVE,
    dragon: SUPER_EFFECTIVE,
    dark: SUPER_EFFECTIVE,
  },
};

/** Tipos válidos de un Pokémon: filtra "none" y valores nulos/indefinidos. */
export function normalizeTypes(
  types: readonly (string | null | undefined)[]
): PokemonType[] {
  return types.filter(
    (t): t is PokemonType => !!t && t !== "none" && TYPES.includes(t as PokemonType)
  );
}

/**
 * Multiplicador de daño de un ataque de `attackType` contra un defensor con
 * `defenderTypes` (1 o 2 tipos). Es el producto de la efectividad contra cada
 * tipo del defensor.
 */
export function effectiveness(
  attackType: string,
  defenderTypes: readonly (string | null | undefined)[]
): number {
  const table = EFFECTIVENESS[attackType as PokemonType];
  const defenders = normalizeTypes(defenderTypes);
  if (!table || defenders.length === 0) return NEUTRAL;
  return defenders.reduce((mult, defType) => {
    const m = table[defType];
    return mult * (m ?? NEUTRAL);
  }, 1);
}

export interface TypeMatchup {
  type: PokemonType;
  multiplier: number;
}

/** Tipos que pegan súper efectivo (x1.6 o más) contra `defenderTypes`, de mayor a menor. */
export function weaknesses(
  defenderTypes: readonly (string | null | undefined)[]
): TypeMatchup[] {
  const result: TypeMatchup[] = [];
  for (const atk of TYPES) {
    const mult = effectiveness(atk, defenderTypes);
    if (mult >= SUPER_EFFECTIVE) result.push({ type: atk, multiplier: mult });
  }
  return result.sort((a, b) => b.multiplier - a.multiplier);
}

/** Tipos resistidos (x0.625 o menos) por `defenderTypes`, de menor a mayor multiplicador. */
export function resistances(
  defenderTypes: readonly (string | null | undefined)[]
): TypeMatchup[] {
  const result: TypeMatchup[] = [];
  for (const atk of TYPES) {
    const mult = effectiveness(atk, defenderTypes);
    if (mult <= NOT_VERY_EFFECTIVE) result.push({ type: atk, multiplier: mult });
  }
  return result.sort((a, b) => a.multiplier - b.multiplier);
}

export const STAB_MULTIPLIER = 1.2;

/** Colores oficiales de tipo de Pokémon GO/juegos principales, para chips y botones. */
export const TYPE_COLORS: Record<PokemonType, string> = {
  normal: "#A8A77A",
  fighting: "#C22E28",
  flying: "#A98FF3",
  poison: "#A33EA1",
  ground: "#E2BF65",
  rock: "#B6A136",
  bug: "#A6B91A",
  ghost: "#735797",
  steel: "#B7B7CE",
  fire: "#EE8130",
  water: "#6390F0",
  grass: "#7AC74C",
  electric: "#F7D02C",
  psychic: "#F95587",
  ice: "#96D9D6",
  dragon: "#6F35FC",
  dark: "#705746",
  fairy: "#D685AD",
};
