import type { Pokemon } from "@/lib/data";
import { PokemonSprite } from "./PokemonSprite";

/** Columna "Sus Pokémon": historial de rivales buscados, para volver rápido a uno anterior. */
export function RivalHistory({
  history,
  activeId,
  onSelect,
}: {
  history: Pokemon[];
  activeId: string | null;
  onSelect: (speciesId: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5 items-center">
      <span className="text-[7px] text-neutral-400 [writing-mode:vertical-rl] rotate-180">
        Sus Pokémon
      </span>
      <div className="flex flex-col gap-1.5 max-h-72 overflow-y-auto pixel-scroll">
        {history.length === 0 && (
          <div className="text-[6px] text-neutral-500 w-12 text-center">
            Vacío
          </div>
        )}
        {history.map((p) => (
          <button
            key={p.speciesId}
            onClick={() => onSelect(p.speciesId)}
            className={`rounded-full border-2 ${
              p.speciesId === activeId ? "border-yellow-300" : "border-black"
            }`}
            title={p.speciesName}
          >
            <PokemonSprite pokemon={p} facing="front" size={40} />
          </button>
        ))}
      </div>
    </div>
  );
}
