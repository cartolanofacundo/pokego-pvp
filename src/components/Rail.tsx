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
        data-coach={isRival ? "rival-rail" : "ally-rail"}
        style={{
          display: "flex", flexDirection: "column", gap: 10,
          // Anclados a su borde (89 arriba / 147 abajo a 1080 de alto), pero sin
          // cruzar el horizonte más de lo que cruzan en el diseño (33 px el
          // rival por debajo, 31 px el propio por debajo): en ventanas bajas los
          // márgenes ceden para que las fichas no invadan el campo contrario.
          marginTop: isRival ? "min(89px, calc(var(--h) * 0.47 - 419px))" : "auto",
          marginBottom: isRival ? 0 : "min(147px, calc(var(--h) * 0.53 - 425px))",
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
          style={{ fontSize: 10, lineHeight: 1.6, letterSpacing: "0.04em", color: "#8A93A0", marginTop: "auto" }}
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
