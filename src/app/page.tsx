"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getPokemon, LEAGUES, type LeagueKey, type Pokemon } from "@/lib/data";
import { loadJSON, saveJSON } from "@/lib/storage";
import {
  combosEqual,
  comboFromEvent,
  DEFAULT_SHORTCUTS,
  loadShortcuts,
  saveShortcuts,
  type ActionId,
  type Combo,
} from "@/lib/shortcuts";
import { BattleScreen, type BattleViewState } from "@/components/BattleScreen";
import { SearchModal } from "@/components/SearchModal";
import { ConfigScreen } from "@/components/ConfigScreen";
import { ShortcutModal } from "@/components/ShortcutModal";
import { Onboarding } from "@/components/Onboarding";
import { Coach, COACH_STEPS } from "@/components/Coach";
import { Viewport } from "@/components/Viewport";

const STORAGE_KEY = "pokego-pvp:v3";
const ONBOARDED_KEY = "pokego-pvp:onboarded:v1";
const LEAGUE_ORDER: LeagueKey[] = LEAGUES.map((l) => l.key);

interface Persisted {
  league: LeagueKey;
  team: (string | null)[];
  activeIndex: number;
  enemyTeam: (string | null)[];
  enemyActiveIndex: number;
}

const EMPTY: Persisted = {
  league: LEAGUE_ORDER[0],
  team: [null, null, null],
  activeIndex: 0,
  enemyTeam: [null, null, null],
  enemyActiveIndex: 0,
};

type Side = "rival" | "ally";
type Modal = { kind: "search"; side: Side; slot: number | null } | { kind: "shortcut"; action: ActionId } | null;
type Tour = { kind: "welcome" } | { kind: "coach"; step: number } | null;

// Estado de muestra para el recorrido: cada paso se apoya sobre la pantalla
// del estado que corresponde (vacío, sin rival, combate), con los mismos
// Pokémon que las mesas de trabajo. Al terminar se vuelve al estado real.
function demoState(step: number, league: LeagueKey): Persisted {
  if (step <= 2) return { ...EMPTY, league };
  if (step === 3) return { ...EMPTY, league, team: ["lapras", "annihilape", null], activeIndex: 0 };
  // Elenco rankeado en las tres ligas vigentes, así el recorrido se ve completo
  // en cualquiera. Rillaboom le pega x1.6 a Lapras: es el triángulo del paso 4.
  return {
    league,
    team: ["lapras", "annihilape", null],
    activeIndex: 0,
    enemyTeam: ["rillaboom", "regidrago", "raikou"],
    enemyActiveIndex: 0,
  };
}

// Un id guardado puede dejar de existir cuando cambia la rotación de ligas
// (por ejemplo, una especie que solo estaba en Great League): se vacía el hueco.
function knownIds(ids: (string | null)[] | undefined, fallback: (string | null)[]): (string | null)[] {
  if (ids?.length !== 3) return fallback;
  return ids.map((id) => (id && getPokemon(id) ? id : null));
}

function resolveTeam(ids: (string | null)[]): (Pokemon | null)[] {
  return ids.map((id) => (id ? getPokemon(id) ?? null : null));
}

export default function Home() {
  const [ready, setReady] = useState(false);
  const [state, setState] = useState<Persisted>(EMPTY);
  const [shortcuts, setShortcuts] = useState<Record<ActionId, Combo | null>>(DEFAULT_SHORTCUTS);
  const [screen, setScreen] = useState<"battle" | "config">("battle");
  const [modal, setModal] = useState<Modal>(null);
  const [tour, setTour] = useState<Tour>(null);

  // Carga única de localStorage al montar: no existe en el export estático.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const saved = loadJSON<Persisted>(STORAGE_KEY, EMPTY);
    setState({
      league: LEAGUE_ORDER.includes(saved.league) ? saved.league : LEAGUE_ORDER[0],
      team: knownIds(saved.team, EMPTY.team),
      activeIndex: saved.activeIndex ?? 0,
      enemyTeam: knownIds(saved.enemyTeam, EMPTY.enemyTeam),
      enemyActiveIndex: saved.enemyActiveIndex ?? 0,
    });
    setShortcuts(loadShortcuts());
    if (!loadJSON<boolean>(ONBOARDED_KEY, false)) setTour({ kind: "welcome" });
    setReady(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (ready) saveJSON(STORAGE_KEY, state);
  }, [ready, state]);

  // ---------- acciones ----------
  const update = useCallback((patch: Partial<Persisted> | ((s: Persisted) => Partial<Persisted>)) => {
    setState((s) => ({ ...s, ...(typeof patch === "function" ? patch(s) : patch) }));
  }, []);

  const cycleLeague = useCallback(() => {
    update((s) => ({ league: LEAGUE_ORDER[(LEAGUE_ORDER.indexOf(s.league) + 1) % LEAGUE_ORDER.length] }));
  }, [update]);

  const newBattle = useCallback(() => {
    update({ enemyTeam: [null, null, null], enemyActiveIndex: 0 });
  }, [update]);

  const setActive = useCallback(
    (side: Side, slot: number) => {
      update((s) => {
        const ids = side === "rival" ? s.enemyTeam : s.team;
        if (!ids[slot]) return {};
        return side === "rival" ? { enemyActiveIndex: slot } : { activeIndex: slot };
      });
    },
    [update]
  );

  const openSearch = useCallback((side: Side, slot: number | null) => {
    setScreen("battle");
    setModal({ kind: "search", side, slot });
  }, []);

  const addPokemon = useCallback(
    (side: Side, speciesId: string, slot: number | null) => {
      update((s) => {
        const ids = [...(side === "rival" ? s.enemyTeam : s.team)];
        const activeIdx = side === "rival" ? s.enemyActiveIndex : s.activeIndex;
        const target = slot !== null && !ids[slot] ? slot : ids.findIndex((id) => id === null);
        if (target === -1) return {};
        ids[target] = speciesId;
        // El rival recién cargado es el que está en cancha. El aliado solo
        // toma el campo si no había nadie activo.
        const becomesActive = side === "rival" || !ids[activeIdx];
        if (side === "rival") return { enemyTeam: ids, enemyActiveIndex: becomesActive ? target : activeIdx };
        return { team: ids, activeIndex: becomesActive ? target : activeIdx };
      });
      setModal(null);
    },
    [update]
  );

  const removePokemon = useCallback(
    (side: Side, slot: number) => {
      update((s) => {
        const ids = [...(side === "rival" ? s.enemyTeam : s.team)];
        if (!ids[slot]) return {};
        ids[slot] = null;
        const activeIdx = side === "rival" ? s.enemyActiveIndex : s.activeIndex;
        let nextActive = activeIdx;
        if (activeIdx === slot) {
          const other = ids.findIndex((id) => id !== null);
          nextActive = other === -1 ? slot : other;
        }
        return side === "rival" ? { enemyTeam: ids, enemyActiveIndex: nextActive } : { team: ids, activeIndex: nextActive };
      });
    },
    [update]
  );

  const finishTour = useCallback(() => {
    setTour(null);
    saveJSON(ONBOARDED_KEY, true);
  }, []);

  // Poner en campo el cupo N: si está vacío, abre el buscador para ese cupo.
  const fieldSlot = useCallback(
    (side: Side, slot: number) => {
      const ids = side === "rival" ? state.enemyTeam : state.team;
      if (ids[slot]) setActive(side, slot);
      else openSearch(side, slot);
    },
    [state, setActive, openSearch]
  );

  const runAction = useCallback(
    (id: ActionId) => {
      switch (id) {
        case "rival1": return fieldSlot("rival", 0);
        case "rival2": return fieldSlot("rival", 1);
        case "rival3": return fieldSlot("rival", 2);
        case "ally1": return fieldSlot("ally", 0);
        case "ally2": return fieldSlot("ally", 1);
        case "ally3": return fieldSlot("ally", 2);
        case "addRival": return openSearch("rival", null);
        case "addAlly": return openSearch("ally", null);
        case "newBattle": return newBattle();
        case "cycleLeague": return cycleLeague();
        case "openConfig": return setScreen("config");
        case "removeSelected": {
          const el = document.activeElement as HTMLElement | null;
          const side = el?.dataset.side as Side | undefined;
          const slot = el?.dataset.slot;
          if (side && slot !== undefined) removePokemon(side, Number(slot));
          return;
        }
        case "close": return;
      }
    },
    [fieldSlot, openSearch, newBattle, cycleLeague, removePokemon]
  );

  // ---------- teclado global ----------
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      // Esc es fijo: cierra lo que esté más arriba.
      if (e.code === "Escape") {
        if (modal?.kind === "shortcut") return; // lo maneja el modal
        if (modal) { setModal(null); e.preventDefault(); return; }
        if (tour?.kind === "coach") { finishTour(); e.preventDefault(); return; }
        if (screen === "config") { setScreen("battle"); e.preventDefault(); return; }
        return;
      }
      if (modal || tour) return; // los modales y el recorrido capturan su propio teclado
      const combo = comboFromEvent(e);
      if (!combo) return;
      const inField = (e.target as HTMLElement | null)?.tagName === "INPUT" || (e.target as HTMLElement | null)?.tagName === "TEXTAREA";
      for (const [id, assigned] of Object.entries(shortcuts) as [ActionId, Combo | null][]) {
        if (id === "close" || !assigned) continue;
        if (!combosEqual(assigned, combo)) continue;
        // Las teclas sueltas no actúan mientras se escribe en un campo.
        if (inField && !assigned.ctrl && !assigned.alt) return;
        e.preventDefault();
        runAction(id);
        return;
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shortcuts, modal, tour, screen, runAction, finishTour]);

  // ---------- vista ----------
  const viewSource: Persisted = tour?.kind === "coach" ? demoState(tour.step, state.league) : state;
  const view: BattleViewState = useMemo(
    () => ({
      league: viewSource.league,
      team: resolveTeam(viewSource.team),
      activeIndex: viewSource.activeIndex,
      enemyTeam: resolveTeam(viewSource.enemyTeam),
      enemyActiveIndex: viewSource.enemyActiveIndex,
    }),
    [viewSource]
  );

  const searchTeamFull = modal?.kind === "search" && modal.slot === null
    ? (modal.side === "rival" ? state.enemyTeam : state.team).every((id) => id !== null)
    : false;

  return (
    <Viewport>
    <main style={{ position: "relative", width: "100%", height: "var(--h)", overflow: "hidden" }}>
      {screen === "config" ? (
        <ConfigScreen
          shortcuts={shortcuts}
          onEdit={(action) => setModal({ kind: "shortcut", action })}
          onRestoreDefaults={() => {
            setShortcuts(DEFAULT_SHORTCUTS);
            saveShortcuts(DEFAULT_SHORTCUTS);
          }}
          onBack={() => setScreen("battle")}
        />
      ) : (
        <BattleScreen
          view={view}
          shortcuts={shortcuts}
          onCycleLeague={cycleLeague}
          onNewBattle={newBattle}
          onOpenConfig={() => setScreen("config")}
          onSelect={setActive}
          onAdd={openSearch}
        />
      )}

      {modal?.kind === "search" && (
        <SearchModal
          key={modal.side}
          side={modal.side}
          league={state.league}
          addCombo={modal.side === "rival" ? shortcuts.addRival : shortcuts.addAlly}
          closeCombo={shortcuts.close}
          teamFull={searchTeamFull}
          onPick={(p) => addPokemon(modal.side, p.speciesId, modal.slot)}
          onSwitchSide={() => setModal({ kind: "search", side: modal.side === "rival" ? "ally" : "rival", slot: null })}
        />
      )}

      {modal?.kind === "shortcut" && (
        <ShortcutModal
          action={modal.action}
          shortcuts={shortcuts}
          onCancel={() => setModal(null)}
          onSave={(combo, stealFrom) => {
            const next = { ...shortcuts, [modal.action]: combo };
            if (stealFrom) next[stealFrom] = null;
            setShortcuts(next);
            saveShortcuts(next);
            setModal(null);
          }}
        />
      )}

      {tour?.kind === "welcome" && (
        <Onboarding shortcuts={shortcuts} onSkip={finishTour} onStartTour={() => setTour({ kind: "coach", step: 1 })} />
      )}
      {tour?.kind === "coach" && (
        <Coach
          step={tour.step}
          shortcuts={shortcuts}
          onSkip={finishTour}
          onNext={() => (tour.step >= COACH_STEPS.length ? finishTour() : setTour({ kind: "coach", step: tour.step + 1 }))}
        />
      )}
    </main>
    </Viewport>
  );
}
