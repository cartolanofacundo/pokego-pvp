"use client";

import { forwardRef, useImperativeHandle, useMemo, useRef, useState } from "react";
import { adjacentSpecies, searchSpecies, type Species } from "@/lib/ranker/data";
import { withBasePath } from "@/lib/basePath";
import { TypeChips } from "@/components/TypeChip";
import { SearchIcon } from "@/components/Icons";

export interface SpeciesPickerHandle {
  focus: () => void;
}

const dexNumber = (dex: number) => `#${String(dex).padStart(4, "0")}`;

/** Buscador de especie por nombre o número de pokédex. ↑↓ elige, Enter confirma. */
export const SpeciesPicker = forwardRef<SpeciesPickerHandle, { onPick: (s: Species) => void }>(function SpeciesPicker(
  { onPick },
  ref
) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  useImperativeHandle(ref, () => ({ focus: () => inputRef.current?.focus() }));

  const results = useMemo(() => (query.trim() ? searchSpecies(query, 8) : []), [query]);
  const current = Math.min(cursor, Math.max(0, results.length - 1));

  const pick = (s: Species) => {
    onPick(s);
    setQuery("");
    setOpen(false);
    setCursor(0);
  };

  return (
    <div style={{ position: "relative" }}>
      <label className="rk-field">
        <SearchIcon />
        <span className="sr-only">Buscar especie por nombre o número de pokédex</span>
        <input
          ref={inputRef}
          value={query}
          placeholder="Nombre o número de pokédex…"
          autoComplete="off"
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          onChange={(e) => {
            setQuery(e.target.value);
            setCursor(0);
            setOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setCursor((c) => Math.min(c + 1, results.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setCursor((c) => Math.max(c - 1, 0));
            } else if (e.key === "Enter") {
              e.preventDefault();
              if (results[current]) pick(results[current]);
            } else if (e.key === "Escape") {
              setQuery("");
              inputRef.current?.blur();
            }
          }}
        />
        <span className="kbd kbd--sm">/</span>
      </label>

      {open && results.length > 0 && (
        <div
          className="panel panel--cut-18"
          style={{ position: "absolute", top: 62, left: 0, right: 0, zIndex: 20, display: "flex", flexDirection: "column", gap: 2, padding: 8 }}
          role="listbox"
        >
          {results.map((s, i) => (
            <button
              key={s.id}
              type="button"
              role="option"
              aria-selected={i === current}
              className={`rk-row ${i === current ? "rk-row--current" : ""}`}
              onMouseEnter={() => setCursor(i)}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => pick(s)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="rk-sprite" src={withBasePath(`/sprites/pixel/${s.id}.png`)} alt="" width={40} height={40} />
              <span className="rk-num" style={{ width: 56, color: "#9CA6B2", fontSize: 13 }}>{dexNumber(s.dex)}</span>
              <span style={{ flexGrow: 1, fontSize: 16.5, fontWeight: 600, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {s.name}
              </span>
              <TypeChips types={s.types} variant="search" gap={5} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
});

const STAT_MAX = 300;
const statPct = (v: number) => Math.round((v / STAT_MAX) * 100);

function StatBar({ label, value }: { label: string; value: number }) {
  return (
    <span style={{ display: "grid", gridTemplateColumns: "34px 1fr 36px", alignItems: "center", gap: 10 }}>
      <span className="label" style={{ fontSize: 10.5 }}>{label}</span>
      <span className="rk-stat-bar">
        <span style={{ width: `${statPct(value)}%` }} />
      </span>
      <span className="rk-num" style={{ fontSize: 13, fontWeight: 600, color: "#DCE1E7", textAlign: "right" }}>{value}</span>
    </span>
  );
}

/** Tarjeta de la especie elegida: sprite, nombre, tipos, stats base y navegación entre especies. */
export function SpeciesCard({ species, onPick }: { species: Species; onPick: (s: Species) => void }) {
  const { prev, next } = adjacentSpecies(species.id);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <span
          style={{
            position: "relative", width: 112, height: 112, display: "flex", alignItems: "center", justifyContent: "center",
            background: "radial-gradient(56px 56px at 50% 55%, rgba(150,195,250,0.16), rgba(150,195,250,0) 100%)", flexShrink: 0,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="rk-sprite" src={withBasePath(`/sprites/pixel/${species.id}.png`)} alt="" style={{ width: 150, height: 150, margin: -19 }} />
        </span>
        <div style={{ flexGrow: 1, display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
          <span style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <span className="display" style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1 }}>{species.name}</span>
            <span className="rk-num" style={{ fontSize: 13, fontWeight: 600, color: "#A8B0BB" }}>{dexNumber(species.dex)}</span>
          </span>
          <TypeChips types={species.types} variant="header" />
          <div style={{ display: "flex", flexDirection: "column", gap: 5, marginTop: 4 }}>
            <StatBar label="ATQ" value={species.atk} />
            <StatBar label="DEF" value={species.def} />
            <StatBar label="PS" value={species.sta} />
          </div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between" }}>
        {prev ? (
          <button
            type="button"
            onClick={() => onPick(prev)}
            style={{
              display: "flex", alignItems: "center", gap: 6, height: 32, padding: "0 10px 0 6px", border: 0, borderRadius: 8,
              background: "rgba(255,255,255,0.07)", fontSize: 13, color: "#B4BCC6",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M8.5 3L4.5 7l4 4" stroke="#C2C9D2" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" /></svg>
            <span className="rk-num" style={{ fontSize: 11.5, color: "#9CA6B2" }}>{dexNumber(prev.dex)}</span>
            {prev.name}
          </button>
        ) : <span />}
        {next ? (
          <button
            type="button"
            onClick={() => onPick(next)}
            style={{
              display: "flex", alignItems: "center", gap: 6, height: 32, padding: "0 6px 0 10px", border: 0, borderRadius: 8,
              background: "rgba(255,255,255,0.07)", fontSize: 13, color: "#B4BCC6",
            }}
          >
            {next.name}
            <span className="rk-num" style={{ fontSize: 11.5, color: "#9CA6B2" }}>{dexNumber(next.dex)}</span>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5.5 3l4 4-4 4" stroke="#C2C9D2" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        ) : <span />}
      </div>
    </div>
  );
}
