"use client";

import { useMemo } from "react";
import { analyzeEntry, type BoxEntry } from "@/lib/ranker/analysis";
import { getSpecies } from "@/lib/ranker/data";
import { formatLevel } from "@/lib/ranker/cp";
import { fmt } from "@/lib/ranker/format";
import type { RankerSettings } from "@/lib/ranker/box";
import { podiumOf, PODIUM_CLASS } from "@/lib/ranker/podium";
import { withBasePath } from "@/lib/basePath";
import { TypeChips } from "@/components/TypeChip";
import { EvolveCostLine, LevelCostLine, MegaEnergyLine, ThirdMoveLine } from "./CostIcons";
import { Medal } from "./Medal";

const CAP_LABEL: Record<string, string> = { little: "500", great: "1.500", ultra: "2.500", master: "sin tope" };
const VARIANT_LABEL: Record<string, string> = { normal: "normal", shadow: "oscuro", purified: "purificado" };

/**
 * Detalle de un Pokémon cargado: una fila por forma a la que puede llegar
 * (él mismo, cada evolución, cada Mega) y una columna por tope de CP. Cada
 * celda da el rango de IV y el puesto en PvPoke al mismo tamaño, el PC y el
 * nivel donde rinde, y lo que cuesta subirlo. Los rangos #1, #2 y #3 van con
 * oro, plata y bronce en lugar del verde (ver .rk-podium--* en globals.css).
 *
 * `unsaved`: es la vista previa de un cargado que todavía no se guardó (se
 * está tipeando en el campo de arriba). Muestra "SIN GUARDAR" en lugar de
 * Editar/Quitar, porque todavía no hay nada que editar ni quitar.
 */
export function EntryDetail({
  entry,
  settings,
  unsaved = false,
  onEdit,
  onDelete,
}: {
  entry: BoxEntry;
  settings: RankerSettings;
  unsaved?: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const species = getSpecies(entry.speciesId)!;
  const results = useMemo(() => analyzeEntry(entry, settings), [entry, settings]);

  // Costos (PC y nivel donde rinde, polvo, caramelos, energía Mega, tercer
  // ataque) en `.rk-costs--*`: el ajuste Costos los muestra, los oculta o
  // ("auto") los oculta solo cuando las celdas quedan angostas (container
  // queries en globals.css). Sin scroll interno: el panel crece con su
  // contenido y es la página la que scrollea. Sin `align-self`: el padre es
  // una columna flex, y ahí `align-self` achica el ancho (no el alto) a su
  // contenido, que en un contenedor `inline-size` es 0.
  return (
    <div className={`rk-panel rk-detail rk-detail--costs-${settings.costs}`} style={{ minWidth: 0, gap: 14 }}>
      <span className="panel__edge" style={{ left: 18 }} />
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", flexShrink: 0, flexWrap: "wrap", gap: 10 }}>
        <span style={{ display: "flex", alignItems: "baseline", gap: 18, minWidth: 0 }}>
          <span className="display" style={{ fontSize: 34, fontWeight: 800, letterSpacing: "-0.03em", whiteSpace: "nowrap" }}>{species.name}</span>
          <span className="rk-num" style={{ fontSize: 24, fontWeight: 600, whiteSpace: "nowrap" }}>
            {entry.atk} / {entry.def} / {entry.sta}
          </span>
          <span className="rk-cost" style={{ fontSize: 14, color: "#B4BCC6", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>
            {fmt(entry.cp)} PC · nivel {formatLevel(entry.level)} · {VARIANT_LABEL[entry.variant]}
            {entry.lucky ? " · suertudo" : ""}
          </span>
        </span>
        {unsaved ? (
          <span className="rk-tag" style={{ height: 26, padding: "0 10px", background: "rgba(248,192,102,0.16)", color: "var(--amber-text)", flexShrink: 0 }}>
            SIN GUARDAR · Enter para cargar
          </span>
        ) : (
          <span style={{ display: "flex", gap: 10, flexShrink: 0 }}>
            <button type="button" className="btn" style={{ height: 40, fontSize: 14 }} onClick={onEdit}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 12h2.6L11.8 4.8 9.2 2.2 2 9.4V12z" stroke="#F2F3F5" strokeWidth={1.4} strokeLinejoin="round" /></svg>
              Editar
            </button>
            <button type="button" className="btn btn--ghost" style={{ height: 40, fontSize: 14 }} onClick={onDelete}>
              Quitar
            </button>
          </span>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
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
              <span className="rk-costs--detail" style={{ flexDirection: "column", gap: 5 }}>
                <EvolveCostLine candy={r.evolveCandy} evolved={r.target.path.length > 1} />
                {r.target.isMega && <MegaEnergyLine energy={r.megaEnergy} />}
                {settings.showThirdMove && <ThirdMoveLine cost={r.third} />}
              </span>
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
              const tier = podiumOf(c.row.rank);
              const cls = tier ? PODIUM_CLASS[tier] : null;
              const rankColor = cls ? `var(--${cls}-text)` : good ? "#86EFBC" : "#9CA6B2";
              return (
                <div
                  key={c.league.key}
                  className={`rk-cell ${cls ? `rk-podium--${cls}` : good ? "rk-cell--good" : ""} ${c.best ? "rk-cell--best" : ""}`}
                  style={{ position: "relative" }}
                >
                  {c.best && <span className={`rk-tag rk-tag--mejor ${cls ? "rk-tag--podium" : ""}`}>MEJOR</span>}
                  <div className="rk-cell__nums">
                    <div className="rk-cell__num">
                      <span className="label" style={{ fontSize: 9.5, color: rankColor }}>Rango IV</span>
                      <span className="rk-rank rk-cell__num-value" style={{ color: rankColor, display: "flex", alignItems: "center", gap: 6 }}>
                        {tier && <Medal tier={tier} size={20} />}
                        #{c.row.rank}
                      </span>
                      <span className="rk-cost" style={{ fontSize: 12 }}>{c.row.pct.toFixed(1).replace(".", ",")} %</span>
                    </div>
                    <div className="rk-cell__num rk-cell__num--pv">
                      <span className="label" style={{ fontSize: 9.5 }}>PvPoke</span>
                      <span className="rk-rank rk-cell__num-value" style={{ color: "#F2F3F5" }}>{c.pvpoke ? `#${fmt(c.pvpoke)}` : "—"}</span>
                      <span className="rk-cost" style={{ fontSize: 10.5, letterSpacing: "0.1em" }}>{c.pvpoke ? "EN LA LIGA" : "SIN PUESTO"}</span>
                    </div>
                  </div>
                  <span className="rk-costs--cell" style={{ flexDirection: "column", gap: 6 }}>
                    <span style={{ height: 1, background: "rgba(255,255,255,0.09)", margin: "2px 0 0" }} />
                    <span style={{ fontSize: 13.5, color: "#DCE1E7" }}>
                      {fmt(c.row.cp)} PC · nivel {formatLevel(c.row.level)}
                    </span>
                    {c.level && <LevelCostLine cost={c.level} />}
                  </span>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, flexShrink: 0, fontFamily: "var(--font-mono)", fontSize: 11.5, color: "#A8B0BB" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <Medal tier={1} size={13} /><Medal tier={2} size={13} /><Medal tier={3} size={13} />
            #1, #2 y #3
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: "rgba(82,231,157,0.30)", boxShadow: "inset 0 0 0 1px #52E79D" }} />
            Rango IV 100 o mejor de 4.096
          </span>
          <span>PvPoke: puesto de la especie en esa liga</span>
        </span>
        <span className="rk-costs--detail">Costo desde nivel {formatLevel(entry.level)}</span>
        <span className="rk-costs-note">Costos ocultos · C para mostrar</span>
      </div>
    </div>
  );
}
