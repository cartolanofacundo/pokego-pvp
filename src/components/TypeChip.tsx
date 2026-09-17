import { TYPE_COLORS, type PokemonType } from "@/lib/types";
import { typeLabelEs } from "@/lib/typeLabels";

export function TypeChip({
  type,
  size = "md",
}: {
  type: string;
  size?: "sm" | "md";
}) {
  const color = TYPE_COLORS[type as PokemonType] ?? "#888";
  const padding = size === "sm" ? "px-1.5 py-0.5 text-[8px]" : "px-2 py-1 text-[9px]";
  return (
    <span
      className={`inline-block rounded border-2 border-black uppercase tracking-tight text-white ${padding}`}
      style={{ backgroundColor: color, textShadow: "1px 1px 0 rgba(0,0,0,0.4)" }}
    >
      {typeLabelEs(type)}
    </span>
  );
}

export function TypeChips({
  types,
  size = "md",
}: {
  types: readonly (string | null | undefined)[];
  size?: "sm" | "md";
}) {
  const valid = types.filter((t): t is string => !!t && t !== "none");
  return (
    <div className="flex gap-1 flex-wrap">
      {valid.map((t) => (
        <TypeChip key={t} type={t} size={size} />
      ))}
    </div>
  );
}
