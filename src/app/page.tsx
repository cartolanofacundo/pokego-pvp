"use client";

import { useEffect, useMemo, useState } from "react";
import { getPokemon, META, type LeagueKey } from "@/lib/data";
import { rankTeamAgainst } from "@/lib/team";
import { loadJSON, saveJSON } from "@/lib/storage";
import { LeagueSelector } from "@/components/LeagueSelector";
import { RivalZone } from "@/components/RivalZone";
import { RivalHistory } from "@/components/RivalHistory";
import { MyZone } from "@/components/MyZone";
import { MyTeam } from "@/components/MyTeam";

const STORAGE_KEY = "pokego-pvp:v1";

interface PersistedState {
  league: LeagueKey;
  team: (string | null)[];
  activeIndex: number;
}

const DEFAULT_STATE: PersistedState = {
  league: "great",
  team: [null, null, null],
  activeIndex: 0,
};

export default function Home() {
  const [ready, setReady] = useState(false);
  const [league, setLeague] = useState<LeagueKey>(DEFAULT_STATE.league);
  const [team, setTeam] = useState<(string | null)[]>(DEFAULT_STATE.team);
  const [activeIndex, setActiveIndex] = useState(DEFAULT_STATE.activeIndex);

  const [rivalId, setRivalId] = useState<string | null>(null);
  const [rivalHistoryIds, setRivalHistoryIds] = useState<string[]>([]);

  // Cargar estado persistido una vez montado: localStorage no existe en el
  // render estático del export, así que se lee recién en el cliente para no
  // romper la hidratación. Es una carga única (deps: []), no una
  // sincronización continua con un sistema externo.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const saved = loadJSON<PersistedState>(STORAGE_KEY, DEFAULT_STATE);
    setLeague(saved.league);
    setTeam(saved.team.length === 3 ? saved.team : DEFAULT_STATE.team);
    setActiveIndex(saved.activeIndex);
    setReady(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!ready) return;
    saveJSON(STORAGE_KEY, { league, team, activeIndex });
  }, [ready, league, team, activeIndex]);

  const teamPokemon = useMemo(
    () => team.map((id) => (id ? getPokemon(id) ?? null : null)),
    [team]
  );
  const activePokemon = teamPokemon[activeIndex] ?? null;
  const rival = rivalId ? getPokemon(rivalId) ?? null : null;
  const rivalHistory = useMemo(
    () => rivalHistoryIds.map((id) => getPokemon(id)).filter((p): p is NonNullable<typeof p> => !!p),
    [rivalHistoryIds]
  );

  const switchScores = useMemo(() => {
    if (!rival) return [null, null, null];
    return rankTeamAgainst(teamPokemon, rival, league);
  }, [teamPokemon, rival, league]);

  function handlePickRival(speciesId: string) {
    setRivalId(speciesId);
    setRivalHistoryIds((prev) => [speciesId, ...prev.filter((id) => id !== speciesId)]);
  }

  function handleAssign(index: number, speciesId: string) {
    setTeam((prev) => {
      const next = [...prev];
      next[index] = speciesId;
      return next;
    });
  }

  function handleClear(index: number) {
    setTeam((prev) => {
      const next = [...prev];
      next[index] = null;
      return next;
    });
    if (activeIndex === index) {
      const otherIdx = team.findIndex((id, i) => i !== index && id !== null);
      if (otherIdx !== -1) setActiveIndex(otherIdx);
    }
  }

  function handleNewBattle() {
    setRivalId(null);
    setRivalHistoryIds([]);
  }

  function handleLeagueChange(next: LeagueKey) {
    setLeague(next);
  }

  const gamemasterDate = META.gamemasterTimestamp
    ? new Date(META.gamemasterTimestamp).toLocaleDateString("es-AR")
    : null;

  return (
    <main className="w-full max-w-[480px] mx-auto min-h-screen battle-bg flex flex-col gap-2 p-2 pb-6">
      <header className="gb-box p-2 flex flex-col gap-2 items-center">
        <h1 className="text-[11px] font-bold">PokéGO PVP</h1>
        <LeagueSelector value={league} onChange={handleLeagueChange} />
      </header>

      <div className="flex gap-2 items-start">
        <RivalHistory
          history={rivalHistory}
          activeId={rivalId}
          onSelect={handlePickRival}
        />
        <div className="flex-1">
          <RivalZone
            rival={rival}
            myActive={activePokemon}
            league={league}
            onPickRival={handlePickRival}
          />
        </div>
      </div>

      <div className="flex gap-2 items-start">
        <div className="flex-1">
          <MyZone active={activePokemon} rival={rival} league={league} />
        </div>
        <MyTeam
          team={teamPokemon}
          scores={switchScores}
          activeIndex={activeIndex}
          league={league}
          onAssign={handleAssign}
          onClear={handleClear}
          onSetActive={setActiveIndex}
        />
      </div>

      <footer className="flex flex-col items-center gap-1 mt-2 text-[7px] text-neutral-400 text-center">
        <button
          onClick={handleNewBattle}
          className="px-3 py-1.5 rounded border-2 border-black bg-neutral-800 text-neutral-100 hover:bg-neutral-700"
        >
          Nuevo combate
        </button>
        <p>
          Datos de tipos, movesets y rankings de{" "}
          <a
            href="https://pvpoke.com"
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            PvPoke
          </a>
          {gamemasterDate ? ` · actualizado ${gamemasterDate}` : ""}
        </p>
      </footer>
    </main>
  );
}
