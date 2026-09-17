"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { searchPokemon, displayName, type LeagueKey } from "@/lib/data";
import { TypeChips } from "./TypeChip";

export function PokemonPicker({
  league,
  placeholder,
  onSelect,
  onClose,
  autoFocus = true,
}: {
  league: LeagueKey;
  placeholder: string;
  onSelect: (speciesId: string) => void;
  onClose?: () => void;
  autoFocus?: boolean;
}) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  const results = useMemo(() => searchPokemon(query, league).slice(0, 40), [query, league]);

  return (
    <div className="w-full max-w-sm">
      <div className="flex gap-1 mb-2">
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="flex-1 text-[10px] px-2 py-1.5 rounded border-2 border-black bg-white text-black outline-none"
        />
        {onClose && (
          <button
            onClick={onClose}
            className="text-[10px] px-2 rounded border-2 border-black bg-neutral-200 hover:bg-neutral-300"
          >
            ✕
          </button>
        )}
      </div>
      <div className="max-h-96 overflow-y-auto pixel-scroll flex flex-col gap-1">
        {results.length === 0 && (
          <div className="text-[9px] text-neutral-500 text-center py-2">
            Sin resultados
          </div>
        )}
        {results.map((p) => (
          <button
            key={p.speciesId}
            onClick={() => onSelect(p.speciesId)}
            className="flex items-center justify-between gap-2 text-left text-[9px] px-2 py-1.5 rounded border border-black/30 bg-white hover:bg-yellow-100"
          >
            <span className="flex flex-col">
              <span className="font-bold">{displayName(p)}</span>
              <span className="text-neutral-500">#{p.leagues[league]?.rank}</span>
            </span>
            <TypeChips types={p.types} size="sm" />
          </button>
        ))}
      </div>
    </div>
  );
}
