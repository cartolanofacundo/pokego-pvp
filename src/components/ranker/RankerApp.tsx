"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Viewport } from "@/components/Viewport";
import { Brand } from "@/components/NavLinks";
import { TypeChips } from "@/components/TypeChip";
import { SPECIES, getSpecies, type RankerLeagueKey, type Species } from "@/lib/ranker/data";
import { analyzeEntry, DEX_MAX_RANK, type BoxEntry } from "@/lib/ranker/analysis";
import { formatLevel } from "@/lib/ranker/cp";
import { fmt } from "@/lib/ranker/format";
import type { Reading } from "@/lib/ranker/parse";
import { loadJSON, saveJSON } from "@/lib/storage";
import {
  DEFAULT_RANKER_SETTINGS,
  MAX_LEVEL_OPTIONS,
  MIN_IV_OPTIONS,
  exportPayload,
  loadBox,
  loadSettings,
  newId,
  parseImport,
  saveBox,
  saveSettings,
  type RankerSettings,
} from "@/lib/ranker/box";
import { withBasePath } from "@/lib/basePath";
import { SpeciesPicker, type SpeciesPickerHandle } from "./SpeciesPicker";
import { IvInput, type IvInputHandle } from "./IvInput";
import { EntryDetail } from "./EntryDetail";
import { DexView, type DexMode } from "./DexView";

const LAST_SPECIES_KEY = "pokego-pvp:ranker:last-species";

type View = "cargar" | "pokedex";

export function RankerApp() {
  const [ready, setReady] = useState(false);
  const [entries, setEntries] = useState<BoxEntry[]>([]);
  const [settings, setSettings] = useState<RankerSettings>(DEFAULT_RANKER_SETTINGS);
  const [view, setView] = useState<View>("cargar");
  const [speciesId, setSpeciesId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dexLeague, setDexLeague] = useState<RankerLeagueKey>("great");
  const [dexMode, setDexMode] = useState<DexMode>("utiles");
  const [pendingImport, setPendingImport] = useState<{ entries: BoxEntry[]; skipped: number; name: string } | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const pickerRef = useRef<SpeciesPickerHandle>(null);
  const ivRef = useRef<IvInputHandle>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Carga única del localStorage al montar: no existe en el export estático.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const box = loadBox();
    setEntries(box);
    setSettings(loadSettings());
    const last = loadJSON<string | null>(LAST_SPECIES_KEY, null);
    if (last && getSpecies(last)) setSpeciesId(last);
    setReady(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (ready) saveBox(entries);
  }, [entries, ready]);
  useEffect(() => {
    if (ready) saveSettings(settings);
  }, [settings, ready]);
  useEffect(() => {
    if (ready) saveJSON(LAST_SPECIES_KEY, speciesId);
  }, [speciesId, ready]);

  const species = speciesId ? getSpecies(speciesId) ?? null : null;
  const speciesEntries = useMemo(
    () => entries.filter((e) => e.speciesId === speciesId).sort((a, b) => b.addedAt - a.addedAt),
    [entries, speciesId]
  );
  const selected = entries.find((e) => e.id === selectedId) ?? speciesEntries[0] ?? null;

  const chooseSpecies = useCallback((s: Species) => {
    setSpeciesId(s.id);
    setSelectedId(null);
    setTimeout(() => ivRef.current?.focus(), 0);
  }, []);

  const stepSpecies = useCallback(
    (dir: 1 | -1) => {
      const idx = SPECIES.findIndex((s) => s.id === speciesId);
      const next = SPECIES[Math.min(SPECIES.length - 1, Math.max(0, idx + dir))];
      if (next) {
        setSpeciesId(next.id);
        setSelectedId(null);
      }
    },
    [speciesId]
  );

  const addEntry = (r: Reading) => {
    if (!species) return;
    const e: BoxEntry = { id: newId(), speciesId: species.id, atk: r.atk, def: r.def, sta: r.sta, cp: r.cp, level: r.level, addedAt: Date.now() };
    setEntries((xs) => [...xs, e]);
    setSelectedId(e.id);
  };

  const deleteEntry = (id: string) => {
    setEntries((xs) => xs.filter((e) => e.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const openEntry = (e: BoxEntry) => {
    setSpeciesId(e.speciesId);
    setSelectedId(e.id);
    setView("cargar");
  };

  const doExport = () => {
    const blob = new Blob([JSON.stringify(exportPayload(entries), null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pokego-pvp-caja-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const onImportFile = async (file: File) => {
    setImportError(null);
    const parsed = parseImport(await file.text());
    if (!parsed) {
      setImportError("Ese archivo no es una caja exportada desde esta app.");
      return;
    }
    setPendingImport({ ...parsed, name: file.name });
  };

  // "/" enfoca el buscador de especie desde cualquier lado que no sea un campo.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const typing = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA");
      if (e.key === "/" && !typing) {
        e.preventDefault();
        setView("cargar");
        setTimeout(() => pickerRef.current?.focus(), 0);
      }
      if (e.altKey && (e.key === "1" || e.key === "2")) {
        e.preventDefault();
        setView(e.key === "1" ? "cargar" : "pokedex");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const set = (patch: Partial<RankerSettings>) => setSettings((s) => ({ ...s, ...patch }));

  return (
    <Viewport>
      <main style={{ position: "relative", width: "100%", height: "var(--h)", display: "flex", flexDirection: "column", overflow: "hidden", background: "radial-gradient(1000px 600px at 20% 0%, rgba(92,152,236,0.10), rgba(92,152,236,0) 70%), #080A0D" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 60, padding: "0 48px", flexShrink: 0 }}>
          <Brand current="rankeador" />
          <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button type="button" className="btn" style={{ height: 38, fontSize: 13.5 }} onClick={doExport} disabled={!entries.length}>
              Exportar caja
            </button>
            <button type="button" className="btn" style={{ height: 38, fontSize: 13.5 }} onClick={() => fileRef.current?.click()}>
              Importar
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void onImportFile(f);
                e.target.value = "";
              }}
            />
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "4px 48px 16px", flexShrink: 0 }}>
          <span role="tablist" style={{ display: "flex", gap: 6 }}>
            <button type="button" role="tab" className="rk-tab" aria-selected={view === "cargar"} onClick={() => setView("cargar")}>
              Cargar <span className="kbd kbd--sm">Alt 1</span>
            </button>
            <button type="button" role="tab" className="rk-tab" aria-selected={view === "pokedex"} onClick={() => setView("pokedex")}>
              Mi pokédex <span className="rk-count">{entries.length}</span> <span className="kbd kbd--sm">Alt 2</span>
            </button>
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <Setting label="NIVEL MÁXIMO">
              {MAX_LEVEL_OPTIONS.map((v) => (
                <button key={v} type="button" aria-pressed={settings.maxLevel === v} onClick={() => set({ maxLevel: v })}>
                  {v}
                </button>
              ))}
            </Setting>
            <Setting label="IV MÍNIMO">
              {MIN_IV_OPTIONS.map((v) => (
                <button key={v} type="button" aria-pressed={settings.minIv === v} onClick={() => set({ minIv: v })}>
                  {v}
                </button>
              ))}
            </Setting>
            <Setting label="3.ER ATAQUE">
              <button type="button" aria-pressed={settings.showThirdMove} onClick={() => set({ showThirdMove: true })}>
                Ver
              </button>
              <button type="button" aria-pressed={!settings.showThirdMove} onClick={() => set({ showThirdMove: false })}>
                Ocultar
              </button>
            </Setting>
          </span>
        </div>

        {(pendingImport || importError) && (
          <div style={{ margin: "0 48px 16px", display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", background: importError ? "rgba(255,107,107,0.16)" : "rgba(242,177,76,0.14)" }}>
            {importError ? (
              <span className="rk-error" style={{ flexGrow: 1 }}>{importError}</span>
            ) : (
              <span className="rk-note" style={{ flexGrow: 1, color: "#FAD190" }}>
                {pendingImport!.name} trae {fmt(pendingImport!.entries.length)} Pokémon
                {pendingImport!.skipped === 1 ? " (1 ilegible se descarta)" : pendingImport!.skipped ? ` (${pendingImport!.skipped} ilegibles se descartan)` : ""}. Importar reemplaza tu caja actual de {fmt(entries.length)}.
              </span>
            )}
            {pendingImport && (
              <button
                type="button"
                className="btn btn--primary"
                style={{ height: 36, fontSize: 13.5 }}
                onClick={() => {
                  setEntries(pendingImport.entries);
                  setSelectedId(null);
                  setPendingImport(null);
                }}
              >
                Reemplazar mi caja
              </button>
            )}
            <button type="button" className="btn btn--ghost" style={{ height: 36, fontSize: 13.5 }} onClick={() => { setPendingImport(null); setImportError(null); }}>
              {importError ? "Cerrar" : "Cancelar"}
            </button>
          </div>
        )}

        <div style={{ display: "flex", gap: 28, padding: "0 48px 24px", flexGrow: 1, minHeight: 0 }}>
          {view === "cargar" ? (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: 16, width: "clamp(420px, 27vw, 500px)", flexShrink: 0, minHeight: 0 }}>
                <div className="rk-panel" style={{ gap: 16, overflow: "visible", clipPath: "none" }}>
                  <span className="label" style={{ fontSize: 10.5 }}>ESPECIE</span>
                  <SpeciesPicker ref={pickerRef} onPick={chooseSpecies} />
                  {species && <SpeciesCard species={species} onStep={stepSpecies} />}
                </div>

                {species && (
                  <div className="rk-panel" style={{ gap: 12 }}>
                    <span className="label" style={{ fontSize: 10.5 }}>IV Y CP</span>
                    <IvInput ref={ivRef} species={species} onAdd={addEntry} onNextSpecies={stepSpecies} />
                  </div>
                )}

                {species && (
                  <div className="rk-panel" style={{ gap: 10, flexGrow: 1, minHeight: 0 }}>
                    <span className="label" style={{ fontSize: 10.5 }}>
                      CARGADOS DE {species.name.toUpperCase()} · {speciesEntries.length}
                    </span>
                    <div className="scroll-list" style={{ display: "flex", flexDirection: "column", gap: 2, minHeight: 0 }}>
                      {speciesEntries.length === 0 && <span className="rk-note">Todavía ninguno. Tipeá los IV y el CP y apretá Enter.</span>}
                      {speciesEntries.map((e) => (
                        <EntryRow
                          key={e.id}
                          entry={e}
                          settings={settings}
                          current={selected?.id === e.id}
                          onSelect={() => setSelectedId(e.id)}
                          onDelete={() => deleteEntry(e.id)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: "flex", flexDirection: "column", flexGrow: 1, minWidth: 0, minHeight: 0 }}>
                {selected ? (
                  <EntryDetail entry={selected} settings={settings} onDelete={() => deleteEntry(selected.id)} />
                ) : (
                  <div className="rk-panel" style={{ flexGrow: 1, justifyContent: "center", alignItems: "center", gap: 12 }}>
                    <span className="display" style={{ fontSize: 26, fontWeight: 800 }}>
                      {species ? `Cargá tu primer ${species.name}` : "Elegí una especie"}
                    </span>
                    <span className="rk-note" style={{ maxWidth: 520, textAlign: "center" }}>
                      {species
                        ? "Acá vas a ver su rango de IV en cada liga, como él y como cada evolución, y lo que cuesta llegar."
                        : "Buscala por nombre o por número de pokédex. Apretá / para ir al buscador."}
                    </span>
                  </div>
                )}
              </div>
            </>
          ) : (
            <DexView
              entries={entries}
              settings={settings}
              league={dexLeague}
              mode={dexMode}
              onLeague={setDexLeague}
              onMode={setDexMode}
              onOpen={openEntry}
              onDelete={deleteEntry}
            />
          )}
        </div>
      </main>
    </Viewport>
  );
}

function Setting({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span className="label" style={{ fontSize: 10 }}>{label}</span>
      <span className="rk-seg" role="group" aria-label={label.toLowerCase()}>
        {children}
      </span>
    </span>
  );
}

function SpeciesCard({ species, onStep }: { species: Species; onStep: (d: 1 | -1) => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="rk-sprite" src={withBasePath(`/sprites/pixel/${species.id}.png`)} alt="" width={72} height={72} />
      <div style={{ display: "flex", flexDirection: "column", gap: 6, flexGrow: 1, minWidth: 0 }}>
        <span style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <span className="display" style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em" }}>{species.name}</span>
          <span className="rk-num" style={{ color: "#9CA6B2" }}>#{species.dex}</span>
        </span>
        <TypeChips types={species.types} variant="row" />
        <span className="rk-cost">
          ATQ <b>{species.atk}</b> · DEF <b>{species.def}</b> · PS <b>{species.sta}</b>
        </span>
      </div>
      <span style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <button type="button" className="btn btn--icon" style={{ width: 34, height: 30 }} aria-label="Especie anterior (Ctrl ↑)" onClick={() => onStep(-1)}>
          ↑
        </button>
        <button type="button" className="btn btn--icon" style={{ width: 34, height: 30 }} aria-label="Especie siguiente (Ctrl ↓)" onClick={() => onStep(1)}>
          ↓
        </button>
      </span>
    </div>
  );
}

function EntryRow({
  entry,
  settings,
  current,
  onSelect,
  onDelete,
}: {
  entry: BoxEntry;
  settings: RankerSettings;
  current: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const best = useMemo(() => {
    let b: { rank: number; league: string; form: string } | null = null;
    for (const r of analyzeEntry(entry, settings)) {
      if (r.target.isMega) continue;
      for (const c of r.cells) {
        if (c.row && !c.overLevel && (!b || c.row.rank < b.rank)) b = { rank: c.row.rank, league: c.league.short, form: r.target.species.name };
      }
    }
    return b;
  }, [entry, settings]);

  return (
    <div className={`rk-row rk-list-enter ${current ? "rk-row--current" : ""}`} style={{ paddingRight: 6 }}>
      <button type="button" onClick={onSelect} style={{ display: "flex", alignItems: "center", gap: 12, flexGrow: 1, minWidth: 0, height: 48, border: 0, background: "transparent", color: "inherit", textAlign: "left", padding: 0 }}>
        <span className="rk-num" style={{ width: 84, fontSize: 15.5, fontWeight: 600 }}>
          {entry.atk}/{entry.def}/{entry.sta}
        </span>
        <span className="rk-cost" style={{ width: 118 }}>
          CP {fmt(entry.cp)} · nv {formatLevel(entry.level)}
        </span>
        {best && (
          <span style={{ display: "flex", alignItems: "baseline", gap: 6, minWidth: 0 }}>
            <span className={`rk-rank ${best.rank <= DEX_MAX_RANK ? "rk-rank--good" : ""}`} style={{ fontSize: 18 }}>#{fmt(best.rank)}</span>
            <span className="rk-cost" style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
              {best.league} · {best.form}
            </span>
          </span>
        )}
      </button>
      <button type="button" className="btn btn--icon" style={{ width: 30, height: 30, background: "transparent", color: "#9CA6B2" }} aria-label="Quitar de la caja" onClick={onDelete}>
        ×
      </button>
    </div>
  );
}
