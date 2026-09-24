// Tu caja de Pokémon cargados y los ajustes del rankeador. Todo vive en el
// localStorage de esta computadora hasta que lo exportás a un archivo.
// Importar reemplaza la caja entera.

import { loadJSON, saveJSON } from "@/lib/storage";
import { getSpecies } from "./data";
import { levelsForCp } from "./cp";
import type { BoxEntry } from "./analysis";
import type { RankSettings } from "./ivrank";

export const BOX_KEY = "pokego-pvp:box:v1";
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

/** Valida una entrada leída de disco o de un archivo; recalcula el nivel desde el CP. */
export function sanitizeEntry(e: unknown): BoxEntry | null {
  if (!e || typeof e !== "object") return null;
  const o = e as Record<string, unknown>;
  const species = typeof o.speciesId === "string" ? getSpecies(o.speciesId) : undefined;
  if (!species || !isIv(o.atk) || !isIv(o.def) || !isIv(o.sta) || !Number.isInteger(o.cp)) return null;
  const iv = { atk: o.atk as number, def: o.def as number, sta: o.sta as number };
  const level = levelsForCp(species, iv, o.cp as number)[0];
  if (level === undefined) return null;
  return {
    id: typeof o.id === "string" && o.id ? o.id : newId(),
    speciesId: species.id,
    ...iv,
    cp: o.cp as number,
    level,
    addedAt: typeof o.addedAt === "number" ? o.addedAt : Date.now(),
  };
}

export function newId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function loadBox(): BoxEntry[] {
  const raw = loadJSON<{ entries?: unknown[] }>(BOX_KEY, { entries: [] });
  return (raw.entries ?? []).map(sanitizeEntry).filter((e): e is BoxEntry => e !== null);
}

export function saveBox(entries: BoxEntry[]) {
  saveJSON(BOX_KEY, { version: 1, entries });
}

/** Contenido del archivo de exportación. */
export function exportPayload(entries: BoxEntry[]) {
  return {
    app: "pokego-pvp",
    kind: "box",
    version: 1,
    exportedAt: new Date().toISOString(),
    entries: entries.map(({ id, speciesId, atk, def, sta, cp, addedAt }) => ({ id, speciesId, atk, def, sta, cp, addedAt })),
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
