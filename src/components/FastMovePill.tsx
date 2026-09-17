import { TYPE_COLORS, type PokemonType } from "@/lib/types";
import { EFFECT_SYMBOL, type MoveScore } from "@/lib/recommend";

export function FastMovePill({ move }: { move: MoveScore }) {
  const color = TYPE_COLORS[move.type as PokemonType] ?? "#888";
  return (
    <div
      className="rounded-full border-2 border-black px-2 py-1 text-white text-[8px] flex items-center gap-1"
      style={{ backgroundColor: color }}
      title={move.reason}
    >
      <span style={{ textShadow: "1px 1px 0 rgba(0,0,0,0.5)" }}>{move.name}</span>
      <span className="font-bold">{EFFECT_SYMBOL[move.tier]}</span>
    </div>
  );
}
