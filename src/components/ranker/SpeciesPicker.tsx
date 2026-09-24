"use client";

import { forwardRef, useImperativeHandle, useMemo, useRef, useState } from "react";
import { searchSpecies, type Species } from "@/lib/ranker/data";
import { withBasePath } from "@/lib/basePath";
import { TypeChips } from "@/components/TypeChip";
import { SearchIcon } from "@/components/Icons";

export interface SpeciesPickerHandle {
  focus: () => void;
}

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
          placeholder="Especie o número de pokédex…"
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
              <span className="rk-num" style={{ width: 44, color: "#9CA6B2", fontSize: 13 }}>#{s.dex}</span>
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
