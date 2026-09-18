import type { Combo } from "@/lib/shortcuts";
import { PlusIcon } from "./Icons";
import { Kbd } from "./Kbd";

/** Cartel que reemplaza la caja de stats cuando falta el Pokémon de ese lado. */
export function EmptyBox({
  side,
  variant,
  combo,
  onAdd,
}: {
  side: "rival" | "ally";
  /** "rival": sin rival en campo. "first": primer arranque, la única acción obligatoria. */
  variant: "rival" | "first";
  combo: Combo | null;
  onAdd: () => void;
}) {
  const isFirst = variant === "first";
  return (
    <div className={`stats stats--empty ${side === "rival" ? "stats--rival" : "stats--vos"}`}>
      <span className="label" style={{ fontSize: 11 }}>
        {isFirst ? "EMPEZÁ POR ACÁ" : "SIN RIVAL EN CAMPO"}
      </span>
      <span style={{ fontSize: 19, lineHeight: 1.5, color: "#B4BCC6", maxWidth: 470 }}>
        {isFirst
          ? "Armá tu equipo de tres. Queda guardado entre combates, así la próxima vez solo cargás los rivales."
          : "Cargá al Pokémon que tenés enfrente y acá aparecen sus ataques, cuánto te pegan y en cuántos turnos cargan."}
      </span>
      <button
        type="button"
        className={`btn btn--box ${isFirst ? "btn--primary" : ""}`}
        style={{ alignSelf: "flex-start", marginTop: 4 }}
        onClick={onAdd}
      >
        <PlusIcon size={15} color={isFirst ? "#0B0D11" : "#F2F3F5"} width={isFirst ? 1.8 : 1.7} />
        <span>{isFirst ? "Agregar mi primer Pokémon" : "Agregar rival"}</span>
        {combo && (
          <Kbd
            combo={combo}
            style={isFirst ? { background: "rgba(11,13,17,0.12)", color: "#3A424C" } : { background: "rgba(255,255,255,0.09)" }}
          />
        )}
      </button>
    </div>
  );
}
