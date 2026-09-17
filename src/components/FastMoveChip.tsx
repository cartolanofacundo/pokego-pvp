import { TYPE_COLORS, type PokemonType } from "@/lib/types";
import type { MoveScore } from "@/lib/recommend";
import { EffectBadge } from "./EffectBadge";

export function FastMoveChip({
  move,
  perspective,
}: {
  move: MoveScore;
  perspective: "mine" | "theirs";
}) {
  const color = TYPE_COLORS[move.type as PokemonType] ?? "#888";
  return (
    <div className="flex items-center gap-1" title={move.reason}>
      <span
        className="rounded-full border-2 border-black px-2 py-1 text-white text-[8px]"
        style={{ backgroundColor: color, textShadow: "1px 1px 0 rgba(0,0,0,0.5)" }}
      >
        {move.name}
      </span>
      <EffectBadge mult={move.effectiveness} perspective={perspective} />
    </div>
  );
}
