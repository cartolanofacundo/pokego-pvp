"use client";

import { useMemo } from "react";
import { analyzeEntry, dexRows, DEX_MAX_RANK, type BoxEntry } from "@/lib/ranker/analysis";
import { RANKER_LEAGUES, getSpecies, type RankerLeagueKey } from "@/lib/ranker/data";
import { formatLevel } from "@/lib/ranker/cp";
import { fmt } from "@/lib/ranker/format";
import type { RankerSettings } from "@/lib/ranker/box";
import { withBasePath } from "@/lib/basePath";
import { EvolveCostText, LevelCostText, ThirdMoveText } from "./Costs";

export type DexMode = "utiles" | "caja";

/** Mejor rango (100 o menos gana) de un Pokémon entre sus formas y ligas, para la caja completa. */
function bestOf(entry: BoxEntry, settings: RankerSettings) {
  let best: { rank: number; league: string; form: string } | null = null;
  for (const r of analyzeEntry(entry, settings)) {
    if (r.target.isMega) continue;
    for (const c of r.cells) {
      if (!c.row || c.overLevel) continue;
      if (!best || c.row.rank < best.rank) best = { rank: c.row.rank, league: c.league.short, form: r.target.species.name };
    }
  }
  return best;
}

export function DexView({
  entries,
  settings,
  league,
  mode,
  onLeague,
  onMode,
  onOpen,
  onDelete,
}: {
  entries: BoxEntry[];
  settings: RankerSettings;
  league: RankerLeagueKey;
  mode: DexMode;
  onLeague: (l: RankerLeagueKey) => void;
  onMode: (m: DexMode) => void;
  onOpen: (e: BoxEntry) => void;
  onDelete: (id: string) => void;
}) {
  const byLeague = useMemo(
    () => Object.fromEntries(RANKER_LEAGUES.map((l) => [l.key, dexRows(entries, l.key, settings)])) as Record<RankerLeagueKey, ReturnType<typeof dexRows>>,
    [entries, settings]
  );
  const rows = byLeague[league];
  const box = useMemo(
    () =>
      [...entries]
        .map((e) => ({ entry: e, species: getSpecies(e.speciesId)!, best: bestOf(e, settings) }))
        .sort((a, b) => a.species.dex - b.species.dex || a.species.id.localeCompare(b.species.id) || b.entry.addedAt - a.entry.addedAt),
    [entries, settings]
  );
  const leagueLabel = RANKER_LEAGUES.find((l) => l.key === league)!.label;

  return (
    <div className="rk-panel" style={{ flexGrow: 1, minWidth: 0, minHeight: 0, gap: 16 }}>
      <span className="panel__edge" style={{ left: 18 }} />
      <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <span role="tablist" style={{ display: "flex", gap: 6 }}>
          <button type="button" role="tab" className="rk-tab" aria-selected={mode === "utiles"} onClick={() => onMode("utiles")}>
            Rango {DEX_MAX_RANK} o mejor
          </button>
          <button type="button" role="tab" className="rk-tab" aria-selected={mode === "caja"} onClick={() => onMode("caja")}>
            Toda la caja <span className="rk-count">{entries.length}</span>
          </button>
        </span>
        {mode === "utiles" && (
          <span className="rk-seg" role="group" aria-label="Liga">
            {RANKER_LEAGUES.map((l) => (
              <button key={l.key} type="button" aria-pressed={l.key === league} onClick={() => onLeague(l.key)}>
                {l.short} <span style={{ opacity: 0.7 }}>{byLeague[l.key].length}</span>
              </button>
            ))}
          </span>
        )}
      </div>

      <div className="scroll-list" style={{ minHeight: 0, flexGrow: 1, overflowX: "auto" }}>
        {mode === "utiles" ? (
          rows.length === 0 ? (
            <p className="rk-note" style={{ padding: "12px 4px" }}>
              Ningún Pokémon de tu caja tiene rango {DEX_MAX_RANK} o mejor en {leagueLabel}.
            </p>
          ) : (
            <table className="rk-table">
              <thead>
                <tr>
                  <th>PVPOKE</th>
                  <th>POKÉMON</th>
                  <th>IV</th>
                  <th>RANGO IV</th>
                  <th>RINDE EN</th>
                  <th>AHORA</th>
                  <th>EVOLUCIÓN</th>
                  <th>SUBIR DE NIVEL</th>
                  {settings.showThirdMove && <th>3.ER ATAQUE</th>}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const from = getSpecies(r.entry.speciesId)!;
                  const evolved = r.target.path.length > 1;
                  return (
                    <tr key={`${r.entry.id}-${r.target.species.id}`} onClick={() => onOpen(r.entry)} style={{ cursor: "pointer" }}>
                      <td className="rk-num" style={{ fontSize: 16, fontWeight: 600 }}>{r.cell.pvpoke ? `#${fmt(r.cell.pvpoke)}` : "—"}</td>
                      <td>
                        <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img className="rk-sprite" src={withBasePath(`/sprites/pixel/${r.target.species.id}.png`)} alt="" width={44} height={44} />
                          <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                            <span style={{ fontSize: 15.5, fontWeight: 600 }}>{r.target.species.name}</span>
                            {(evolved || r.target.isMega) && <span className="rk-cost">de {from.name}</span>}
                          </span>
                        </span>
                      </td>
                      <td className="rk-num">{r.entry.atk}/{r.entry.def}/{r.entry.sta}</td>
                      <td>
                        <span className="rk-rank rk-rank--good" style={{ fontSize: 22 }}>#{r.cell.row!.rank}</span>
                      </td>
                      <td className="rk-cost">
                        CP <b>{fmt(r.cell.row!.cp)}</b> · nivel <b>{formatLevel(r.cell.row!.level)}</b>
                      </td>
                      <td className="rk-cost">
                        CP {fmt(r.entry.cp)} · nivel {formatLevel(r.entry.level)}
                      </td>
                      <td>
                        <EvolveCostText candy={r.target.evolveCandy} evolved={evolved} />
                      </td>
                      <td>{r.cell.level && <LevelCostText cost={r.cell.level} />}</td>
                      {settings.showThirdMove && (
                        <td>
                          <ThirdMoveText cost={r.third} bare />
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )
        ) : box.length === 0 ? (
          <p className="rk-note" style={{ padding: "12px 4px" }}>
            Tu caja está vacía. Cargá Pokémon desde la pestaña Cargar, o importá un archivo exportado antes.
          </p>
        ) : (
          <table className="rk-table">
            <thead>
              <tr>
                <th>#</th>
                <th>POKÉMON</th>
                <th>IV</th>
                <th>CP</th>
                <th>NIVEL</th>
                <th>MEJOR RANGO</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {box.map(({ entry, species, best }) => (
                <tr key={entry.id}>
                  <td className="rk-num" style={{ color: "#9CA6B2" }}>{species.dex}</td>
                  <td>
                    <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img className="rk-sprite" src={withBasePath(`/sprites/pixel/${species.id}.png`)} alt="" width={40} height={40} />
                      <span style={{ fontSize: 15.5, fontWeight: 600 }}>{species.name}</span>
                    </span>
                  </td>
                  <td className="rk-num">{entry.atk}/{entry.def}/{entry.sta}</td>
                  <td className="rk-num">{fmt(entry.cp)}</td>
                  <td className="rk-num">{formatLevel(entry.level)}</td>
                  <td>
                    {best ? (
                      <span style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                        <span className={`rk-rank ${best.rank <= DEX_MAX_RANK ? "rk-rank--good" : ""}`} style={{ fontSize: 20 }}>#{fmt(best.rank)}</span>
                        <span className="rk-cost">
                          {best.league} como {best.form}
                        </span>
                      </span>
                    ) : (
                      <span className="rk-cost">No entra en ninguna liga</span>
                    )}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <span style={{ display: "inline-flex", gap: 6 }}>
                      <button type="button" className="btn" style={{ height: 34, padding: "0 12px", fontSize: 13 }} onClick={() => onOpen(entry)}>
                        Ver
                      </button>
                      <button type="button" className="btn btn--ghost" style={{ height: 34, padding: "0 12px", fontSize: 13 }} onClick={() => onDelete(entry.id)}>
                        Quitar
                      </button>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
