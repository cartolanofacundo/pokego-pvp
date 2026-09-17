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

export function MyZone({
  active,
  rival,
  league,
}: {
  active: Pokemon | null;
  rival: Pokemon | null;
  league: LeagueKey;
}) {
  // Mis ataques evaluados contra el rival: el símbolo indica "cuánto le pego".
  const analysis = active && rival ? analyzeMoveset(active, rival, league) : null;

  if (!active) {
    return (
      <div className="w-full gb-box-dark p-4 text-center text-[9px] text-neutral-400">
        Elegí tu Pokémon activo con el botón &quot;+&quot; de la derecha.
      </div>
    );
  }

  return (
    <div className="w-full gb-box-dark p-2 flex flex-col gap-2">
      <span className="text-[9px] text-neutral-300">Tu Pokémon</span>

      <GbBox className="flex items-center justify-between gap-2">
        <WeaknessPanel types={active.types} />
        <div className="flex-1 text-right">
          <div className="text-[9px] font-bold">{displayName(active)}</div>
          <div className="flex justify-end">
            <TypeChips types={active.types} size="sm" />
          </div>
          <div className="mt-1">
            <HpBar pct={100} />
          </div>
        </div>
      </GbBox>

      <div className="flex items-start gap-2">
        <PokemonSprite pokemon={active} facing="back" size={80} />
        <div className="flex gap-2 flex-1 justify-center">
          {analysis?.charged.map((m) => (
            <ChargedMoveButton
              key={m.moveId}
              move={m}
              highlight={analysis.best?.moveId === m.moveId}
              size={64}
            />
          ))}
        </div>
      </div>

      {analysis?.best && (
        <div className="text-[7px] text-center text-yellow-300 px-2">
          Atacá con {analysis.best.reason}
        </div>
      )}

      <div className="flex justify-center">
        {analysis?.fast && <FastMovePill move={analysis.fast} />}
      </div>

      {analysis && <OtherMoves fast={analysis.otherFast} charged={analysis.otherCharged} />}

      {!rival && (
        <div className="text-[7px] text-center text-neutral-400">
          Elegí un rival arriba para ver la recomendación de ataque.
        </div>
      )}
    </div>
  );
}
