import { LEAGUES, type LeagueKey } from "@/lib/data";
import { ChevronDownIcon, GearIcon, PlusIcon14 } from "./Icons";

export function Header({
  league,
  onCycleLeague,
  onNewBattle,
  onOpenConfig,
}: {
  league: LeagueKey;
  onCycleLeague: () => void;
  onNewBattle: () => void;
  onOpenConfig: () => void;
}) {
  const current = LEAGUES.find((l) => l.key === league) ?? LEAGUES[0];
  return (
    <div
      style={{
        position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between",
        height: 60, padding: "0 48px", flexShrink: 0,
      }}
    >
      <span style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
        <span className="display" style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.03em" }}>
          PokéGO PVP
        </span>
        <span className="label label--rail" style={{ color: "#7C8694" }}>TIEMPO REAL</span>
      </span>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }} data-coach="header-controls">
        <button type="button" className="btn btn--league" onClick={onCycleLeague} aria-label={`Liga: ${current.label}. Cambiar de liga`}>
          <span>{current.label}</span>
          <span className="mono" style={{ fontSize: 11.5, fontWeight: 600, color: "#9BA3AE" }}>CP {current.cp}</span>
          <ChevronDownIcon />
        </button>
        <button type="button" className="btn" onClick={onNewBattle}>
          <PlusIcon14 />
          <span>Nuevo combate</span>
        </button>
        <button type="button" className="btn btn--icon" aria-label="Configuración" onClick={onOpenConfig}>
          <GearIcon />
        </button>
      </div>
    </div>
  );
}
