"use client";

import { useEffect, useMemo, useState } from "react";
import { getPokemon, META, type LeagueKey } from "@/lib/data";
import { rankTeamAgainst } from "@/lib/team";
import { matchupAdvantage, relevantAttackTypes } from "@/lib/matchup";
import { loadJSON, saveJSON } from "@/lib/storage";
import { LeagueDropdown } from "@/components/LeagueDropdown";
import { TeamSlots, type SlotBadge } from "@/components/TeamSlots";
import { BattleArena } from "@/components/BattleArena";
import { PickerModal } from "@/components/PickerModal";

const STORAGE_KEY = "pokego-pvp:v2";

interface PersistedState {
  league: LeagueKey;
  team: (string | null)[];
  activeIndex: number;
  enemyTeam: (string | null)[];
  enemyActiveIndex: number;
}

const DEFAULT_STATE: PersistedState = {
  league: "great",
  team: [null, null, null],
  activeIndex: 0,
  enemyTeam: [null, null, null],
  enemyActiveIndex: 0,
};

type PickerTarget = { side: "ally" | "enemy"; index: number } | null;

export default function Home() {
  const [ready, setReady] = useState(false);
  const [league, setLeague] = useState<LeagueKey>(DEFAULT_STATE.league);
  const [team, setTeam] = useState<(string | null)[]>(DEFAULT_STATE.team);
  const [activeIndex, setActiveIndex] = useState(DEFAULT_STATE.activeIndex);
  const [enemyTeam, setEnemyTeam] = useState<(string | null)[]>(DEFAULT_STATE.enemyTeam);
  const [enemyActiveIndex, setEnemyActiveIndex] = useState(DEFAULT_STATE.enemyActiveIndex);

  const [picker, setPicker] = useState<PickerTarget>(null);

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
    setEnemyTeam(saved.enemyTeam?.length === 3 ? saved.enemyTeam : DEFAULT_STATE.enemyTeam);
    setEnemyActiveIndex(saved.enemyActiveIndex ?? 0);
    setReady(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!ready) return;
    saveJSON(STORAGE_KEY, { league, team, activeIndex, enemyTeam, enemyActiveIndex });
  }, [ready, league, team, activeIndex, enemyTeam, enemyActiveIndex]);

  const teamPokemon = useMemo(() => team.map((id) => (id ? getPokemon(id) ?? null : null)), [team]);
  const enemyPokemon = useMemo(
    () => enemyTeam.map((id) => (id ? getPokemon(id) ?? null : null)),
    [enemyTeam]
  );
  const activeAlly = teamPokemon[activeIndex] ?? null;
  const activeEnemy = enemyPokemon[enemyActiveIndex] ?? null;

  // Tipos de ataque relevantes de cada equipo, para resaltar en el panel de
  // tipos del otro lado solo lo que efectivamente puede pasar en esta pelea.
  const allyAttackTypes = useMemo(() => relevantAttackTypes(teamPokemon, league), [teamPokemon, league]);
  const enemyAttackTypes = useMemo(
    () => relevantAttackTypes(enemyPokemon, league),
    [enemyPokemon, league]
  );

  // Badges de la columna enemiga: "!" si ese enemigo tiene ventaja contra mi
  // Pokémon activo (me conviene tenerlo en cuenta / cuidado si sale).
  const enemyBadges: SlotBadge[] = useMemo(() => {
    if (!activeAlly) return enemyPokemon.map(() => null);
    return enemyPokemon.map((p) => (p && matchupAdvantage(p, activeAlly, league).advantage ? "warn" : null));
  }, [enemyPokemon, activeAlly, league]);

  // Badges de la columna aliada: "+" si ese aliado tiene ventaja contra el
  // enemigo activo (sugerencia de a quién cambiar).
  const allyBadges: SlotBadge[] = useMemo(() => {
    if (!activeEnemy) return teamPokemon.map(() => null);
    return teamPokemon.map((p) => (p && matchupAdvantage(p, activeEnemy, league).advantage ? "good" : null));
  }, [teamPokemon, activeEnemy, league]);

  // Entre los aliados con ventaja, cuál es el mejor switch (para el anillo extra).
  const bestAllyIndex = useMemo(() => {
    if (!activeEnemy) return null;
    const scores = rankTeamAgainst(teamPokemon, activeEnemy, league);
    let bestIdx: number | null = null;
    let bestTotal = -Infinity;
    scores.forEach((s, i) => {
      if (s && s.total > bestTotal) {
        bestTotal = s.total;
        bestIdx = i;
      }
    });
    return bestIdx;
  }, [teamPokemon, activeEnemy, league]);

  function assignSlot(side: "ally" | "enemy", index: number, speciesId: string) {
    if (side === "ally") {
      setTeam((prev) => prev.map((id, i) => (i === index ? speciesId : id)));
      // Si no había nadie activo (equipo recién vaciado), el primero que se
      // asigna pasa a ser el activo automáticamente.
      if (!team[activeIndex]) setActiveIndex(index);
    } else {
      setEnemyTeam((prev) => prev.map((id, i) => (i === index ? speciesId : id)));
      if (!enemyTeam[enemyActiveIndex]) setEnemyActiveIndex(index);
    }
    setPicker(null);
  }

  function clearSlot(side: "ally" | "enemy", index: number) {
    if (side === "ally") {
      setTeam((prev) => prev.map((id, i) => (i === index ? null : id)));
      if (activeIndex === index) {
        const otherIdx = team.findIndex((id, i) => i !== index && id !== null);
        if (otherIdx !== -1) setActiveIndex(otherIdx);
      }
    } else {
      setEnemyTeam((prev) => prev.map((id, i) => (i === index ? null : id)));
      if (enemyActiveIndex === index) {
        const otherIdx = enemyTeam.findIndex((id, i) => i !== index && id !== null);
        if (otherIdx !== -1) setEnemyActiveIndex(otherIdx);
      }
    }
  }

  function handleNewBattle() {
    setEnemyTeam([null, null, null]);
    setEnemyActiveIndex(0);
  }

  const gamemasterDate = META.gamemasterTimestamp
    ? new Date(META.gamemasterTimestamp).toLocaleDateString("es-AR")
    : null;

  const pickerLeague = league;

  return (
    <main className="w-full min-h-screen flex flex-col items-center p-4 gap-3">
      <h1 className="text-[13px] font-bold text-white" style={{ textShadow: "2px 2px 0 rgba(0,0,0,0.6)" }}>
        PokéGO PVP
      </h1>

      <div className="w-full max-w-[1200px] flex flex-col lg:flex-row gap-3 items-start">
        {/* Columna izquierda: liga + enemigos */}
        <div className="gb-box-dark p-3 flex flex-col gap-3 items-center w-full lg:w-[180px] shrink-0">
          <LeagueDropdown value={league} onChange={setLeague} />
          <TeamSlots
            title="Enemigos"
            team={enemyPokemon}
            activeIndex={enemyActiveIndex}
            badges={enemyBadges}
            onSelect={setEnemyActiveIndex}
            onAdd={(i) => setPicker({ side: "enemy", index: i })}
            onClear={(i) => clearSlot("enemy", i)}
          />
          <button
            onClick={handleNewBattle}
            className="text-[8px] px-2 py-1.5 rounded border-2 border-black bg-neutral-800 text-neutral-100 hover:bg-neutral-700"
          >
            Nuevo combate
          </button>
        </div>

        {/* Centro: arena de combate */}
        <BattleArena
          enemy={activeEnemy}
          ally={activeAlly}
          league={league}
          enemyRelevantTypes={allyAttackTypes}
          allyRelevantTypes={enemyAttackTypes}
        />

        {/* Columna derecha: aliados */}
        <div className="gb-box-dark p-3 flex flex-col gap-3 items-center w-full lg:w-[180px] shrink-0">
          <TeamSlots
            title="Aliados"
            team={teamPokemon}
            activeIndex={activeIndex}
            badges={allyBadges}
            highlightIndex={bestAllyIndex}
            onSelect={setActiveIndex}
            onAdd={(i) => setPicker({ side: "ally", index: i })}
            onClear={(i) => clearSlot("ally", i)}
          />
        </div>
      </div>

      <footer className="text-[7px] text-neutral-400 text-center">
        Datos de tipos, movesets y rankings de{" "}
        <a href="https://pvpoke.com" target="_blank" rel="noreferrer" className="underline">
          PvPoke
        </a>
        {gamemasterDate ? ` · actualizado ${gamemasterDate}` : ""}
      </footer>

      {picker && (
        <PickerModal
          league={pickerLeague}
          title={picker.side === "enemy" ? "Elegir Pokémon enemigo" : "Elegir tu Pokémon"}
          onSelect={(id) => assignSlot(picker.side, picker.index, id)}
          onClose={() => setPicker(null)}
        />
      )}
    </main>
  );
}
