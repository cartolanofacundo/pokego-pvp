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
  field: { text: "EN CAMPO", dot: "#DCE1E7", color: "#DCE1E7" },
  bench: { text: "EN BANCA", dot: "rgba(255,255,255,0.22)", color: "#9CA6B2" },
  rivalWins: { text: "TE GANA", dot: "#FF7E7E", color: "#FFA6A6" },
  rivalEven: { text: "PAREJO", dot: "#F8C066", color: "#FAD190" },
  rivalLoses: { text: "LE GANÁS", dot: "#52E79D", color: "#86EFBC" },
  allyWins: { text: "GANA", dot: "#52E79D", color: "#86EFBC" },
  allyEven: { text: "PAREJO", dot: "#F8C066", color: "#FAD190" },
  allyLoses: { text: "PIERDE", dot: "#FF7E7E", color: "#FFA6A6" },
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
