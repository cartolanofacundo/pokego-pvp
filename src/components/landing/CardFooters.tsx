"use client";

// Reemplaza, solo después de hidratar, la línea de pie de cada tarjeta de
// entrada por un resumen de lo que el visitante ya tiene guardado en este
// navegador. `useSyncExternalStore` con snapshot de servidor fijo evita el
// salto de layout: el texto genérico sale en el HTML y en el primer render
// del cliente; recién después se reemplaza por el real, misma línea.
import { useSyncExternalStore } from "react";
import { getPokemon, LEAGUES } from "@/lib/data";
import { loadJSON } from "@/lib/storage";
import { getSpecies, RANKER_LEAGUES } from "@/lib/ranker/data";
import { bestRankOf, servesLeague } from "@/lib/ranker/analysis";
import { loadBox, loadSettings } from "@/lib/ranker/box";

const subscribe = () => () => {};

const COMBATE_DEFAULT = "SE USA EN LA COMPU · TU EQUIPO QUEDA GUARDADO AHÍ";
const RANKEADOR_DEFAULT = "SE USA EN LA COMPU · TU CAJA QUEDA GUARDADA AHÍ";

interface CombatePersisted {
  team?: (string | null)[];
  league?: string;
  updatedAt?: number;
}

function daysAgo(ts: number): string {
  const days = Math.max(0, Math.floor((Date.now() - ts) / 86_400_000));
  if (days === 0) return "HOY";
  if (days === 1) return "HACE 1 DÍA";
  return `HACE ${days} DÍAS`;
}

function readCombateFooter(): string {
  const s = loadJSON<CombatePersisted | null>("pokego-pvp:v3", null);
  const ids = (s?.team ?? []).filter((id): id is string => !!id);
  if (!ids.length) return COMBATE_DEFAULT;
  const names = ids.map((id) => getPokemon(id)?.speciesName).filter(Boolean).join(", ");
  const league = LEAGUES.find((l) => l.key === s?.league)?.label.toUpperCase() ?? "";
  const when = s?.updatedAt ? ` · ${daysAgo(s.updatedAt)}` : "";
  return `TU EQUIPO: ${names.toUpperCase()} · ${league}${when}`;
}

function readRankeadorFooter(): string {
  const entries = loadBox();
  if (!entries.length) return RANKEADOR_DEFAULT;
  const settings = loadSettings();
  const servesGreat = entries.filter((e) => servesLeague(e, settings, "great")).length;
  const last = entries.reduce((a, b) => (b.addedAt > a.addedAt ? b : a));
  const species = getSpecies(last.speciesId);
  const great = RANKER_LEAGUES.find((l) => l.key === "great")!.short.toUpperCase();
  const best = bestRankOf(last, settings, "great");
  const bestTxt = best ? ` · #${best.rank} ${great}` : "";
  const name = species?.name.toUpperCase() ?? "";
  return `TU CAJA: ${entries.length} POKÉMON, ${servesGreat} SIRVEN EN GREAT · ÚLTIMO CARGADO ${name} ${last.atk}/${last.def}/${last.sta}${bestTxt}`;
}

export function CombateFooter() {
  const text = useSyncExternalStore(subscribe, readCombateFooter, () => COMBATE_DEFAULT);
  return <>{text}</>;
}

export function RankeadorFooter() {
  const text = useSyncExternalStore(subscribe, readRankeadorFooter, () => RANKEADOR_DEFAULT);
  return <>{text}</>;
}
