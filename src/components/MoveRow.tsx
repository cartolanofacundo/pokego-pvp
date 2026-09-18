import { getMove } from "@/lib/data";
import { formatMult, type MoveScore } from "@/lib/recommend";
import { TypeChip } from "./TypeChip";
import { BoltIcon, ClockIcon, WarningIcon } from "./Icons";

/**
 * Fila de ataque de la caja de stats. `perspective` decide el color del
 * multiplicador: "theirs" (ataque del rival contra mí: súper efectivo = rojo)
 * o "mine" (mi ataque contra el rival: súper efectivo = verde). Sin rival en
 * campo (`showPower`) la columna de la derecha muestra el poder base y
 * conserva el ancho.
 */
export function MoveRow({
  move,
  perspective,
  showPower,
  hairline,
}: {
  move: MoveScore;
  perspective: "mine" | "theirs";
  showPower: boolean;
  hairline: boolean;
}) {
  const data = getMove(move.moveId);
  const isFast = move.isFast;
  const energyText = isFast ? `+${data?.energyGain ?? 0}` : `${move.energy}`;
  const turnsText = isFast ? `${data?.turns ?? 0}` : move.turnsToCharge != null ? `${move.turnsToCharge}` : "—";

  const mult = move.effectiveness;
  const strong = mult >= 1.6;
  const weak = mult <= 0.63;
  const danger = perspective === "theirs" && strong && !showPower;
  const colorClass = showPower
    ? ""
    : strong
      ? perspective === "mine" ? "mult--good" : "mult--bad"
      : weak
        ? perspective === "mine" ? "mult--bad" : "mult--good"
        : "mult--neutral";

  return (
    <div className={`move-row ${hairline ? "move-row--hairline" : ""} ${danger ? "move-row--danger" : ""}`}>
      <TypeChip type={move.type} variant="row" />
      <span className="move-row__name">{move.name}</span>
      <span className="pill">
        <BoltIcon />
        <span className="pill__value">{energyText}</span>
      </span>
      <span className="pill">
        <ClockIcon />
        <span className="pill__value">{turnsText}</span>
      </span>
      {danger && <WarningIcon label="Cuidado: te pega fuerte" />}
      {showPower ? (
        <span className="power">
          <span className="power__value">{move.power}</span>
          <span className="power__label">PODER</span>
        </span>
      ) : (
        <span className={`mult ${colorClass}`}>{formatMult(mult)}</span>
      )}
    </div>
  );
}
