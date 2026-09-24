import type { LevelCost, ThirdMoveCost } from "@/lib/ranker/costs";
import { fmt, fmtDust } from "@/lib/ranker/format";

/** "72 car · 16 XL · 71,2 mil polvo", con aviso de mejor amigo si hace falta. */
export function LevelCostText({ cost }: { cost: LevelCost }) {
  if (!cost.candy && !cost.xl && !cost.dust) {
    return <span className="rk-cost">{cost.needsBuddy ? "Solo falta el +1 de mejor amigo" : "Ya está en el nivel"}</span>;
  }
  return (
    <span className="rk-cost">
      <b>{fmt(cost.candy)}</b> car
      {cost.xl > 0 && (
        <>
          {" · "}
          <b>{fmt(cost.xl)}</b> XL
        </>
      )}
      {" · "}
      <b>{fmtDust(cost.dust)}</b> polvo
      {cost.needsBuddy && " · + mejor amigo"}
    </span>
  );
}

export function EvolveCostText({ candy, evolved }: { candy: number | null; evolved: boolean }) {
  if (!evolved) return <span className="rk-cost">Sin evolucionar</span>;
  if (candy === null) return <span className="rk-cost">Evolución: costo sin datos</span>;
  return (
    <span className="rk-cost">
      Evolución <b>{fmt(candy)}</b> car
    </span>
  );
}

/** `bare` omite la etiqueta cuando la columna de la tabla ya la dice. */
export function ThirdMoveText({ cost, bare = false }: { cost: ThirdMoveCost | null; bare?: boolean }) {
  if (!cost || (cost.candy === null && cost.dust === null)) return <span className="rk-cost">{bare ? "Sin datos" : "3.er ataque: sin datos"}</span>;
  return (
    <span className="rk-cost">
      {bare ? "" : "3.er ataque "}<b>{cost.candy === null ? "—" : fmt(cost.candy)}</b> car · <b>{cost.dust === null ? "—" : fmtDust(cost.dust)}</b> polvo
    </span>
  );
}
