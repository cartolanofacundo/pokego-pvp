import type { LeagueKey, Pokemon } from "@/lib/data";
import type { ActionId, Combo } from "@/lib/shortcuts";
import { verdict } from "@/lib/verdict";
import { Track } from "./Track";
import { Header } from "./Header";
import { Rail } from "./Rail";
import { STATUS, type CardStatus } from "./Card";
import { StatsBox } from "./StatsBox";
import { EmptyBox } from "./EmptyBox";
import { Stage, Connector } from "./Stage";

export interface BattleViewState {
  league: LeagueKey;
  team: (Pokemon | null)[];
  activeIndex: number;
  enemyTeam: (Pokemon | null)[];
  enemyActiveIndex: number;
}

/**
 * Pantalla de combate completa (Main / Sin-Enemigo / Vacio según el estado).
 * Diagonal: caja rival arriba-izquierda y su Pokémon arriba-derecha; tu
 * Pokémon abajo-izquierda y tu caja abajo-derecha. Los dos sprites se meten
 * 180 px sobre el riel del bando contrario a propósito.
 */
export function BattleScreen({
  view,
  shortcuts,
  onCycleLeague,
  onNewBattle,
  onOpenConfig,
  onSelect,
  onAdd,
}: {
  view: BattleViewState;
  shortcuts: Record<ActionId, Combo | null>;
  onCycleLeague: () => void;
  onNewBattle: () => void;
  onOpenConfig: () => void;
  onSelect: (side: "rival" | "ally", slot: number) => void;
  onAdd: (side: "rival" | "ally", slot: number | null) => void;
}) {
  const { league, team, activeIndex, enemyTeam, enemyActiveIndex } = view;
  const ally = team[activeIndex] ?? null;
  const rival = enemyTeam[enemyActiveIndex] ?? null;
  const teamEmpty = team.every((p) => p === null);

  // Semáforo. Rival: X del banco rival contra mi activo, en primera persona
  // (TE GANA / PAREJO / LE GANÁS). Solo con un rival en campo; si no, se
  // muestran normales (EN CAMPO / EN BANCA). Propio: X de mi banco contra el
  // rival activo (GANA / PAREJO / PIERDE); sin rival, EN CAMPO / EN BANCA.
  const rivalStatuses: (CardStatus | null)[] = enemyTeam.map((p, i) => {
    if (!p) return null;
    if (!ally || !rival) return i === enemyActiveIndex ? STATUS.field : STATUS.bench;
    const v = verdict(p, ally, league);
    return v === "win" ? STATUS.rivalWins : v === "lose" ? STATUS.rivalLoses : STATUS.rivalEven;
  });
  const allyStatuses: (CardStatus | null)[] = team.map((p, i) => {
    if (!p) return null;
    if (!rival) return i === activeIndex ? STATUS.field : STATUS.bench;
    const v = verdict(p, rival, league);
    return v === "win" ? STATUS.allyWins : v === "lose" ? STATUS.allyLoses : STATUS.allyEven;
  });

  return (
    <div
      style={{
        position: "relative", width: 1920, height: 1080, display: "flex", flexDirection: "column",
        background: "#080A0D", color: "#F2F3F5", overflow: "hidden",
      }}
    >
      <Track />
      <Header league={league} onCycleLeague={onCycleLeague} onNewBattle={onNewBattle} onOpenConfig={onOpenConfig} />

      <div style={{ position: "relative", display: "flex", gap: 40, padding: "0 48px 20px", flexGrow: 1, minHeight: 0 }}>
        <Rail
          side="rival"
          team={enemyTeam}
          activeIndex={enemyActiveIndex}
          statuses={rivalStatuses}
          addCombo={shortcuts.addRival}
          onSelect={(i) => onSelect("rival", i)}
          onAdd={(i) => onAdd("rival", i)}
        />

        <div style={{ display: "flex", flexDirection: "column", flexGrow: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
            {rival ? (
              <StatsBox side="rival" pokemon={rival} opponent={ally} league={league} />
            ) : (
              <EmptyBox side="rival" variant="rival" combo={shortcuts.addRival} onAdd={() => onAdd("rival", null)} />
            )}
            <Connector side="rival" dim={rival === null} />
            <Stage side="rival" pokemon={rival} />
          </div>

          <div style={{ flexGrow: 1, minHeight: 0 }} />

          <div style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
            <Stage side="ally" pokemon={ally} />
            <Connector side="ally" dim={ally === null} />
            {ally ? (
              <StatsBox side="ally" pokemon={ally} opponent={rival} league={league} />
            ) : (
              <EmptyBox side="ally" variant={teamEmpty ? "first" : "rival"} combo={shortcuts.addAlly} onAdd={() => onAdd("ally", null)} />
            )}
          </div>
        </div>

        <Rail
          side="ally"
          team={team}
          activeIndex={activeIndex}
          statuses={allyStatuses}
          addCombo={shortcuts.addAlly}
          onSelect={(i) => onSelect("ally", i)}
          onAdd={(i) => onAdd("ally", i)}
        />
      </div>
    </div>
  );
}
