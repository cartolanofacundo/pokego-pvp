"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getPokemonForLeague, searchPokemon, LEAGUES, type LeagueKey, type Pokemon } from "@/lib/data";
import { withBasePath } from "@/lib/basePath";
import type { Combo } from "@/lib/shortcuts";
import { Kbd } from "./Kbd";
import { TypeChips } from "./TypeChip";
import { SearchIcon } from "./Icons";

const MAX_ROWS = 8;

/**
 * Buscador (Buscador.dc.html traducido al lenguaje de la pista: 1920, esquinas
 * cortadas, superficies por valor). Con la búsqueda vacía muestra los más
 * usados de la liga activa (orden del ranking de PvPoke). Flechas navegan,
 * Enter agrega, Tab cambia de bando, Esc cierra (lo maneja el atajo fijo).
 *
 * Una sola Mega por equipo: si ese lado ya tiene una (`hideMegas`), las Megas
 * y Primales se sacan del listado antes de cortarlo, y el pie lo avisa.
 */
export function SearchModal({
  side,
  league,
  addCombo,
  closeCombo,
  teamFull,
  hideMegas,
  onPick,
  onSwitchSide,
}: {
  side: "rival" | "ally";
  league: LeagueKey;
  addCombo: Combo | null;
  closeCombo: Combo | null;
  teamFull: boolean;
  hideMegas: boolean;
  onPick: (p: Pokemon) => void;
  onSwitchSide: () => void;
}) {
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const { results, hiddenMegas } = useMemo(() => {
    const pool = query.trim() ? searchPokemon(query, league) : getPokemonForLeague(league);
    const allowed = hideMegas ? pool.filter((p) => !p.mega) : pool;
    return { results: allowed.slice(0, 40), hiddenMegas: pool.length - allowed.length };
  }, [query, league, hideMegas]);
  const megaNote = side === "rival" ? "EL RIVAL YA TIENE SU MEGA" : "YA TENÉS UNA MEGA";

  const clampedCursor = Math.min(cursor, Math.max(0, results.length - 1));

  useEffect(() => {
    const el = listRef.current?.children[clampedCursor] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [clampedCursor]);

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((c) => Math.min(c + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => Math.max(c - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const p = results[clampedCursor];
      if (p && !teamFull) onPick(p);
    } else if (e.key === "Tab") {
      e.preventDefault();
      onSwitchSide();
    }
  }

  const leagueLabel = LEAGUES.find((l) => l.key === league)?.label.toUpperCase() ?? "";

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 40 }} role="dialog" aria-modal="true" aria-labelledby="search-title">
      <div className="veil" />
      <div
        className="panel panel--cut-28"
        style={{
          position: "absolute", top: 120, left: "50%", transform: "translateX(-50%)", width: 720,
          display: "flex", flexDirection: "column", padding: "22px 22px 16px",
        }}
        onKeyDown={onKeyDown}
      >
        <span className="panel__edge" />

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 4px 16px" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span id="search-title" className="label" style={{ fontSize: 11, letterSpacing: "0.16em", color: "#A8B0BB" }}>
              {side === "rival" ? "AGREGAR ENEMIGO" : "AGREGAR ALIADO"}
            </span>
            <Kbd combo={addCombo} small />
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className="mono" style={{ fontSize: 10.5, letterSpacing: "0.08em", color: "#949DA9" }}>CERRAR</span>
            <Kbd combo={closeCombo} small />
          </span>
        </div>

        <div
          style={{
            display: "flex", alignItems: "center", gap: 14, height: 72, padding: "0 20px",
            background: "rgba(255,255,255,0.05)", boxShadow: "0 0 0 2px rgba(111,227,242,0.38)",
            clipPath: "polygon(12px 0, 100% 0, 100% 100%, 0 100%, 0 12px)",
          }}
        >
          <SearchIcon />
          <label htmlFor="search-q" className="sr-only">
            {side === "rival" ? "Buscar Pokémon enemigo" : "Buscar Pokémon aliado"}
          </label>
          <input
            id="search-q"
            ref={inputRef}
            type="text"
            value={query}
            placeholder="Buscá un Pokémon…"
            autoComplete="off"
            onChange={(e) => {
              setQuery(e.target.value);
              setCursor(0);
            }}
            style={{
              flexGrow: 1, minWidth: 0, height: 40, border: 0, outline: "none", background: "transparent",
              color: "#F2F3F5", fontSize: 23, fontWeight: 500, letterSpacing: "-0.015em",
            }}
          />
        </div>

        <span className="label" style={{ fontSize: 11, letterSpacing: "0.16em", color: "#A8B0BB", padding: "22px 4px 12px" }}>
          {query.trim() ? "RESULTADOS" : `MÁS USADOS EN ${leagueLabel}`}
        </span>

        <div ref={listRef} className="scroll-list" style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: MAX_ROWS * 66 + (MAX_ROWS - 1) * 4 }}>
          {results.length === 0 && (
            <span style={{ padding: "18px 14px", fontSize: 15, color: "#9CA6B2" }}>
              {hiddenMegas > 0
                ? "Solo se permite una Mega por equipo, y este ya tiene la suya."
                : "Ningún Pokémon con ese nombre en esta liga."}
            </span>
          )}
          {results.map((p, i) => (
            <button
              key={p.speciesId}
              type="button"
              className={`search-row ${i === clampedCursor ? "search-row--current" : ""}`}
              aria-current={i === clampedCursor ? "true" : undefined}
              onMouseEnter={() => setCursor(i)}
              onClick={() => !teamFull && onPick(p)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="search-row__sprite" src={withBasePath(`/sprites/pixel/${p.speciesId}.png`)} alt="" />
              <span className="search-row__name">{p.speciesName}</span>
              <TypeChips types={p.types} variant="search" gap={6} />
              {i === clampedCursor ? (
                <span className="kbd" style={{ justifyContent: "center", width: 28, padding: 0, background: "rgba(255,255,255,0.09)", fontSize: 12 }}>↵</span>
              ) : (
                <span style={{ width: 28, flexShrink: 0 }} />
              )}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 18, padding: "18px 4px 2px" }}>
          <Hint keys="↑↓" text="NAVEGAR" />
          <Hint keys="↵" text="AGREGAR AL EQUIPO" />
          <Hint keys="Tab" text={side === "rival" ? "CAMBIAR A ALIADO" : "CAMBIAR A ENEMIGO"} />
          {teamFull ? (
            <span className="mono" style={{ marginLeft: "auto", fontSize: 10.5, letterSpacing: "0.08em", color: "#FFC2C2" }}>
              EQUIPO COMPLETO · QUITÁ UNO PRIMERO
            </span>
          ) : (
            hiddenMegas > 0 && (
              <span className="mono" style={{ marginLeft: "auto", fontSize: 10.5, letterSpacing: "0.08em", color: "#A8B0BB" }}>
                {megaNote} · UNA POR EQUIPO
              </span>
            )
          )}
        </div>
      </div>
    </div>
  );
}

function Hint({ keys, text }: { keys: string; text: string }) {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
      <span className="kbd kbd--sm">{keys}</span>
      <span className="mono" style={{ fontSize: 10.5, letterSpacing: "0.08em", color: "#A8B0BB" }}>{text}</span>
    </span>
  );
}
