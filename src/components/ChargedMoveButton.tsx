import { TYPE_COLORS, type PokemonType } from "@/lib/types";
import { EFFECT_SYMBOL, type MoveScore } from "@/lib/recommend";

/**
 * Botón circular de ataque cargado, coloreado por tipo, con el símbolo de
 * efectividad y cuántos golpes rápidos tarda en cargarse. `highlight` marca
 * el ataque recomendado con un anillo pulsante.
 */
export function ChargedMoveButton({
  move,
  highlight = false,
  size = 64,
}: {
  move: MoveScore;
  highlight?: boolean;
  size?: number;
}) {
  const color = TYPE_COLORS[move.type as PokemonType] ?? "#888";
  return (
    <div className="flex flex-col items-center gap-0.5" style={{ width: size + 8 }}>
      <div
        className={`rounded-full border-2 border-black flex flex-col items-center justify-center text-white text-center overflow-hidden ${
          highlight ? "recommended-ring" : ""
        }`}
        style={{ width: size, height: size, backgroundColor: color, padding: 2 }}
        title={move.reason}
      >
        <span
          className="text-[6px] font-bold leading-none break-words w-full"
          style={{ textShadow: "1px 1px 0 rgba(0,0,0,0.5)", maxHeight: "2.4em" }}
        >
          {move.name}
        </span>
        <span className="text-[9px] font-bold mt-0.5">{EFFECT_SYMBOL[move.tier]}</span>
      </div>
      <div className="text-[6px] text-center text-neutral-200 leading-tight">
        {move.turnsToCharge != null && (
          <div>
            {move.hitsToCharge}g · {move.turnsToCharge}t
          </div>
        )}
      </div>
    </div>
  );
}
