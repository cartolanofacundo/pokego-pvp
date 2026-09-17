import { formatMult } from "@/lib/recommend";

/**
 * Badge de color que muestra si un ataque conviene o no, siempre desde MI
 * punto de vista: verde = bueno para mí, rojo = malo para mí.
 *
 * `perspective="mine"`: el ataque es mío contra el rival (súper efectivo =
 * verde, "le pego fuerte"). `perspective="theirs"`: el ataque es del rival
 * contra mí (súper efectivo = rojo, "me pega fuerte"; resistido = verde,
 * "lo resisto").
 */
export function EffectBadge({
  mult,
  perspective,
}: {
  mult: number;
  perspective: "mine" | "theirs";
}) {
  if (mult >= 0.9 && mult <= 1.1) return null; // neutral: no se muestra nada

  const superEffective = mult >= 1.5;
  const good = perspective === "mine" ? superEffective : !superEffective;
  const color = good ? "#3fbf50" : "#d9483c";
  const sign = good ? "+" : "!";
  const doubled = mult >= 2 || mult <= 0.5;

  return (
    <span
      className="inline-flex items-center gap-0.5 rounded-full border-2 border-black px-1 text-[8px] font-bold text-white"
      style={{ backgroundColor: color }}
      title={formatMult(mult)}
    >
      {sign}
      {doubled ? sign : ""}
      <span className="opacity-80">{formatMult(mult)}</span>
    </span>
  );
}
