"use client";

import { useState } from "react";
import type { Pokemon, LeagueKey } from "@/lib/data";
import { displayName } from "@/lib/data";
import { analyzeMoveset } from "@/lib/recommend";
import { PokemonSprite } from "./PokemonSprite";
import { TypeChips } from "./TypeChip";
import { HpBar } from "./HpBar";
import { GbBox } from "./GbBox";
import { WeaknessPanel } from "./WeaknessPanel";
import { ChargedMoveButton } from "./ChargedMoveButton";
import { FastMovePill } from "./FastMovePill";
import { OtherMoves } from "./OtherMoves";
import { PokemonPicker } from "./PokemonPicker";

export function RivalZone({
  rival,
  myActive,
  league,
  onPickRival,
}: {
  rival: Pokemon | null;
  myActive: Pokemon | null;
  league: LeagueKey;
  onPickRival: (speciesId: string) => void;
}) {
  const [picking, setPicking] = useState(false);

  // Ataques del rival evaluados contra mi Pokémon activo: el símbolo indica
  // "cuánto me pega" a mí.
  const analysis = rival && myActive ? analyzeMoveset(rival, myActive, league) : null;

  return (
    <div className="w-full gb-box-dark p-2 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[9px] text-neutral-300">Rival</span>
        <button
          onClick={() => setPicking((p) => !p)}
          className="text-[8px] px-2 py-1 rounded border-2 border-black bg-yellow-300 text-black"
        >
          {rival ? "Cambiar" : "Elegir Pokémon enemigo"}
        </button>
      </div>

      {picking && (
        <PokemonPicker
          league={league}
          placeholder="Buscar rival..."
          onSelect={(id) => {
            onPickRival(id);
            setPicking(false);
          }}
          onClose={() => setPicking(false)}
        />
      )}

      {!rival && !picking && (
        <div className="text-[9px] text-neutral-400 text-center py-6">
          Elegí el Pokémon del rival para ver debilidades y ataques.
        </div>
      )}

      {rival && (
        <div className="flex flex-col gap-2">
          <div className="flex items-start gap-2">
            {/* Botones de ataque cargado del rival: cuánto me pegan a mí */}
            <div className="flex gap-2 flex-1 justify-center">
              {analysis?.charged.map((m) => (
                <ChargedMoveButton key={m.moveId} move={m} size={56} />
              ))}
            </div>
            <PokemonSprite pokemon={rival} facing="front" size={80} />
          </div>

          <div className="flex justify-center">
            {analysis?.fast && <FastMovePill move={analysis.fast} />}
          </div>

          <GbBox className="flex items-center justify-between gap-2">
            <div className="flex-1">
              <div className="text-[9px] font-bold">{displayName(rival)}</div>
              <TypeChips types={rival.types} size="sm" />
              <div className="mt-1">
                <HpBar pct={100} />
              </div>
            </div>
            <WeaknessPanel types={rival.types} />
          </GbBox>

          {analysis && <OtherMoves fast={analysis.otherFast} charged={analysis.otherCharged} />}
        </div>
      )}
    </div>
  );
}
