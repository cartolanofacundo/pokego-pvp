"use client";

import { useEffect, useMemo, useState } from "react";
import { bestRankOf, dexRows, servesAnyLeague, servesLeague, type BestRank, type BoxEntry } from "@/lib/ranker/analysis";
import { planCleanup, type CleanupScope } from "@/lib/ranker/cleanup";
import { RANKER_LEAGUES, getSpecies, type RankerLeagueKey } from "@/lib/ranker/data";
import { formatLevel } from "@/lib/ranker/cp";
import { fmt } from "@/lib/ranker/format";
import type { RankerSettings } from "@/lib/ranker/box";
import { withBasePath } from "@/lib/basePath";
import { EvolveCostLine, LevelCostLine, ThirdMoveLine } from "./CostIcons";

export type DexMode = "utiles" | "caja";
const dexNumber = (dex: number) => `#${String(dex).padStart(4, "0")}`;

/** Ancho de pantalla desde el que la tabla ancha entra sin comprimirse. */
const WIDE_TABLE_MIN = 1680;

function useIsWide() {
  const [wide, setWide] = useState(true);
  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${WIDE_TABLE_MIN}px)`);
    /* eslint-disable-next-line react-hooks/set-state-in-effect */
    setWide(mq.matches);
    const onChange = () => setWide(mq.matches);
    mq.addEventListener("change", onChange);
    // Redundante a propósito: algunos entornos (paneles embebidos, emulación
    // de tamaño) no disparan el evento "change" del MediaQueryList al
    // redimensionar, aunque sí el resize de window.
    window.addEventListener("resize", onChange);
    return () => {
      mq.removeEventListener("change", onChange);
      window.removeEventListener("resize", onChange);
    };
  }, []);
  return wide;
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
  onDeleteMany,
  onRestore,
}: {
  entries: BoxEntry[];
  settings: RankerSettings;
  league: RankerLeagueKey;
  mode: DexMode;
  onLeague: (l: RankerLeagueKey) => void;
  onMode: (m: DexMode) => void;
  onOpen: (e: BoxEntry) => void;
  onDelete: (id: string) => void;
  onDeleteMany: (ids: string[]) => void;
  onRestore: (entries: BoxEntry[]) => void;
}) {
  const wide = useIsWide();
  const [query, setQuery] = useState("");
  const [cleanupOpen, setCleanupOpen] = useState(false);
  const [scope, setScope] = useState<CleanupScope>("any");
  const [undo, setUndo] = useState<{ entries: BoxEntry[]; timer: ReturnType<typeof setTimeout> } | null>(null);

  useEffect(() => () => { if (undo) clearTimeout(undo.timer); }, [undo]);

  useEffect(() => {
    if (!undo) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key.toLowerCase() === "z") {
        e.preventDefault();
        clearTimeout(undo.timer);
        onRestore(undo.entries);
        setUndo(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [undo]);

  const counts = useMemo(
    () => Object.fromEntries(RANKER_LEAGUES.map((l) => [l.key, entries.filter((e) => servesLeague(e, settings, l.key)).length])) as Record<RankerLeagueKey, number>,
    [entries, settings]
  );
  const servesCount = useMemo(() => entries.filter((e) => servesAnyLeague(e, settings)).length, [entries, settings]);

  const rows = useMemo(() => dexRows(entries, league, settings), [entries, league, settings]);
  const leagueLabel = RANKER_LEAGUES.find((l) => l.key === league)!.label;
  const leagueIdx = RANKER_LEAGUES.findIndex((l) => l.key === league);

  const box = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? entries.filter((e) => {
          const s = getSpecies(e.speciesId)!;
          return s.name.toLowerCase().includes(q) || String(s.dex).includes(q);
        })
      : entries;
    return filtered
      .map((e) => ({ entry: e, species: getSpecies(e.speciesId)!, best: bestRankOf(e, settings) }))
      .sort((a, b) => a.species.dex - b.species.dex || a.species.id.localeCompare(b.species.id) || b.entry.addedAt - a.entry.addedAt);
  }, [entries, query, settings]);

  const plan = useMemo(
    () => (cleanupOpen ? planCleanup(entries, settings, scope) : null),
    [cleanupOpen, entries, settings, scope]
  );
  const toDeleteIds = useMemo(() => new Set(plan?.toDelete.map((e) => e.id) ?? []), [plan]);

  const confirmDelete = () => {
    if (!plan || plan.toDelete.length === 0) return;
    const snapshot = entries;
    onDeleteMany(plan.toDelete.map((e) => e.id));
    setCleanupOpen(false);
    if (undo) clearTimeout(undo.timer);
    const timer = setTimeout(() => setUndo(null), 10000);
    setUndo({ entries: snapshot, timer });
  };

  return (
    <div className="rk-panel" style={{ flexGrow: 1, minWidth: 0, minHeight: 0, gap: 16 }}>
      <span className="panel__edge" style={{ left: 18 }} />
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexShrink: 0, boxShadow: "inset 0 -1px 0 rgba(255,255,255,0.10)" }}>
        <span style={{ display: "flex", gap: 26 }}>
          <button
            type="button"
            onClick={() => onMode("utiles")}
            style={{ position: "relative", display: "flex", alignItems: "center", height: 40, fontSize: 14.5, fontWeight: 600, color: mode === "utiles" ? "#F2F3F5" : "#A8B0BB", background: "none", border: 0 }}
          >
            Rango 100 o mejor
            {mode === "utiles" && <span style={{ position: "absolute", left: 0, right: 0, bottom: -1, height: 2, background: "#F2F3F5" }} />}
          </button>
          <button
            type="button"
            onClick={() => onMode("caja")}
            style={{ position: "relative", display: "flex", alignItems: "center", height: 40, fontSize: 14.5, fontWeight: 600, color: mode === "caja" ? "#F2F3F5" : "#A8B0BB", background: "none", border: 0 }}
          >
            Toda la caja
            {mode === "caja" && <span style={{ position: "absolute", left: 0, right: 0, bottom: -1, height: 2, background: "#F2F3F5" }} />}
          </button>
        </span>
        <span className="rk-cost" style={{ fontSize: 12, paddingBottom: 12 }}>
          {mode === "utiles" ? "SOLO RANGO IV 100 O MEJOR EN LA LIGA ELEGIDA · ORDEN: PUESTO EN PVPOKE" : `${entries.length} POKÉMON · ORDEN DE POKÉDEX`}
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexShrink: 0, flexWrap: "wrap" }}>
        {mode === "utiles" && (
          <span style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span className="label" style={{ fontSize: 11 }}>Liga</span>
            <span role="radiogroup" aria-label="Filtrar por liga" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {RANKER_LEAGUES.map((l) => (
                <button key={l.key} type="button" role="radio" aria-checked={league === l.key} className="rk-league-btn" onClick={() => onLeague(l.key)}>
                  {l.short} <span className="rk-league-btn__count">{counts[l.key]}</span>
                </button>
              ))}
            </span>
          </span>
        )}
        {mode === "utiles" ? (
          <span style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 15, color: "#DCE1E7" }}>
            <button type="button" className="kbd" aria-label="Liga anterior" onClick={() => onLeague(RANKER_LEAGUES[(leagueIdx - 1 + RANKER_LEAGUES.length) % RANKER_LEAGUES.length].key)}>←</button>
            <button type="button" className="kbd" aria-label="Liga siguiente" onClick={() => onLeague(RANKER_LEAGUES[(leagueIdx + 1) % RANKER_LEAGUES.length].key)}>→</button>
            <span>
              <b style={{ fontWeight: 600, color: "#86EFBC" }}>{counts[league]}</b> de {entries.length} sirven en {RANKER_LEAGUES[leagueIdx].short}
            </span>
          </span>
        ) : (
          <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <label className="rk-field" style={{ width: 300, height: 40 }}>
              <span className="sr-only">Buscar por nombre o número</span>
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Nombre o número" style={{ fontSize: 14 }} />
              <span className="kbd kbd--sm">/</span>
            </label>
            <button
              type="button"
              onClick={() => { setCleanupOpen(true); setScope("any"); }}
              style={{
                display: "flex", alignItems: "center", gap: 9, height: 40, padding: "0 16px", border: 0, borderRadius: 10,
                background: cleanupOpen ? "rgba(255,126,126,0.22)" : "rgba(255,126,126,0.12)",
                boxShadow: `inset 0 0 0 1px rgba(255,126,126,${cleanupOpen ? 0.6 : 0.36})`, color: "#FFA6A6", fontSize: 14, fontWeight: 600,
              }}
            >
              <TrashIcon />
              Borrar los que no sirven
              <span className="rk-num" style={{ fontSize: 12, padding: "2px 7px", borderRadius: 5, background: "rgba(255,126,126,0.18)" }}>
                {entries.length - servesCount}
              </span>
            </button>
          </span>
        )}
      </div>

      {plan && (
        <div className="rk-band rk-band--amber" style={{ flexShrink: 0 }}>
          <span className="rk-band__dot" style={{ background: "#F8C066" }} />
          <div style={{ flexGrow: 1, display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
            <span style={{ fontSize: 16, fontWeight: 600 }}>Vas a borrar {plan.toDelete.length} Pokémon de tu caja</span>
            <span style={{ fontSize: 14, color: "#DCE1E7" }}>
              {scope === "any"
                ? "Son los que no llegan a rango IV 100 en ninguna liga."
                : `Son los que no llegan a rango IV 100 en ${RANKER_LEAGUES.find((l) => l.key === scope)!.label}.`}{" "}
              Los {plan.toKeep.length} que sirven se quedan.
              {plan.servesElsewhere > 0 && ` ${plan.servesElsewhere} de estos sirven en otra liga.`}
            </span>
          </div>
          <span style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-start" }}>
            <span className="label" style={{ fontSize: 10 }}>Borrar si no sirven…</span>
            <span className="rk-seg" style={{ background: "rgba(0,0,0,0.28)" }} role="radiogroup" aria-label="Alcance">
              <button type="button" aria-pressed={scope === "any"} onClick={() => setScope("any")}>en ninguna liga</button>
              <button type="button" aria-pressed={scope === league} onClick={() => setScope(league)}>en {RANKER_LEAGUES.find((l) => l.key === league)!.short}</button>
            </span>
          </span>
          <span style={{ display: "flex", gap: 10 }}>
            <button type="button" className="btn" style={{ height: 40 }} onClick={confirmDelete} disabled={plan.toDelete.length === 0}>
              <TrashIcon color="#1A0B0B" />
              Borrar {plan.toDelete.length}
            </button>
            <button type="button" className="btn btn--ghost" style={{ height: 40 }} onClick={() => setCleanupOpen(false)}>
              Cancelar
            </button>
          </span>
        </div>
      )}

      {undo && (
        <div className="rk-band rk-band--neutral" style={{ flexShrink: 0 }}>
          <span className="rk-band__dot" style={{ background: "#B0B9C4" }} />
          <div style={{ flexGrow: 1, display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 16, fontWeight: 600 }}>Borraste {undo.entries.length - entries.length} Pokémon</span>
            <span style={{ fontSize: 14, color: "#DCE1E7" }}>Quedan {entries.length} en la caja. Podés deshacerlo durante 10 segundos.</span>
          </div>
          <span className="kbd kbd--sm">Ctrl Z</span>
          <button
            type="button"
            className="btn btn--primary"
            style={{ height: 40 }}
            onClick={() => {
              clearTimeout(undo.timer);
              onRestore(undo.entries);
              setUndo(null);
            }}
          >
            Deshacer
          </button>
        </div>
      )}

      <div className="scroll-list" style={{ minHeight: 0, flexGrow: 1, overflowX: wide || mode === "caja" ? "hidden" : "auto" }}>
        {mode === "utiles" ? (
          rows.length === 0 ? (
            <p className="rk-note" style={{ padding: "12px 4px" }}>Ningún Pokémon de tu caja tiene rango 100 o mejor en {leagueLabel}.</p>
          ) : wide ? (
            <WideDexTable rows={rows} showThird={settings.showThirdMove} onOpen={onOpen} />
          ) : (
            <DenseDexTable rows={rows} showThird={settings.showThirdMove} onOpen={onOpen} />
          )
        ) : box.length === 0 ? (
          <p className="rk-note" style={{ padding: "12px 4px" }}>Tu caja está vacía. Cargá Pokémon desde la pestaña Cargar, o importá un archivo exportado antes.</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
            {box.map(({ entry, species, best }) => (
              <BoxCard
                key={entry.id}
                entry={entry}
                species={species}
                best={best}
                cleanupMark={cleanupOpen ? (toDeleteIds.has(entry.id) ? "drop" : "keep") : null}
                onOpen={() => onOpen(entry)}
                onDelete={() => onDelete(entry.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TrashIcon({ color = "#FFA6A6" }: { color?: string }) {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <path d="M2.5 4h10M6 4V2.5h3V4M3.8 4l.7 8.5h6l.7-8.5M6.3 6.5v4M8.7 6.5v4" stroke={color} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function EyeIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M1.5 8S4 3.5 8 3.5 14.5 8 14.5 8 12 12.5 8 12.5 1.5 8 1.5 8z" stroke="#C2C9D2" strokeWidth={1.4} />
      <circle cx="8" cy="8" r="2" stroke="#C2C9D2" strokeWidth={1.4} />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M3 3l6 6M9 3l-6 6" stroke="#A8B0BB" strokeWidth={1.5} strokeLinecap="round" />
    </svg>
  );
}

function WideDexTable({ rows, showThird, onOpen }: { rows: ReturnType<typeof dexRows>; showThird: boolean; onOpen: (e: BoxEntry) => void }) {
  const cols = "118px minmax(240px,1.4fr) 160px 140px 180px 104px 130px 1.4fr 160px 44px";
  return (
    <table className="rk-table" style={{ tableLayout: "fixed" }}>
      <colgroup>{cols.split(" ").map((w, i) => <col key={i} style={{ width: w }} />)}</colgroup>
      <thead>
        <tr>
          <th>Puesto PvPoke</th><th>Pokémon</th><th>Rango IV</th><th>IV</th><th>Rinde en</th><th>Nivel actual</th>
          <th>Evolución</th><th>Costo para subir</th>{showThird && <th>3er ataque</th>}<th />
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => {
          const from = getSpecies(r.entry.speciesId)!;
          const evolved = r.target.path.length > 1;
          return (
            <tr key={`${r.entry.id}-${r.target.species.id}`}>
              <td><span className="rk-pill"><span className="rk-rank" style={{ fontSize: 28 }}>{r.cell.pvpoke ? `#${fmt(r.cell.pvpoke)}` : "—"}</span></span></td>
              <td>
                <span style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="rk-sprite" src={withBasePath(`/sprites/pixel/${r.target.species.id}.png`)} alt="" width={44} height={44} />
                  <span style={{ display: "flex", flexDirection: "column", gap: 1, minWidth: 0 }}>
                    <span style={{ fontSize: 15, fontWeight: 600 }}>{r.target.species.name}</span>
                    {evolved && <span className="rk-cost" style={{ fontSize: 12 }}>desde {from.name}</span>}
                  </span>
                </span>
              </td>
              <td><span style={{ display: "flex", alignItems: "baseline", gap: 8 }}><span className="rk-rank rk-rank--good" style={{ fontSize: 28 }}>#{r.cell.row!.rank}</span><span className="rk-cost" style={{ fontSize: 12.5 }}>{r.cell.row!.pct.toFixed(1).replace(".", ",")} %</span></span></td>
              <td className="rk-num" style={{ fontSize: 15, fontWeight: 600 }}>{r.entry.atk} / {r.entry.def} / {r.entry.sta}</td>
              <td style={{ fontSize: 14, color: "#DCE1E7" }}>{fmt(r.cell.row!.cp)} PC · nv {formatLevel(r.cell.row!.level)}</td>
              <td className="rk-num" style={{ fontSize: 14, color: "#DCE1E7" }}>{formatLevel(r.entry.level)}</td>
              <td><EvolveCostLine candy={r.evolveCandy} evolved={evolved} /></td>
              <td>{r.cell.level && <LevelCostLine cost={r.cell.level} />}</td>
              {showThird && <td><ThirdMoveLine cost={r.third} /></td>}
              <td>
                <button type="button" aria-label="Ver" onClick={() => onOpen(r.entry)} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 34, height: 34, border: 0, borderRadius: 8, background: "rgba(255,255,255,0.08)" }}>
                  <EyeIcon />
                </button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function DenseDexTable({ rows, showThird, onOpen }: { rows: ReturnType<typeof dexRows>; showThird: boolean; onOpen: (e: BoxEntry) => void }) {
  const cols = "82px minmax(170px,1.3fr) 118px 112px 150px 104px 1.4fr 80px 36px";
  return (
    <table className="rk-table" style={{ tableLayout: "fixed" }}>
      <colgroup>{cols.split(" ").map((w, i) => <col key={i} style={{ width: w }} />)}</colgroup>
      <thead>
        <tr><th>PvPoke</th><th>Pokémon</th><th>Rango IV</th><th>IV</th><th>Rinde en</th><th>Nivel</th><th>Costo para subir</th>{showThird && <th>3er atq</th>}<th /></tr>
      </thead>
      <tbody>
        {rows.map((r) => {
          const from = getSpecies(r.entry.speciesId)!;
          const evolved = r.target.path.length > 1;
          return (
            <tr key={`${r.entry.id}-${r.target.species.id}`} style={{ height: 46 }}>
              <td><span className="rk-pill" style={{ height: 32, minWidth: 58 }}><span className="rk-rank" style={{ fontSize: 22 }}>{r.cell.pvpoke ? `#${fmt(r.cell.pvpoke)}` : "—"}</span></span></td>
              <td>
                <span style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="rk-sprite" src={withBasePath(`/sprites/pixel/${r.target.species.id}.png`)} alt="" width={32} height={32} />
                  <span style={{ display: "flex", flexDirection: "column", gap: 1, minWidth: 0 }}>
                    <span style={{ fontSize: 13.5, fontWeight: 600 }}>{r.target.species.name}</span>
                    {evolved && (
                      <span className="rk-cost" style={{ fontSize: 10.5 }}>
                        desde {from.name} · <EvolveCostLine candy={r.evolveCandy} evolved />
                      </span>
                    )}
                  </span>
                </span>
              </td>
              <td><span style={{ display: "flex", alignItems: "baseline", gap: 6 }}><span className="rk-rank rk-rank--good" style={{ fontSize: 22 }}>#{r.cell.row!.rank}</span><span className="rk-cost" style={{ fontSize: 11 }}>{r.cell.row!.pct.toFixed(1).replace(".", ",")} %</span></span></td>
              <td className="rk-num" style={{ fontSize: 13.5, fontWeight: 600 }}>{r.entry.atk}/{r.entry.def}/{r.entry.sta}</td>
              <td style={{ fontSize: 12.5, color: "#DCE1E7" }}>{fmt(r.cell.row!.cp)} PC · nv {formatLevel(r.cell.row!.level)}</td>
              <td className="rk-num" style={{ fontSize: 12.5, color: "#DCE1E7" }}>{formatLevel(r.entry.level)} → {formatLevel(r.cell.row!.level)}</td>
              <td>{r.cell.level && <LevelCostLine cost={r.cell.level} small />}</td>
              {showThird && <td><ThirdMoveLine cost={r.third} candyOnly /></td>}
              <td>
                <button type="button" aria-label="Ver" onClick={() => onOpen(r.entry)} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 30, height: 30, border: 0, borderRadius: 8, background: "rgba(255,255,255,0.08)" }}>
                  <EyeIcon size={15} />
                </button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function BoxCard({
  entry,
  species,
  best,
  cleanupMark,
  onOpen,
  onDelete,
}: {
  entry: BoxEntry;
  species: ReturnType<typeof getSpecies>;
  best: BestRank | null;
  cleanupMark: "keep" | "drop" | null;
  onOpen: () => void;
  onDelete: () => void;
}) {
  if (!species) return null;
  return (
    <div style={{ position: "relative", minWidth: 0 }}>
      {cleanupMark && (
        <span className={`rk-card__mark rk-card__mark--${cleanupMark === "keep" ? "keep" : "drop"}`}>
          {cleanupMark === "keep" ? "SE QUEDA" : "SE BORRA"}
        </span>
      )}
      <div className={`rk-card ${best && best.rank <= 100 ? "rk-card--good" : ""} ${cleanupMark === "drop" ? "rk-card--dimmed" : ""}`}>
        <span style={{ width: 96, height: 96, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="rk-sprite" src={withBasePath(`/sprites/pixel/${species.id}.png`)} alt="" style={{ width: 112, height: 112, margin: -8 }} />
        </span>
        <div style={{ flexGrow: 1, alignSelf: "stretch", display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 4, minWidth: 0 }}>
          <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
            <span style={{ display: "flex", alignItems: "baseline", gap: 7, minWidth: 0 }}>
              <span style={{ fontSize: 15.5, fontWeight: 600, whiteSpace: "nowrap" }}>{species.name}</span>
              <span className="rk-num" style={{ fontSize: 11, color: "#9CA6B2" }}>{dexNumber(species.dex)}</span>
            </span>
            <span style={{ display: "flex", gap: 4 }}>
              <button type="button" aria-label="Ver detalle" onClick={onOpen} style={{ width: 26, height: 26, border: 0, borderRadius: 7, background: "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <EyeIcon size={15} />
              </button>
              <button type="button" aria-label="Quitar" onClick={onDelete} style={{ width: 26, height: 26, border: 0, borderRadius: 7, background: "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <XIcon />
              </button>
            </span>
          </span>
          <span style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span className="rk-num" style={{ fontSize: 17, fontWeight: 600 }}>{entry.atk} / {entry.def} / {entry.sta}</span>
            <span className="rk-num" style={{ fontSize: 11, color: "#A8B0BB" }}>nv {formatLevel(entry.level)}</span>
          </span>
          <span style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 4 }}>
            <span style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>
              <span className="label" style={{ fontSize: 9.5 }}>Rango IV</span>
              {best ? (
                <span style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                  <span className={`rk-rank ${best.rank <= 100 ? "rk-rank--good" : ""}`} style={{ fontSize: 22 }}>#{fmt(best.rank)}</span>
                  <span className="rk-cost" style={{ fontSize: 10, textTransform: "uppercase", color: best.rank <= 100 ? "#86EFBC" : "#9CA6B2" }}>{best.league.short}</span>
                </span>
              ) : (
                <span className="rk-cost" style={{ fontSize: 10.5 }}>NO ENTRA</span>
              )}
            </span>
            <span style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>
              <span className="label" style={{ fontSize: 9.5 }}>PvPoke</span>
              <span className="rk-pill" style={{ height: 30, minWidth: 0, alignSelf: "flex-start", padding: "0 9px" }}>
                <span className="rk-rank" style={{ fontSize: 22, color: "#F2F3F5" }}>{best?.pvpoke ? `#${fmt(best.pvpoke)}` : "—"}</span>
              </span>
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
