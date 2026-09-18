import { NEUTRAL_OPPONENT, recommendedMoveset, type LeagueKey, type Pokemon } from "@/lib/data";
import { analyzeMoveset } from "@/lib/recommend";
import { weaknessesTop3 } from "@/lib/weakness";
import { TypeChip, TypeChips } from "./TypeChip";
import { MoveRow } from "./MoveRow";

/**
 * Caja de stats de un combatiente. Cuelga del Pokémon: esquina cortada de
 * 24 px hacia adentro (arriba-izquierda el rival, abajo-derecha vos) y filo de
 * luz en el borde que mira al Pokémon.
 */
export function StatsBox({
  side,
  pokemon,
  opponent,
  league,
}: {
  side: "rival" | "ally";
  pokemon: Pokemon;
  opponent: Pokemon | null;
  league: LeagueKey;
}) {
  const showPower = opponent === null;
  const analysis = analyzeMoveset(pokemon, opponent ?? NEUTRAL_OPPONENT, league);
  // Los cargados se muestran en el orden del moveset de PvPoke (como las
  // mesas), no ordenados por puntaje.
  const chargedOrder = recommendedMoveset(pokemon, league).charged;
  const charged = [...analysis.charged].sort(
    (a, b) => chargedOrder.indexOf(a.moveId) - chargedOrder.indexOf(b.moveId)
  );
  const perspective = side === "rival" ? "theirs" : "mine";
  const hasMoves = analysis.fast !== null || analysis.charged.length > 0;
  const weak = weaknessesTop3(pokemon.types);

  return (
    <div className={`stats ${side === "rival" ? "stats--rival" : "stats--vos"}`}>
      <span className={side === "rival" ? "stats__edge--rival" : "stats__edge--vos"} />

      <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
          <span className="stats__side-tag">{side === "rival" ? "RIVAL" : "VOS"}</span>
          <span className="stats__name">{pokemon.speciesName}</span>
        </span>
        <TypeChips types={pokemon.types} variant="header" />
      </span>

      <span className="stats__divider" />

      {hasMoves ? (
        <>
          <span className="label" style={{ margin: "12px 0 2px" }}>RÁPIDO</span>
          {analysis.fast ? (
            <MoveRow move={analysis.fast} perspective={perspective} showPower={showPower} hairline={!(perspective === "theirs" && analysis.fast.effectiveness >= 1.6 && !showPower)} />
          ) : (
            <EmptyMoves />
          )}

          <span className="label" style={{ margin: "16px 0 2px" }}>CARGADOS</span>
          {charged.length === 0 ? (
            <EmptyMoves />
          ) : (
            charged.map((m, i) => (
              <MoveRow
                key={m.moveId}
                move={m}
                perspective={perspective}
                showPower={showPower}
                hairline={i < charged.length - 1}
              />
            ))
          )}
        </>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "18px 0 6px" }}>
          <span className="label">ATAQUES</span>
          <span style={{ fontSize: 17, lineHeight: 1.5, color: "#9BA3AE" }}>
            El gamemaster todavía no tiene los ataques de este Pokémon.
          </span>
        </div>
      )}

      <span style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 16 }}>
        <span className="label" style={{ letterSpacing: "0.16em" }}>DÉBIL A</span>
        <span style={{ display: "flex", gap: 5 }}>
          {weak.length === 0 && <span style={{ fontSize: 13, color: "#7C8694" }}>Nada, sin debilidades dobles</span>}
          {weak.map((t) => (
            <TypeChip key={t} type={t} variant="weak" />
          ))}
        </span>
      </span>
    </div>
  );
}

function EmptyMoves() {
  return (
    <div className="move-row move-row--hairline" style={{ color: "#7C8694", fontSize: 15 }}>
      Sin ataque en el gamemaster
    </div>
  );
}
