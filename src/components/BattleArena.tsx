import type { LeagueKey, Pokemon } from "@/lib/data";
import type { PokemonType } from "@/lib/types";
import { CombatantPanel } from "./CombatantPanel";

/** Escena central de combate: enemigo arriba-derecha, mi Pokémon abajo-izquierda, sobre un piso en perspectiva. */
export function BattleArena({
  enemy,
  ally,
  league,
  enemyRelevantTypes,
  allyRelevantTypes,
}: {
  enemy: Pokemon | null;
  ally: Pokemon | null;
  league: LeagueKey;
  enemyRelevantTypes: Set<PokemonType>;
  allyRelevantTypes: Set<PokemonType>;
}) {
  return (
    <div className="battle-bg relative flex-1 w-full min-h-[520px] rounded-lg border-2 border-black overflow-hidden">
      {/* Piso: dos plataformas ovaladas, una por combatiente */}
      <div className="battle-platform absolute" style={{ width: 220, height: 80, top: "38%", right: "8%" }} />
      <div className="battle-platform absolute" style={{ width: 260, height: 90, bottom: "10%", left: "6%" }} />

      <div className="absolute top-6 right-6">
        <CombatantPanel
          pokemon={enemy}
          opponent={ally}
          league={league}
          side="enemy"
          relevantTypes={enemyRelevantTypes}
        />
      </div>

      <div className="absolute bottom-6 left-6">
        <CombatantPanel
          pokemon={ally}
          opponent={enemy}
          league={league}
          side="ally"
          relevantTypes={allyRelevantTypes}
        />
      </div>
    </div>
  );
}
