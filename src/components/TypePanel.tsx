import { weaknesses, resistances, TYPE_COLORS, type PokemonType } from "@/lib/types";
import { formatMult } from "@/lib/recommend";
import { typeLabelEs } from "@/lib/typeLabels";

/**
 * Panel compacto de debilidades/resistencias. Un tipo se resalta a color
 * pleno + multiplicador solo si está en `relevantTypes` (los tipos de ataque
 * que el equipo rival realmente usa); el resto queda atenuado y sin texto,
 * para no ocupar espacio con información que no aplica ahora.
 *
 * `side` decide la connotación de color: para el enemigo, ser débil a algo
 * que le pego es bueno para mí (verde); para el mío, ser débil a algo que me
 * pegan es malo para mí (rojo). Resistir es al revés en cada caso.
 */
export function TypePanel({
  types,
  relevantTypes,
  side,
}: {
  types: readonly (string | null | undefined)[];
  relevantTypes: Set<PokemonType>;
  side: "enemy" | "ally";
}) {
  const weak = weaknesses(types);
  const resist = resistances(types);

  const weakGood = side === "enemy"; // débil + relevante: bueno para mí si es el enemigo
  const resistGood = side === "ally"; // resiste + relevante: bueno para mí si es el mío

  return (
    <div className="flex flex-col gap-1 text-[8px] w-[110px]">
      <TypeRow label="Débil" matchups={weak} relevant={relevantTypes} good={weakGood} />
      <TypeRow label="Resiste" matchups={resist} relevant={relevantTypes} good={resistGood} />
    </div>
  );
}

function TypeRow({
  label,
  matchups,
  relevant,
  good,
}: {
  label: string;
  matchups: { type: string; multiplier: number }[];
  relevant: Set<PokemonType>;
  good: boolean;
}) {
  if (matchups.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-0.5 items-center">
      <span className="text-neutral-400 mr-0.5">{label}:</span>
      {matchups.map((m) => {
        const isRelevant = relevant.has(m.type as PokemonType);
        const color = TYPE_COLORS[m.type as PokemonType] ?? "#888";
        if (!isRelevant) {
          return (
            <span
              key={m.type}
              className="rounded border border-black/30 px-1 opacity-35 text-white"
              style={{ backgroundColor: color, fontSize: "7px" }}
            >
              {typeLabelEs(m.type).slice(0, 3)}
            </span>
          );
        }
        return (
          <span
            key={m.type}
            className="rounded border-2 border-black px-1 font-bold text-white flex items-center gap-0.5"
            style={{
              backgroundColor: color,
              boxShadow: good ? "0 0 0 2px #3fbf50" : "0 0 0 2px #d9483c",
            }}
          >
            {typeLabelEs(m.type)}
            <span className="opacity-80">{formatMult(m.multiplier)}</span>
          </span>
        );
      })}
    </div>
  );
}
