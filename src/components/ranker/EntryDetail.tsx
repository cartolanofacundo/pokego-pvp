"use client";

import { useMemo } from "react";
import { analyzeEntry, type BoxEntry } from "@/lib/ranker/analysis";
import { getSpecies } from "@/lib/ranker/data";
import { formatLevel } from "@/lib/ranker/cp";
import { fmt } from "@/lib/ranker/format";
import type { RankerSettings } from "@/lib/ranker/box";
import { withBasePath } from "@/lib/basePath";
import { TypeChips } from "@/components/TypeChip";
import { EvolveCostLine, LevelCostLine, MegaEnergyLine, ThirdMoveLine } from "./CostIcons";

const CAP_LABEL: Record<string, string> = { little: "500", great: "1.500", ultra: "2.500", master: "sin tope" };
const VARIANT_LABEL: Record<string, string> = { normal: "normal", shadow: "oscuro", purified: "purificado" };

/**
 * Detalle de un Pokémon cargado: una fila por forma a la que puede llegar
 * (él mismo, cada evolución, cada Mega) y una columna por tope de CP. Cada
 * celda da el rango de IV y el puesto en PvPoke al mismo tamaño, el PC y el
 * nivel donde rinde, y lo que cuesta subirlo.
 */
export function EntryDetail({
  entry,
  settings,
  onEdit,
  onDelete,
}: {
  entry: BoxEntry;
  settings: RankerSettings;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const species = getSpecies(entry.speciesId)!;
  const results = useMemo(() => analyzeEntry(entry, settings), [entry, settings]);

  return (
    <div className="rk-panel" style={{ flexGrow: 1, minWidth: 0, minHeight: 0, gap: 14 }}>
      <span className="panel__edge" style={{ left: 18 }} />
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", flexShrink: 0 }}>
        <span style={{ display: "flex", alignItems: "baseline", gap: 18, minWidth: 0 }}>
          <span className="display" style={{ fontSize: 34, fontWeight: 800, letterSpacing: "-0.03em" }}>{species.name}</span>
          <span className="rk-num" style={{ fontSize: 24, fontWeight: 600 }}>
            {entry.atk} / {entry.def} / {entry.sta}
          </span>
          <span className="rk-cost" style={{ fontSize: 14, color: "#B4BCC6" }}>
            {fmt(entry.cp)} PC · nivel {formatLevel(entry.level)} · {VARIANT_LABEL[entry.variant]}
            {entry.lucky ? " · suertudo" : ""}
          </span>
        </span>
        <span style={{ display: "flex", gap: 10, flexShrink: 0 }}>
          <button type="button" className="btn" style={{ height: 40, fontSize: 14 }} onClick={onEdit}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 12h2.6L11.8 4.8 9.2 2.2 2 9.4V12z" stroke="#F2F3F5" strokeWidth={1.4} strokeLinejoin="round" /></svg>
            Editar
          </button>
          <button type="button" className="btn btn--ghost" style={{ height: 40, fontSize: 14 }} onClick={onDelete}>
            Quitar
          </button>
        </span>
      </div>

      <div className="scroll-list" style={{ minHeight: 0, display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(150px, 240px) repeat(4, minmax(0, 1fr))", gap: 8, position: "sticky", top: 0, zIndex: 1, background: "#161a20", padding: "6px 0" }}>
          <span className="label" style={{ fontSize: 10.5, padding: "0 0 0 4px" }}>Forma</span>
          {results[0]?.cells.map((c) => (
            <span key={c.league.key} style={{ display: "flex", alignItems: "baseline", gap: 8, padding: "0 4px" }}>
              <span style={{ fontSize: 15, fontWeight: 600 }}>{c.league.short}</span>
              <span className="rk-cost" style={{ fontSize: 11 }}>{CAP_LABEL[c.league.key]}</span>
            </span>
          ))}
        </div>

        {results.map((r) => (
          <div key={r.target.species.id} style={{ display: "grid", gridTemplateColumns: "minmax(150px, 240px) repeat(4, minmax(0, 1fr))", gap: 8 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 5, padding: "10px 4px", minWidth: 0 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="rk-sprite" src={withBasePath(`/sprites/pixel/${r.target.species.id}.png`)} alt="" width={44} height={44} />
                <span style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                  <span style={{ fontSize: 15.5, fontWeight: 600, lineHeight: 1.25 }}>{r.target.species.name}</span>
                  {r.isCurrent && <span className="rk-tag">ACTUAL</span>}
                </span>
              </span>
              <TypeChips types={r.target.species.types} variant="row" />
              <EvolveCostLine candy={r.evolveCandy} evolved={r.target.path.length > 1} />
              {r.target.isMega && <MegaEnergyLine energy={r.megaEnergy} />}
              {settings.showThirdMove && <ThirdMoveLine cost={r.third} />}
            </div>

            {r.cells.map((c) => {
              if (c.kind !== "rank" || !c.row) {
                return (
                  <div key={c.league.key} className="rk-cell rk-cell--excluded" style={{ justifyContent: "center" }}>
                    <span className="label" style={{ fontSize: 10 }}>
                      {c.kind === "excluded" ? "No entra" : c.kind === "short" ? "No llega" : "Te pasaste"}
                    </span>
                    <span className="rk-note" style={{ fontSize: 13 }}>{c.note}</span>
                  </div>
                );
              }
              const good = c.row.rank <= 100;
              return (
                <div key={c.league.key} className={`rk-cell ${good ? "rk-cell--good" : ""}`} style={{ position: "relative" }}>
                  {c.best && <span className="rk-tag rk-tag--mejor">MEJOR</span>}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 5, paddingRight: 10 }}>
                      <span className="label" style={{ fontSize: 9.5, color: good ? "#86EFBC" : "#9CA6B2" }}>Rango IV</span>
                      <span className={`rk-rank ${good ? "rk-rank--good" : ""}`} style={{ fontSize: 30 }}>#{c.row.rank}</span>
                      <span className="rk-cost" style={{ fontSize: 12 }}>{c.row.pct.toFixed(1).replace(".", ",")} %</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 5, paddingLeft: 12, boxShadow: "inset 1px 0 0 rgba(255,255,255,0.14)" }}>
                      <span className="label" style={{ fontSize: 9.5 }}>PvPoke</span>
                      <span className="rk-rank" style={{ fontSize: 30, color: "#F2F3F5" }}>{c.pvpoke ? `#${fmt(c.pvpoke)}` : "—"}</span>
                      <span className="rk-cost" style={{ fontSize: 10.5, letterSpacing: "0.1em" }}>{c.pvpoke ? "EN LA LIGA" : "SIN PUESTO"}</span>
                    </div>
                  </div>
                  <span style={{ height: 1, background: "rgba(255,255,255,0.09)", margin: "2px 0 0" }} />
                  <span style={{ fontSize: 13.5, color: "#DCE1E7" }}>
                    {fmt(c.row.cp)} PC · nivel {formatLevel(c.row.level)}
                  </span>
                  {c.level && <LevelCostLine cost={c.level} />}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 26, flexShrink: 0, fontFamily: "var(--font-mono)", fontSize: 11.5, color: "#A8B0BB" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: "rgba(82,231,157,0.30)", boxShadow: "inset 0 0 0 1px #52E79D" }} />
            Rango IV 100 o mejor de 4.096
          </span>
          <span>PvPoke: puesto de la especie en esa liga</span>
        </span>
        <span>Costo desde nivel {formatLevel(entry.level)}</span>
      </div>
    </div>
  );
}
