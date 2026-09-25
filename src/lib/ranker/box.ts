// Tu caja de Pokémon cargados y los ajustes del rankeador. Todo vive en el
// localStorage de esta computadora hasta que lo exportás a un archivo.
// Importar reemplaza la caja entera.

import { loadJSON, saveJSON } from "@/lib/storage";
import { getSpecies, type Variant } from "./data";
import { levelsForCp } from "./cp";
import type { BoxEntry } from "./analysis";
import type { RankSettings } from "./ivrank";

export const BOX_KEY = "pokego-pvp:box:v2";
/** Clave vieja (sin variantes; las Shadow eran una especie aparte). Se migra sola al leer. */
const BOX_KEY_V1 = "pokego-pvp:box:v1";
export const RANKER_SETTINGS_KEY = "pokego-pvp:ranker:v1";

export interface RankerSettings extends RankSettings {
  showThirdMove: boolean;
}

export const DEFAULT_RANKER_SETTINGS: RankerSettings = { maxLevel: 50, minIv: 0, showThirdMove: true };
export const MAX_LEVEL_OPTIONS = [40, 41, 50, 51];
export const MIN_IV_OPTIONS = [0, 1, 2, 3, 4, 5, 10, 12];

export function loadSettings(): RankerSettings {
  const s = loadJSON<Partial<RankerSettings>>(RANKER_SETTINGS_KEY, {});
  return {
    maxLevel: MAX_LEVEL_OPTIONS.includes(s.maxLevel ?? -1) ? s.maxLevel! : DEFAULT_RANKER_SETTINGS.maxLevel,
    minIv: MIN_IV_OPTIONS.includes(s.minIv ?? -1) ? s.minIv! : DEFAULT_RANKER_SETTINGS.minIv,
    showThirdMove: typeof s.showThirdMove === "boolean" ? s.showThirdMove : DEFAULT_RANKER_SETTINGS.showThirdMove,
  };
}

export function saveSettings(s: RankerSettings) {
  saveJSON(RANKER_SETTINGS_KEY, s);
}

const isIv = (n: unknown) => Number.isInteger(n) && (n as number) >= 0 && (n as number) <= 15;
const VARIANTS: Variant[] = ["normal", "shadow", "purified"];

/**
 * Valida una entrada leída de disco o de un archivo; recalcula el nivel
 * desde el CP. Antes de la versión 2, un Oscuro era una especie aparte
 * (`speciesId` terminado en `_shadow`); acá se separa en la especie base más
 * `variant: "shadow"`, así conviven en la misma línea evolutiva.
 */
export function sanitizeEntry(e: unknown): BoxEntry | null {
  if (!e || typeof e !== "object") return null;
  const o = e as Record<string, unknown>;
  let speciesId = typeof o.speciesId === "string" ? o.speciesId : null;
  let variant: Variant = VARIANTS.includes(o.variant as Variant) ? (o.variant as Variant) : "normal";
  if (speciesId?.endsWith("_shadow") && variant === "normal") {
    const baseId = speciesId.slice(0, -"_shadow".length);
    if (getSpecies(baseId)) {
      speciesId = baseId;
      variant = "shadow";
    }
  }
  const species = speciesId ? getSpecies(speciesId) : undefined;
  if (!species || species.shadow || species.mega) return null;
  if (!isIv(o.atk) || !isIv(o.def) || !isIv(o.sta) || !Number.isInteger(o.cp)) return null;
  const iv = { atk: o.atk as number, def: o.def as number, sta: o.sta as number };
  const level = levelsForCp(species, iv, o.cp as number)[0];
  if (level === undefined) return null;
  return {
    id: typeof o.id === "string" && o.id ? o.id : newId(),
    speciesId: species.id,
    ...iv,
    cp: o.cp as number,
    level,
    variant,
    // Un Oscuro no puede ser Suertudo (no existe el trade "oscuro y afortunado" en el juego).
    lucky: typeof o.lucky === "boolean" ? o.lucky && variant !== "shadow" : false,
    addedAt: typeof o.addedAt === "number" ? o.addedAt : Date.now(),
  };
}

export function newId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function loadBox(): BoxEntry[] {
  const v2 = loadJSON<{ entries?: unknown[] } | null>(BOX_KEY, null);
  if (v2) return (v2.entries ?? []).map(sanitizeEntry).filter((e): e is BoxEntry => e !== null);
  // Primera vez que se abre el rankeador después de la migración: se lee la
  // caja vieja una sola vez y se reescribe ya en el formato nuevo.
  const v1 = loadJSON<{ entries?: unknown[] } | null>(BOX_KEY_V1, null);
  const migrated = (v1?.entries ?? []).map(sanitizeEntry).filter((e): e is BoxEntry => e !== null);
  saveBox(migrated);
  return migrated;
}

export function saveBox(entries: BoxEntry[]) {
  saveJSON(BOX_KEY, { version: 2, entries });
}

/** Contenido del archivo de exportación. */
export function exportPayload(entries: BoxEntry[]) {
  return {
    app: "pokego-pvp",
    kind: "box",
    version: 2,
    exportedAt: new Date().toISOString(),
    entries: entries.map(({ id, speciesId, atk, def, sta, cp, variant, lucky, addedAt }) => ({
      id,
      speciesId,
      atk,
      def,
      sta,
      cp,
      variant,
      lucky,
      addedAt,
    })),
  };
}

export interface ImportResult {
  entries: BoxEntry[];
  skipped: number;
}

/** Lee un archivo exportado. Devuelve null si no es un archivo de esta app. */
export function parseImport(text: string): ImportResult | null {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return null;
  }
  const o = data as { app?: unknown; kind?: unknown; entries?: unknown };
  if (!o || o.app !== "pokego-pvp" || o.kind !== "box" || !Array.isArray(o.entries)) return null;
  const entries = o.entries.map(sanitizeEntry).filter((e): e is BoxEntry => e !== null);
  return { entries, skipped: o.entries.length - entries.length };
}
