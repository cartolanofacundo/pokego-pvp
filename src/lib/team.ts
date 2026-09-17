// Puntaje de "a quién conviene sacar" para los 3 miembros del equipo contra
// el rival activo: ofensiva (cuánto le pego) + defensiva (cuánto me pega) +
// bonus de matchup/counter de PvPoke cuando existe.

import type { LeagueKey, Pokemon } from "./data";
import { analyzeMoveset } from "./recommend";

export type SwitchLabel = "best" | "good" | "risky" | "avoid";

export interface TeamMemberScore {
  speciesId: string;
  offense: number; // 0-1 normalizado dentro del equipo
  defense: number; // 0-1, mayor = más resiste al rival
  pvpokeBonus: number; // 0-1, a partir de matchups/counters si existen
  total: number;
  label: SwitchLabel;
  bestAttack: string | null; // nombre del mejor ataque cargado mío
  worstIncoming: string | null; // nombre del ataque del rival que más me pega
  pvpokeRating: number | null; // rating 0-1000 si estaba en matchups/counters
}

const WEIGHTS = { offense: 0.45, defense: 0.4, pvpoke: 0.15 };

function pvpokeRatingAgainst(me: Pokemon, rival: Pokemon, league: LeagueKey): number | null {
  const stats = me.leagues[league];
  if (!stats) return null;
  if (stats.matchups[rival.speciesId] !== undefined) return stats.matchups[rival.speciesId];
  if (stats.counters[rival.speciesId] !== undefined) return stats.counters[rival.speciesId];
  return null;
}

/**
 * Puntúa y ordena hasta 3 miembros del equipo contra `rival`. Cada miembro
 * recibe una etiqueta (best/good/risky/avoid) para el badge de switch.
 */
export function rankTeamAgainst(
  team: (Pokemon | null)[],
  rival: Pokemon,
  league: LeagueKey
): (TeamMemberScore | null)[] {
  const present = team.filter((p): p is Pokemon => p !== null);
  if (present.length === 0) return team.map(() => null);

  const raw = present.map((me) => {
    const mine = analyzeMoveset(me, rival, league);
    const theirs = analyzeMoveset(rival, me, league);

    const offenseRaw = mine.best?.score ?? 0;
    // Defensa: qué tan poco me pegan los ataques del rival (menor efectividad = mejor).
    const worstMult = Math.max(
      theirs.fast?.effectiveness ?? 1,
      ...theirs.charged.map((c) => c.effectiveness)
    );
    const defenseRaw = 1 / worstMult; // 0.39x -> ~2.56, 2.56x -> ~0.39

    const pvpokeRating = pvpokeRatingAgainst(me, rival, league);

    return {
      speciesId: me.speciesId,
      offenseRaw,
      defenseRaw,
      pvpokeRating,
      bestAttack: mine.best?.name ?? null,
      worstIncoming:
        [theirs.fast, ...theirs.charged]
          .filter((m): m is NonNullable<typeof m> => m !== null)
          .sort((a, b) => b.effectiveness - a.effectiveness)[0]?.name ?? null,
      worstMult,
    };
  });

  const maxOffense = Math.max(...raw.map((r) => r.offenseRaw), 1);
  const maxDefense = Math.max(...raw.map((r) => r.defenseRaw), 1);

  const scored: TeamMemberScore[] = raw.map((r) => {
    const offense = r.offenseRaw / maxOffense;
    const defense = r.defenseRaw / maxDefense;
    const pvpokeBonus = r.pvpokeRating !== null ? r.pvpokeRating / 1000 : offense * 0.5 + defense * 0.5;

    // Si no hay dato de PvPoke, repartimos su peso entre ofensiva/defensiva.
    const hasPvpoke = r.pvpokeRating !== null;
    const total = hasPvpoke
      ? WEIGHTS.offense * offense + WEIGHTS.defense * defense + WEIGHTS.pvpoke * pvpokeBonus
      : (WEIGHTS.offense / (1 - WEIGHTS.pvpoke)) * offense +
        (WEIGHTS.defense / (1 - WEIGHTS.pvpoke)) * defense;

    let label: SwitchLabel = "good";
    if (r.worstMult >= 2 && offense < 0.5) label = "avoid";
    else if (defense >= 0.9 || offense >= 0.9) label = "best";
    else if (r.worstMult >= 1.6) label = "risky";

    return {
      speciesId: r.speciesId,
      offense,
      defense,
      pvpokeBonus,
      total,
      label,
      bestAttack: r.bestAttack,
      worstIncoming: r.worstIncoming,
      pvpokeRating: r.pvpokeRating,
    };
  });

  // El de mayor puntaje total se marca "best" aunque no cumpliera el umbral.
  const topIdx = scored.reduce(
    (best, cur, i) => (cur.total > scored[best].total ? i : best),
    0
  );
  scored[topIdx] = { ...scored[topIdx], label: "best" };

  const bySpeciesId = new Map(scored.map((s) => [s.speciesId, s]));
  return team.map((p) => (p ? bySpeciesId.get(p.speciesId) ?? null : null));
}
