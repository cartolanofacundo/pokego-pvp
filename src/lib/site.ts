// Identidad del sitio para metadatos, JSON-LD, OG y llms.txt: todo sale de
// acá para cambiarlo en un solo lugar. La fecha de actualización se toma de
// los datos generados (scripts/build-ranker-data.mjs), no es una constante a mano.
import meta from "@/data/ranker/meta.json";

export const APP_NAME = "PokéGO PVP";

// Dominio real de GitHub Pages, con el subdirectorio del repo incluido. Es
// independiente del NEXT_PUBLIC_BASE_PATH de next.config.ts: ese solo importa
// para que los assets carguen bien en local vs. producción, pero las URLs
// canónicas/OG siempre apuntan a la producción real.
export const SITE_URL = "https://cartolanofacundo.github.io/pokego-pvp";

export const SITE_DESCRIPTION =
  "Herramienta gratis para Pokémon GO: stats de combate PvP en tiempo real en la compu y ranking de IV por liga (Little, Great, Ultra y Master). En español.";

export const APP_DESCRIPTION_SHORT =
  "Stats de combate PvP de Pokémon GO en tiempo real y ranking de IV por liga.";

// "2026-09-23 03:24:34" -> "2026-09-23".
export const DATA_UPDATED: string = (meta as { pvpokeGamemaster: string | null }).pvpokeGamemaster?.slice(0, 10) ?? "";

export function formatDateEs(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path}`;
}
