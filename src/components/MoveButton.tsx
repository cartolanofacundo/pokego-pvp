import { TYPE_COLORS, type PokemonType } from "@/lib/types";
import type { MoveScore } from "@/lib/recommend";
import { EffectBadge } from "./EffectBadge";

/**
 * Botón circular de ataque cargado, coloreado por tipo. `perspective` decide
 * si el badge de efectividad se lee "le pego" (mine) o "me pega" (theirs).
 * `highlight` marca el ataque recomendado (solo del lado aliado).
 */
export function MoveButton({
  move,
  perspective,
  highlight = false,
  size = 68,
}: {
  move: MoveScore;
  perspective: "mine" | "theirs";
  highlight?: boolean;
  size?: number;
}) {
  const color = TYPE_COLORS[move.type as PokemonType] ?? "#888";
  return (
    <div className="flex flex-col items-center gap-1" style={{ width: size + 12 }}>
      <div className="relative" title={move.reason}>
        <div
          className={`rounded-full border-2 border-black flex flex-col items-center justify-center text-white text-center overflow-hidden ${
            highlight ? "recommended-ring" : ""
          }`}
          style={{ width: size, height: size, backgroundColor: color, padding: 3 }}
        >
          <span
            className="text-[7px] font-bold leading-tight break-words w-full"
            style={{ textShadow: "1px 1px 0 rgba(0,0,0,0.5)" }}
          >
            {move.name}
          </span>
        </div>
        <div className="absolute -top-1.5 -right-1.5">
          <EffectBadge mult={move.effectiveness} perspective={perspective} />
        </div>
      </div>
      {move.turnsToCharge != null && (
        <span className="text-[7px] text-neutral-300">
          {move.hitsToCharge}g · {move.turnsToCharge}t
        </span>
      )}
    </div>
  );
}
