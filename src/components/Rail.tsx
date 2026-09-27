import type { Pokemon } from "@/lib/data";
import type { Combo } from "@/lib/shortcuts";
import { Card, EmptyCard, type CardStatus, type Side } from "./Card";
import { u } from "@/lib/scale";

export function Rail({
  side,
  team,
  activeIndex,
  statuses,
  addCombo,
  onSelect,
  onAdd,
}: {
  side: Side;
  team: (Pokemon | null)[];
  activeIndex: number;
  statuses: (CardStatus | null)[];
  addCombo: Combo | null;
  onSelect: (slot: number) => void;
  onAdd: (slot: number) => void;
}) {
  const firstEmpty = team.findIndex((p) => p === null);
  const isRival = side === "rival";
  return (
    <div style={{ display: "flex", flexDirection: "column", width: u(288), flexShrink: 0, height: "100%" }}>
      <span className="label label--rail" style={{ textAlign: isRival ? "left" : "right" }}>
        {isRival ? "EQUIPO RIVAL" : "TU EQUIPO"}
      </span>

      <div
        data-coach={isRival ? "rival-rail" : "ally-rail"}
        style={{
          display: "flex", flexDirection: "column", gap: u(10),
          // Anclados a su borde (89 px arriba / 147 abajo, de diseño). Las
          // fichas escalan con --u igual que la caja y el escenario, así que
          // esta distancia siempre deja lugar de sobra antes del horizonte,
          // sin necesitar un tope calculado a mano para cada resolución.
          marginTop: isRival ? u(89) : "auto",
          marginBottom: isRival ? 0 : u(147),
        }}
      >
        {team.map((p, i) =>
          p ? (
            <Card
              key={i}
              side={side}
              slot={i}
              pokemon={p}
              active={i === activeIndex}
              status={statuses[i] ?? { text: "", dot: "transparent", color: "transparent" }}
              onSelect={() => onSelect(i)}
            />
          ) : (
            <EmptyCard key={i} side={side} slot={i} combo={i === firstEmpty ? addCombo : null} onAdd={() => onAdd(i)} />
          )
        )}
      </div>

      {isRival && (
        // A la derecha de la marca en L de la esquina (Track.tsx): la marca
        // ocupa u(22) desde el borde, así que con este padding no se pisan.
        <span
          className="mono"
          style={{ fontSize: 10, lineHeight: 1.6, letterSpacing: "0.04em", color: "#8A93A0", marginTop: "auto", paddingLeft: u(32) }}
        >
          DATOS PVPOKE
          <br />
          SPRITES POKEAPI
          <br />
          SPRITES SHOWDOWN
        </span>
      )}
    </div>
  );
}
