import { NEUTRAL_OPPONENT, type LeagueKey, type Pokemon } from "@/lib/data";
import { analyzeMoveset } from "@/lib/recommend";
import type { PokemonType } from "@/lib/types";
import { PokemonSprite } from "./PokemonSprite";
import { TypeChips } from "./TypeChip";
import { FastMoveChip } from "./FastMoveChip";
import { MoveButton } from "./MoveButton";
import { TypePanel } from "./TypePanel";

/**
 * Panel de un combatiente: se usa tal cual para el enemigo y para mi
 * Pokémon activo, con la misma forma y estructura (mismo componente), solo
 * cambia `side` (que decide de qué lado mira el sprite, la connotación de
 * color de los badges, y si se resalta el mejor ataque con un anillo).
 */
export function CombatantPanel({
  pokemon,
  opponent,
  league,
  side,
  relevantTypes,
}: {
  pokemon: Pokemon | null;
  opponent: Pokemon | null;
  league: LeagueKey;
  side: "enemy" | "ally";
  relevantTypes: Set<PokemonType>;
}) {
  if (!pokemon) {
    return (
      <div className="flex items-center justify-center w-full h-40 text-[9px] text-neutral-400 text-center px-4">
        {side === "enemy" ? "Elegí un Pokémon enemigo →" : "← Elegí tu Pokémon"}
      </div>
    );
  }

  // Cuando el otro lado no tiene Pokémon activo, se usa un rival neutral
  // (tipo "none") para que los ataques se vean sin badges de efectividad.
  const perspective = side === "enemy" ? "theirs" : "mine";
  const attacker = side === "enemy" ? pokemon : pokemon;
  const defender = opponent ?? NEUTRAL_OPPONENT;
  // Del lado enemigo evaluamos SUS ataques contra MÍ; del lado aliado, MIS
  // ataques contra el enemigo. En ambos casos "attacker" es este `pokemon`.
  const analysis = analyzeMoveset(attacker, defender, league);

  return (
    <div className="flex items-center gap-3">
      {side === "enemy" ? (
        <>
          <AttackColumn analysis={analysis} perspective={perspective} showRing={false} />
          <SpriteColumn pokemon={pokemon} facing="front" />
          <TypePanel types={pokemon.types} relevantTypes={relevantTypes} side={side} />
        </>
      ) : (
        <>
          <TypePanel types={pokemon.types} relevantTypes={relevantTypes} side={side} />
          <SpriteColumn pokemon={pokemon} facing="back" />
          <AttackColumn analysis={analysis} perspective={perspective} showRing={true} />
        </>
      )}
    </div>
  );
}

function SpriteColumn({ pokemon, facing }: { pokemon: Pokemon; facing: "front" | "back" }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <TypeChips types={pokemon.types} size="sm" />
      <PokemonSprite key={pokemon.speciesId} pokemon={pokemon} facing={facing} size={144} />
      <span className="text-[9px] font-bold">{pokemon.speciesName}</span>
    </div>
  );
}

function AttackColumn({
  analysis,
  perspective,
  showRing,
}: {
  analysis: ReturnType<typeof analyzeMoveset>;
  perspective: "mine" | "theirs";
  showRing: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      {analysis.fast && <FastMoveChip move={analysis.fast} perspective={perspective} />}
      <div className="flex gap-2">
        {analysis.charged.map((m) => (
          <MoveButton
            key={m.moveId}
            move={m}
            perspective={perspective}
            highlight={showRing && analysis.best?.moveId === m.moveId}
          />
        ))}
      </div>
    </div>
  );
}
