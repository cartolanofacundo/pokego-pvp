import type { Pokemon } from "@/lib/data";
import type { Combo } from "@/lib/shortcuts";
import { Card, EmptyCard, type CardStatus, type Side } from "./Card";

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
    <div style={{ display: "flex", flexDirection: "column", width: 288, flexShrink: 0 }}>
      <span className="label label--rail" style={{ textAlign: isRival ? "left" : "right" }}>
        {isRival ? "EQUIPO RIVAL" : "TU EQUIPO"}
      </span>

      <div
        style={{
          display: "flex", flexDirection: "column", gap: 10,
          marginTop: isRival ? 89 : "auto",
          marginBottom: isRival ? 0 : 147,
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
        <span
          className="mono"
          style={{ fontSize: 10, lineHeight: 1.6, letterSpacing: "0.04em", color: "#626A75", marginTop: "auto" }}
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
