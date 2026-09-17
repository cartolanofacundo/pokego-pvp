import type { Pokemon } from "@/lib/data";
import { displayName } from "@/lib/data";
import { PokemonSprite } from "./PokemonSprite";

export type SlotBadge = "warn" | "good" | null;

/**
 * Columna de 3 cupos, genérica para enemigos y aliados. Cupo vacío = "+"
 * (abre el modal de selección); cupo lleno = sprite + nombre, con badge de
 * advertencia/sugerencia y borde dorado si es el activo en cancha.
 */
export function TeamSlots({
  title,
  team,
  activeIndex,
  badges,
  highlightIndex = null,
  onSelect,
  onAdd,
  onClear,
}: {
  title: string;
  team: (Pokemon | null)[];
  activeIndex: number;
  badges: SlotBadge[];
  highlightIndex?: number | null;
  onSelect: (index: number) => void;
  onAdd: (index: number) => void;
  onClear: (index: number) => void;
}) {
  return (
    <div className="flex flex-col gap-2 items-center">
      <span className="text-[8px] text-neutral-400 uppercase tracking-wide">{title}</span>
      {team.map((p, i) => (
        <div key={i} className="flex flex-col items-center gap-0.5">
          {p ? (
            <div className="relative">
              <button
                onClick={() => onSelect(i)}
                className={`rounded-xl border-2 p-1 flex flex-col items-center gap-0.5 w-20 ${
                  i === activeIndex ? "border-yellow-300 bg-neutral-800" : "border-black bg-neutral-900"
                } ${i === highlightIndex && i !== activeIndex ? "recommended-ring" : ""}`}
                title={displayName(p)}
              >
                <PokemonSprite key={p.speciesId} pokemon={p} facing="front" size={44} />
                <span className="text-[7px] text-neutral-200 truncate w-full text-center">
                  {p.speciesName}
                </span>
              </button>
              {badges[i] && (
                <span
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full border-2 border-black flex items-center justify-center text-white text-[10px] font-bold"
                  style={{ backgroundColor: badges[i] === "warn" ? "#d9483c" : "#3fbf50" }}
                >
                  {badges[i] === "warn" ? "!" : "+"}
                </span>
              )}
              <button
                onClick={() => onClear(i)}
                className="absolute -bottom-1 -left-1 w-4 h-4 rounded-full border border-black bg-neutral-700 text-neutral-300 text-[8px] flex items-center justify-center hover:bg-red-600 hover:text-white"
                title="Quitar"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              onClick={() => onAdd(i)}
              className="w-20 h-[68px] rounded-xl border-2 border-dashed border-neutral-500 text-neutral-500 text-xl flex items-center justify-center hover:border-yellow-300 hover:text-yellow-300"
            >
              +
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
