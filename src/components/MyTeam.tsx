"use client";

import { useState } from "react";
import type { Pokemon, LeagueKey } from "@/lib/data";
import { displayName } from "@/lib/data";
import type { TeamMemberScore } from "@/lib/team";
import { PokemonSprite } from "./PokemonSprite";
import { PokemonPicker } from "./PokemonPicker";
import { SwitchBadge } from "./SwitchBadge";

export function MyTeam({
  team,
  scores,
  activeIndex,
  league,
  onAssign,
  onClear,
  onSetActive,
}: {
  team: (Pokemon | null)[];
  scores: (TeamMemberScore | null)[];
  activeIndex: number;
  league: LeagueKey;
  onAssign: (index: number, speciesId: string) => void;
  onClear: (index: number) => void;
  onSetActive: (index: number) => void;
}) {
  const [openSlot, setOpenSlot] = useState<number | null>(null);
  const [detailSlot, setDetailSlot] = useState<number | null>(null);

  return (
    <div className="flex flex-col gap-1.5 items-center relative">
      <span className="text-[7px] text-neutral-400">Mis Pokémon</span>
      <div className="flex flex-col gap-1.5">
        {team.map((p, i) => {
          const score = scores[i];
          return (
            <div key={i} className="relative">
              {p ? (
                <div
                  className="flex flex-col items-center gap-0.5"
                  onMouseEnter={() => setDetailSlot(i)}
                  onMouseLeave={() => setDetailSlot(null)}
                >
                  <button
                    onClick={() => onSetActive(i)}
                    className={`rounded-full border-2 relative ${
                      i === activeIndex ? "border-yellow-300" : "border-black"
                    }`}
                    title={displayName(p)}
                  >
                    <PokemonSprite pokemon={p} facing="front" size={44} />
                    {score && (
                      <div className="absolute -top-1 -right-1">
                        <SwitchBadge label={score.label} size={15} />
                      </div>
                    )}
                  </button>
                  <button
                    onClick={() => onClear(i)}
                    className="text-[6px] text-neutral-400 hover:text-red-400"
                  >
                    quitar
                  </button>

                  {detailSlot === i && score && (
                    <div className="absolute right-full mr-2 top-0 w-40 gb-box p-1.5 text-[7px] z-20">
                      <div className="font-bold mb-1">{displayName(p)}</div>
                      <div>Ofensiva: {(score.offense * 100).toFixed(0)}%</div>
                      <div>Defensiva: {(score.defense * 100).toFixed(0)}%</div>
                      {score.pvpokeRating != null && (
                        <div>Rating PvPoke: {score.pvpokeRating}</div>
                      )}
                      {score.bestAttack && <div>Mejor ataque: {score.bestAttack}</div>}
                      {score.worstIncoming && (
                        <div className="text-red-700">Cuidado: {score.worstIncoming}</div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setOpenSlot(i)}
                  className="w-11 h-11 rounded-full border-2 border-dashed border-neutral-400 text-neutral-400 text-lg flex items-center justify-center hover:border-yellow-300 hover:text-yellow-300"
                >
                  +
                </button>
              )}

              {openSlot === i && (
                <div className="absolute right-full mr-2 top-0 z-30">
                  <PokemonPicker
                    league={league}
                    placeholder="Buscar Pokémon..."
                    onSelect={(id) => {
                      onAssign(i, id);
                      setOpenSlot(null);
                    }}
                    onClose={() => setOpenSlot(null)}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
