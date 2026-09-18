import type { Pokemon } from "@/lib/data";
import { withBasePath } from "@/lib/basePath";
import type { Combo } from "@/lib/shortcuts";
import { PlusIcon } from "./Icons";
import { Kbd } from "./Kbd";

export type Side = "rival" | "ally";

export interface CardStatus {
  text: string;
  dot: string;
  color: string;
}

export const STATUS = {
  field: { text: "EN CAMPO", dot: "#C9CFD8", color: "#C9CFD8" },
  bench: { text: "EN BANCA", dot: "rgba(255,255,255,0.22)", color: "#7C8694" },
  rivalWins: { text: "TE GANA", dot: "#FF6B6B", color: "#FF8F8F" },
  rivalEven: { text: "PAREJO", dot: "#F2B14C", color: "#F5C478" },
  rivalLoses: { text: "LE GANÁS", dot: "#3FDD8F", color: "#6FE6AC" },
  allyWins: { text: "GANA", dot: "#3FDD8F", color: "#6FE6AC" },
  allyEven: { text: "PAREJO", dot: "#F2B14C", color: "#F5C478" },
  allyLoses: { text: "PIERDE", dot: "#FF6B6B", color: "#FF8F8F" },
} satisfies Record<string, CardStatus>;

export function Card({
  side,
  slot,
  pokemon,
  active,
  status,
  onSelect,
}: {
  side: Side;
  slot: number;
  pokemon: Pokemon;
  active: boolean;
  status: CardStatus;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      className={`card card--${side === "rival" ? "rival" : "vos"} ${active ? "card--active" : "card--bench"}`}
      aria-current={active ? "true" : undefined}
      aria-label={`${pokemon.speciesName}, ${status.text.toLowerCase()}${active ? ", en campo" : ""}`}
      data-side={side}
      data-slot={slot}
      onClick={onSelect}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="card__sprite" src={withBasePath(`/sprites/pixel/${pokemon.speciesId}.png`)} alt="" />
      <span style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
        <span className="card__name">{pokemon.speciesName}</span>
        <span className="card__status">
          <span className="card__dot" style={{ background: status.dot }} />
          <span className="card__status-text" style={{ color: status.color }}>{status.text}</span>
        </span>
      </span>
    </button>
  );
}

export function EmptyCard({
  side,
  slot,
  combo,
  onAdd,
}: {
  side: Side;
  slot: number;
  /** Atajo a mostrar; solo el primer cupo vacío de cada riel lo lleva. */
  combo: Combo | null;
  onAdd: () => void;
}) {
  const label = `${side === "rival" ? "Rival" : "Aliado"} ${slot + 1}`;
  return (
    <button
      type="button"
      className={`card card--empty card--${side === "rival" ? "rival" : "vos"}`}
      aria-label={`Agregar ${label.toLowerCase()}`}
      data-side={side}
      data-slot={slot}
      onClick={onAdd}
    >
      <PlusIcon size={16} />
      <span>{label}</span>
      {combo && <Kbd combo={combo} />}
    </button>
  );
}
