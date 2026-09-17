"use client";

import { useEffect } from "react";
import type { LeagueKey } from "@/lib/data";
import { PokemonPicker } from "./PokemonPicker";

export function PickerModal({
  league,
  title,
  onSelect,
  onClose,
}: {
  league: LeagueKey;
  title: string;
  onSelect: (speciesId: string) => void;
  onClose: () => void;
}) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 pt-20 px-4"
      onClick={onClose}
    >
      <div className="gb-box p-3" onClick={(e) => e.stopPropagation()}>
        <div className="text-[10px] font-bold mb-2">{title}</div>
        <PokemonPicker league={league} placeholder="Buscar Pokémon..." onSelect={onSelect} onClose={onClose} />
      </div>
    </div>
  );
}
