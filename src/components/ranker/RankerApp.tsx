"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Viewport } from "@/components/Viewport";
import { Brand } from "@/components/NavLinks";
import { bestRankOf, type BoxEntry } from "@/lib/ranker/analysis";
import { SPECIES, familyRootOf, getSpecies, type RankerLeagueKey, type Species } from "@/lib/ranker/data";
import { fmt } from "@/lib/ranker/format";
import type { IvSubmit } from "./IvInput";
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
import { SpeciesPicker, SpeciesCard, type SpeciesPickerHandle } from "./SpeciesPicker";
import { IvInput, type IvInputHandle } from "./IvInput";
import { EntryDetail } from "./EntryDetail";
import { DexView, type DexMode } from "./DexView";

const LAST_SPECIES_KEY = "pokego-pvp:ranker:last-species";
const VARIANT_LABEL: Record<string, string> = { normal: "", shadow: "oscuro", purified: "purificado" };

type View = "cargar" | "pokedex";

export function RankerApp() {
  const [ready, setReady] = useState(false);
  const [entries, setEntries] = useState<BoxEntry[]>([]);
  const [settings, setSettings] = useState<RankerSettings>(DEFAULT_RANKER_SETTINGS);
  const [view, setView] = useState<View>("cargar");
  const [speciesId, setSpeciesId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dexLeague, setDexLeague] = useState<RankerLeagueKey>("great");
  const [dexMode, setDexMode] = useState<DexMode>("utiles");
  const [pendingImport, setPendingImport] = useState<{ entries: BoxEntry[]; skipped: number; name: string } | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importedOk, setImportedOk] = useState<number | null>(null);

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

  useEffect(() => {
    if (importedOk === null) return;
    const t = setTimeout(() => setImportedOk(null), 6000);
    return () => clearTimeout(t);
  }, [importedOk]);

  const species = speciesId ? getSpecies(speciesId) ?? null : null;
  // "Cargados de esta línea" agrupa toda la familia (Mudkip, Marshtomp,
  // Swampert…), no solo la especie exacta elegida: un Marshtomp cargado
  // aparte sigue siendo la misma línea.
  const familyRoot = species ? familyRootOf(species.id) : null;
  const familyEntries = useMemo(
    () => (familyRoot ? entries.filter((e) => familyRootOf(e.speciesId) === familyRoot).sort((a, b) => b.addedAt - a.addedAt) : []),
    [entries, familyRoot]
  );
  const editingEntry = editingId ? entries.find((e) => e.id === editingId) ?? null : null;
  const selected = entries.find((e) => e.id === selectedId) ?? familyEntries[0] ?? null;

  const chooseSpecies = useCallback((s: Species) => {
    setSpeciesId(s.id);
    setSelectedId(null);
    setEditingId(null);
    setTimeout(() => ivRef.current?.focus(), 0);
  }, []);

  const stepSpecies = useCallback(
    (dir: 1 | -1) => {
      const idx = SPECIES.findIndex((s) => s.id === speciesId);
      const next = SPECIES[Math.min(SPECIES.length - 1, Math.max(0, idx + dir))];
      if (next && !next.shadow && !next.mega) {
        setSpeciesId(next.id);
        setSelectedId(null);
        setEditingId(null);
      }
    },
    [speciesId]
  );

  const addEntry = (s: IvSubmit) => {
    if (!species) return;
    const { reading: r, variant, lucky } = s;
    const e: BoxEntry = { id: newId(), speciesId: species.id, atk: r.atk, def: r.def, sta: r.sta, cp: r.cp, level: r.level, variant, lucky, addedAt: Date.now() };
    setEntries((xs) => [...xs, e]);
    setSelectedId(e.id);
  };

  const saveEdit = (s: IvSubmit) => {
    if (!editingId) return;
    const { reading: r, variant, lucky } = s;
    setEntries((xs) => xs.map((e) => (e.id === editingId ? { ...e, atk: r.atk, def: r.def, sta: r.sta, cp: r.cp, level: r.level, variant, lucky } : e)));
    setEditingId(null);
    setSelectedId(editingId);
  };

  const deleteEntry = (id: string) => {
    setEntries((xs) => xs.filter((e) => e.id !== id));
    if (selectedId === id) setSelectedId(null);
    if (editingId === id) setEditingId(null);
  };

  const deleteMany = (ids: string[]) => {
    const set = new Set(ids);
    setEntries((xs) => xs.filter((e) => !set.has(e.id)));
  };

  const openEntry = (e: BoxEntry) => {
    setSpeciesId(e.speciesId);
    setSelectedId(e.id);
    setEditingId(null);
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
      if (e.key.toLowerCase() === "e" && !typing && selected && !editingId && view === "cargar") {
        e.preventDefault();
        setEditingId(selected.id);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, editingId, view]);

  const set = (patch: Partial<RankerSettings>) => setSettings((s) => ({ ...s, ...patch }));

  return (
    <Viewport>
      <main style={{ position: "relative", width: "100%", height: "var(--h)", display: "flex", flexDirection: "column", overflow: "hidden", background: "radial-gradient(1000px 600px at 20% 0%, rgba(92,152,236,0.10), rgba(92,152,236,0) 70%), #080A0D" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 60, padding: "0 48px", flexShrink: 0, boxShadow: "inset 0 -1px 0 rgba(255,255,255,0.08)" }}>
          <Brand current="rankeador" />
          <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button type="button" className="btn" style={{ height: 44 }} onClick={doExport} disabled={!entries.length}>
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true"><path d="M7.5 9.5V1.8M4.4 4.6l3.1-3 3.1 3M2 9.5v3.2h11V9.5" stroke="#F2F3F5" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" /></svg>
              Exportar
            </button>
            <button type="button" className="btn" style={{ height: 44 }} onClick={() => fileRef.current?.click()}>
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true"><path d="M7.5 1.8v7.7M4.4 6.6l3.1 3 3.1-3M2 9.5v3.2h11V9.5" stroke="#F2F3F5" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" /></svg>
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
              Cargar
            </button>
            <button type="button" role="tab" className="rk-tab" aria-selected={view === "pokedex"} onClick={() => setView("pokedex")}>
              Mi pokédex <span className="rk-count">{entries.length}</span>
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
            <Setting label="3ER ATAQUE">
              <button type="button" aria-pressed={settings.showThirdMove} onClick={() => set({ showThirdMove: true })}>
                Mostrar
              </button>
              <button type="button" aria-pressed={!settings.showThirdMove} onClick={() => set({ showThirdMove: false })}>
                Ocultar
              </button>
            </Setting>
          </span>
        </div>

        {(pendingImport || importError || importedOk !== null) && (
          <div className={`rk-band ${importError ? "rk-band--red" : importedOk !== null ? "rk-band--green" : "rk-band--amber"}`} style={{ margin: "0 48px 16px", flexShrink: 0 }}>
            <span className="rk-band__dot" style={{ background: importError ? "#FF7E7E" : importedOk !== null ? "#52E79D" : "#F8C066" }} />
            {importError ? (
              <span style={{ flexGrow: 1, display: "flex", flexDirection: "column", gap: 3 }}>
                <span style={{ fontSize: 16, fontWeight: 600 }}>Ese archivo no es una caja de PokéGO PVP</span>
                <span style={{ fontSize: 14, color: "#DCE1E7" }}>No tocamos nada: tu caja sigue igual. Tiene que ser el .json que baja el botón Exportar.</span>
              </span>
            ) : importedOk !== null ? (
              <span style={{ flexGrow: 1, display: "flex", flexDirection: "column", gap: 3 }}>
                <span style={{ fontSize: 16, fontWeight: 600 }}>Caja importada: {fmt(importedOk)} Pokémon</span>
              </span>
            ) : (
              <span style={{ flexGrow: 1, display: "flex", flexDirection: "column", gap: 3 }}>
                <span style={{ fontSize: 16, fontWeight: 600 }}>Vas a reemplazar tu caja</span>
                <span style={{ fontSize: 14, color: "#DCE1E7" }}>
                  Tenés {fmt(entries.length)} Pokémon cargados y {pendingImport!.name} trae {fmt(pendingImport!.entries.length)}
                  {pendingImport!.skipped === 1 ? " (1 ilegible se descarta)" : pendingImport!.skipped ? ` (${pendingImport!.skipped} ilegibles se descartan)` : ""}.
                  Los de ahora se borran: si los querés guardar, exportá primero.
                </span>
              </span>
            )}
            <span style={{ display: "flex", gap: 10 }}>
              {pendingImport && !importError && importedOk === null && (
                <>
                  <button type="button" className="btn" style={{ height: 40 }} onClick={doExport} disabled={!entries.length}>
                    Exportar la actual
                  </button>
                  <button
                    type="button"
                    className="btn btn--primary"
                    style={{ height: 40 }}
                    onClick={() => {
                      setEntries(pendingImport.entries);
                      setImportedOk(pendingImport.entries.length);
                      setSelectedId(null);
                      setEditingId(null);
                      setPendingImport(null);
                    }}
                  >
                    Reemplazar
                  </button>
                </>
              )}
              <button type="button" className="btn btn--ghost" style={{ height: 40 }} onClick={() => { setPendingImport(null); setImportError(null); setImportedOk(null); }}>
                {importError ? "Cerrar" : importedOk !== null ? "Cerrar" : "Cancelar"}
              </button>
            </span>
          </div>
        )}

        <div style={{ display: "flex", gap: 28, padding: "0 48px 24px", flexGrow: 1, minHeight: 0 }}>
          {view === "cargar" ? (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: 14, width: "clamp(420px, 27vw, 500px)", flexShrink: 0, minHeight: 0 }}>
                <div className="rk-panel" style={{ gap: 14, overflow: "visible", clipPath: "none" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span className="label" style={{ fontSize: 11 }}>Especie</span>
                    <span className="rk-cost" style={{ fontSize: 11 }}>PASO 1</span>
                  </div>
                  <SpeciesPicker ref={pickerRef} onPick={chooseSpecies} />
                  {species && <SpeciesCard species={species} onPick={chooseSpecies} />}
                </div>

                {species && !editingEntry && (
                  <div className="rk-panel" style={{ gap: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span className="label" style={{ fontSize: 11 }}>IV y PC</span>
                      <span className="rk-cost" style={{ fontSize: 11 }}>ATQ · DEF · PS — PC</span>
                    </div>
                    <IvInput ref={ivRef} species={species} settings={settings} onSubmit={addEntry} onNextSpecies={stepSpecies} />
                  </div>
                )}

                {editingEntry && (
                  <div className="rk-panel" style={{ gap: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span className="label" style={{ fontSize: 11 }}>Editar un cargado</span>
                      <span className="rk-cost" style={{ fontSize: 11 }}>E EN LA FILA · ESC CANCELA</span>
                    </div>
                    <IvInput
                      species={getSpecies(editingEntry.speciesId)!}
                      settings={settings}
                      initial={editingEntry}
                      onSubmit={saveEdit}
                      onCancel={() => setEditingId(null)}
                    />
                  </div>
                )}

                {species && (
                  <div className="rk-panel" style={{ gap: 10, flexGrow: 1, minHeight: 0 }}>
                    <span className="label" style={{ fontSize: 11 }}>
                      CARGADOS DE ESTA LÍNEA · {familyEntries.length}
                    </span>
                    <div className="scroll-list" style={{ display: "flex", flexDirection: "column", gap: 2, minHeight: 0 }}>
                      {familyEntries.length === 0 && <span className="rk-note">Todavía ninguno. Tipeá los IV y el CP y apretá Enter.</span>}
                      {familyEntries.map((e) => (
                        <EntryRow
                          key={e.id}
                          entry={e}
                          settings={settings}
                          current={selected?.id === e.id}
                          onSelect={() => { setSelectedId(e.id); setEditingId(null); }}
                          onEdit={() => setEditingId(e.id)}
                          onDelete={() => deleteEntry(e.id)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: "flex", flexDirection: "column", flexGrow: 1, minWidth: 0, minHeight: 0 }}>
                {selected ? (
                  <EntryDetail entry={selected} settings={settings} onEdit={() => setEditingId(selected.id)} onDelete={() => deleteEntry(selected.id)} />
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
              onDeleteMany={deleteMany}
              onRestore={setEntries}
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

function EntryRow({
  entry,
  settings,
  current,
  onSelect,
  onEdit,
  onDelete,
}: {
  entry: BoxEntry;
  settings: RankerSettings;
  current: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const species = getSpecies(entry.speciesId)!;
  const best = useMemo(() => bestRankOf(entry, settings), [entry, settings]);

  return (
    <div className={`rk-row rk-list-enter ${current ? "rk-row--current" : ""}`} style={{ paddingRight: 6, height: 62 }}>
      <button type="button" onClick={onSelect} style={{ display: "flex", alignItems: "center", gap: 8, flexGrow: 1, minWidth: 0, height: 62, border: 0, background: "transparent", color: "inherit", textAlign: "left", padding: 0 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="rk-sprite" src={withBasePath(`/sprites/pixel/${species.id}.png`)} alt="" style={{ width: 72, height: 72, margin: "-10px -6px -10px -8px" }} />
        <span style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0, flexShrink: 0, width: 108 }}>
          <span style={{ fontSize: 15, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {species.name}
            {entry.variant !== "normal" && <span className="rk-cost" style={{ fontSize: 10.5 }}> {VARIANT_LABEL[entry.variant]}</span>}
          </span>
          <span className="rk-num" style={{ fontSize: 13, fontWeight: 600, color: "#DCE1E7", whiteSpace: "nowrap" }}>{entry.atk} / {entry.def} / {entry.sta}</span>
        </span>
        {best && (
          <span className={`rk-chip ${best.rank <= 100 ? "rk-chip--good" : ""}`}>
            <span className="rk-rank" style={{ fontSize: 17, color: best.rank <= 100 ? "#86EFBC" : "#9CA6B2" }}>#{fmt(best.rank)}</span>
            <span className="rk-cost" style={{ fontSize: 10.5, textTransform: "uppercase", color: best.rank <= 100 ? "#86EFBC" : "#9CA6B2" }}>{best.league.short}</span>
          </span>
        )}
        {best?.pvpoke && (
          <span className="rk-chip">
            <span className="rk-cost" style={{ fontSize: 9.5 }}>PVP</span>
            <span className="rk-rank" style={{ fontSize: 17 }}>#{fmt(best.pvpoke)}</span>
          </span>
        )}
      </button>
      <span style={{ display: "flex", gap: 4 }}>
        <button type="button" className="btn btn--icon" style={{ width: 30, height: 30, background: "rgba(255,255,255,0.07)" }} aria-label="Editar" onClick={onEdit}>
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M2 12h2.6L11.8 4.8 9.2 2.2 2 9.4V12z" stroke="#A8B0BB" strokeWidth={1.4} strokeLinejoin="round" /></svg>
        </button>
        <button type="button" className="btn btn--icon" style={{ width: 30, height: 30, background: "rgba(255,255,255,0.07)", color: "#9CA6B2" }} aria-label="Quitar de la caja" onClick={onDelete}>
          ×
        </button>
      </span>
    </div>
  );
}
