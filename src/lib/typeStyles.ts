// Chips de tipo: fondo y color de texto por tipo, copiados del sistema visual
// (Sistema.dc.html, sección "CHIPS DE TIPO"). Los cinco tipos que el diseño
// no dibuja (normal, bicho, fantasma, psíquico, siniestro) siguen la misma
// receta: fondo al 18–26 % del color del tipo, texto pastel del mismo tono.

export interface TypeStyle {
  bg: string;
  fg: string;
}

export const TYPE_STYLES: Record<string, TypeStyle> = {
  water: { bg: "rgba(75,143,224,0.20)", fg: "#93C2F5" },
  fire: { bg: "rgba(232,114,75,0.18)", fg: "#F5A184" },
  grass: { bg: "rgba(95,187,90,0.18)", fg: "#96DB92" },
  electric: { bg: "rgba(232,195,65,0.18)", fg: "#F2D874" },
  ice: { bg: "rgba(111,201,216,0.18)", fg: "#A5E4EF" },
  fighting: { bg: "rgba(208,84,63,0.20)", fg: "#F09A86" },
  poison: { bg: "rgba(169,107,196,0.20)", fg: "#D0A6E6" },
  ground: { bg: "rgba(201,162,75,0.18)", fg: "#E3C88A" },
  flying: { bg: "rgba(143,168,224,0.18)", fg: "#BBCCF2" },
  fairy: { bg: "rgba(228,138,192,0.20)", fg: "#F3B2D8" },
  rock: { bg: "rgba(184,160,92,0.18)", fg: "#DCC894" },
  steel: { bg: "rgba(160,174,186,0.18)", fg: "#CCD6DE" },
  dragon: { bg: "rgba(111,91,208,0.24)", fg: "#B5A8F0" },
  // No dibujados en el sistema visual: derivados con la misma receta.
  normal: { bg: "rgba(168,167,122,0.20)", fg: "#D6D5B8" },
  bug: { bg: "rgba(166,185,26,0.18)", fg: "#CFE07A" },
  ghost: { bg: "rgba(115,87,151,0.24)", fg: "#C3AEE0" },
  psychic: { bg: "rgba(249,85,135,0.18)", fg: "#F9A3BE" },
  dark: { bg: "rgba(112,87,70,0.26)", fg: "#C9B3A6" },
};

export function typeStyle(type: string): TypeStyle {
  return TYPE_STYLES[type] ?? { bg: "rgba(255,255,255,0.08)", fg: "#C9CFD8" };
}
