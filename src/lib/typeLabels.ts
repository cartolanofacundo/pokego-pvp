export const TYPE_LABEL_ES: Record<string, string> = {
  normal: "Normal",
  fighting: "Lucha",
  flying: "Volador",
  poison: "Veneno",
  ground: "Tierra",
  rock: "Roca",
  bug: "Bicho",
  ghost: "Fantasma",
  steel: "Acero",
  fire: "Fuego",
  water: "Agua",
  grass: "Planta",
  electric: "Eléctrico",
  psychic: "Psíquico",
  ice: "Hielo",
  dragon: "Dragón",
  dark: "Siniestro",
  fairy: "Hada",
};

export function typeLabelEs(t: string): string {
  return TYPE_LABEL_ES[t] ?? t;
}
