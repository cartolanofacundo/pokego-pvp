"use client";

import { useMemo } from "react";
import { analyzeEntry, DEX_MAX_RANK, type BoxEntry } from "@/lib/ranker/analysis";
import { getSpecies } from "@/lib/ranker/data";
import { formatLevel } from "@/lib/ranker/cp";
import { fmt } from "@/lib/ranker/format";
import type { RankerSettings } from "@/lib/ranker/box";
import { withBasePath } from "@/lib/basePath";
import { TypeChips } from "@/components/TypeChip";
import { EvolveCostText, LevelCostText, ThirdMoveText } from "./Costs";

const CAP_LABEL: Record<string, string> = { little: "CP 500", great: "CP 1.500", ultra: "CP 2.500", master: "Sin tope" };

/**
 * Detalle de un Pokémon cargado: una fila por forma a la que puede llegar
 * (él mismo, cada evolución, cada Mega) y una columna por tope de CP. Cada
 * celda da el rango de IV (verde si es 100 o mejor), el CP y el nivel donde
 * rinde, el puesto de la especie en PvPoke y lo que cuesta subirlo.
 */
export function EntryDetail({ entry, settings, onDelete }: { entry: BoxEntry; settings: RankerSettings; onDelete: () => void }) {
  const species = getSpecies(entry.speciesId)!;
  const results = useMemo(() => analyzeEntry(entry, settings), [entry, settings]);

  return (
    <div className="rk-panel" style={{ flexGrow: 1, minHeight: 0, gap: 18 }}>
      <span className="panel__edge" style={{ left: 18 }} />
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="rk-sprite" src={withBasePath(`/sprites/pixel/${species.id}.png`)} alt="" width={84} height={84} />
        <div style={{ display: "flex", flexDirection: "column", gap: 6, flexGrow: 1, minWidth: 0 }}>
          <span style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
            <span className="display" style={{ fontSize: 30, fontWeight: 800, letterSpacing: "-0.03em" }}>{species.name}</span>
            <span className="rk-num" style={{ color: "#9CA6B2" }}>#{species.dex}</span>
            <TypeChips types={species.types} variant="header" />
          </span>
          <span className="rk-num" style={{ fontSize: 15, color: "#DCE1E7" }}>
            {entry.atk}/{entry.def}/{entry.sta} · CP {fmt(entry.cp)} · nivel {formatLevel(entry.level)}
          </span>
        </div>
        <button type="button" className="btn btn--ghost" style={{ height: 38, fontSize: 13.5 }} onClick={onDelete}>
          Quitar de la caja
        </button>
      </div>

      <div className="scroll-list" style={{ minHeight: 0, display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(150px, 240px) repeat(4, minmax(0, 1fr))", gap: 8, position: "sticky", top: 0, zIndex: 1, background: "#161a20", padding: "6px 0" }}>
          <span />
          {results[0]?.cells.map((c) => (
            <span key={c.league.key} style={{ display: "flex", flexDirection: "column", gap: 2, padding: "0 4px" }}>
              <span style={{ fontSize: 15, fontWeight: 600 }}>{c.league.short}</span>
              <span className="label" style={{ fontSize: 10 }}>{CAP_LABEL[c.league.key]}</span>
            </span>
          ))}
        </div>

        {results.map((r) => (
          <div key={r.target.species.id} style={{ display: "grid", gridTemplateColumns: "minmax(150px, 240px) repeat(4, minmax(0, 1fr))", gap: 8 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "10px 4px", minWidth: 0 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="rk-sprite" src={withBasePath(`/sprites/pixel/${r.target.species.id}.png`)} alt="" width={44} height={44} />
                <span style={{ fontSize: 15.5, fontWeight: 600, lineHeight: 1.25 }}>Como {r.target.species.name}</span>
              </span>
              <EvolveCostText candy={r.target.evolveCandy} evolved={r.target.path.length > 1} />
              {r.target.isMega && <span className="rk-cost">Más energía Mega</span>}
              {settings.showThirdMove && <ThirdMoveText cost={r.third} />}
            </div>

            {r.cells.map((c) => {
              if (!c.row) {
                return (
                  <div key={c.league.key} className="rk-cell" style={{ justifyContent: "center" }}>
                    <span className="rk-note">No entra en esta liga</span>
                  </div>
                );
              }
              const good = c.row.rank <= DEX_MAX_RANK && !c.overLevel;
              return (
                <div key={c.league.key} className={`rk-cell ${good ? "rk-cell--good" : ""}`}>
                  <span style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                    <span className={`rk-rank ${good ? "rk-rank--good" : c.overLevel ? "rk-rank--off" : ""}`} style={{ fontSize: 30 }}>
                      #{fmt(c.row.rank)}
                    </span>
                    <span className="rk-cost">{c.row.pct.toFixed(1)} %</span>
                  </span>
                  <span className="rk-cost">
                    CP <b>{fmt(c.row.cp)}</b> · nivel <b>{formatLevel(c.row.level)}</b>
                  </span>
                  <span className="rk-cost">
                    PvPoke {c.pvpoke ? <b>#{fmt(c.pvpoke)}</b> : "sin puesto"}
                    {r.target.isMega && c.league.key !== "little" ? " (Mega)" : ""}
                  </span>
                  {c.overLevel ? (
                    <span className="rk-error" style={{ fontSize: 12.5 }}>
                      Ya está en nivel {formatLevel(entry.level)}: se pasa del tope
                    </span>
                  ) : (
                    c.level && <LevelCostText cost={c.level} />
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
