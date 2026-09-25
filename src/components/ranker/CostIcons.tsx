// Íconos de costo (polvo, caramelos, XL, energía Mega) copiados del diseño:
// monocromos, se distinguen por forma, siempre en el mismo orden. El texto
// completo va en `title` y `aria-label` para lectores de pantalla.

import type { LevelCost, ThirdMoveCost } from "@/lib/ranker/costs";
import { fmt, fmtDust } from "@/lib/ranker/format";

export function DustIcon({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" aria-hidden="true" style={{ flexShrink: 0 }}>
      <path d="M6 0.4 L7.3 4.7 L11.6 6 L7.3 7.3 L6 11.6 L4.7 7.3 L0.4 6 L4.7 4.7 Z" fill="#C2C9D2" />
    </svg>
  );
}

export function CandyIcon({ width = 17, height = 14, color = "#C2C9D2" }: { width?: number; height?: number; color?: string }) {
  return (
    <svg width={width} height={height} viewBox="0 0 15 12" aria-hidden="true" style={{ flexShrink: 0 }}>
      <ellipse cx="7.5" cy="6" rx="3.4" ry="3.1" fill={color} />
      <path d="M4.4 4.6 L0.8 2.4 L1.6 6 L0.8 9.6 L4.4 7.4 Z M10.6 4.6 L14.2 2.4 L13.4 6 L14.2 9.6 L10.6 7.4 Z" fill={color} />
    </svg>
  );
}

export function XlBadge() {
  return (
    <span
      aria-hidden="true"
      style={{
        display: "inline-flex", alignItems: "center", height: 14, padding: "0 3px", borderRadius: 3,
        boxShadow: "inset 0 0 0 1.2px #C2C9D2", fontFamily: "var(--font-mono)", fontSize: 8.5, fontWeight: 600,
        letterSpacing: "0.04em", color: "#C2C9D2", flexShrink: 0,
      }}
    >
      XL
    </span>
  );
}

export function MegaIcon({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" aria-hidden="true" style={{ flexShrink: 0 }}>
      <path d="M6 0.6 L10.8 3.3 L10.8 8.7 L6 11.4 L1.2 8.7 L1.2 3.3 Z" fill="none" stroke="#C2C9D2" strokeWidth={1.3} />
      <circle cx="6" cy="6" r="1.8" fill="#C2C9D2" />
    </svg>
  );
}

const item: React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: 5 };
const line: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 10, flexWrap: "wrap",
  fontFamily: "var(--font-mono)", fontSize: 12.5, fontWeight: 500, color: "#C2C9D2",
};

/** Costo de subir de nivel: polvo, caramelos y, si hace falta, caramelos XL. */
export function LevelCostLine({ cost, small }: { cost: LevelCost; small?: boolean }) {
  if (!cost.candy && !cost.xl && !cost.dust) {
    return <span className="rk-cost">{cost.needsBuddy ? "Solo falta el +1 de mejor amigo" : "Ya está en el nivel"}</span>;
  }
  const title = `${fmt(cost.dust)} polvo · ${fmt(cost.candy)} car${cost.xl ? ` · ${fmt(cost.xl)} XL` : ""}`;
  return (
    <span style={{ ...line, fontSize: small ? 11.5 : 12.5 }} title={title} aria-label={title}>
      <span style={item}>
        <DustIcon />
        {fmtDust(cost.dust)}
      </span>
      <span style={item}>
        <CandyIcon />
        {fmt(cost.candy)}
      </span>
      {cost.xl > 0 && (
        <span style={item}>
          <XlBadge />
          {fmt(cost.xl)}
        </span>
      )}
    </span>
  );
}

/** Costo de evolucionar hasta esta forma. */
export function EvolveCostLine({ candy, evolved }: { candy: number | null; evolved: boolean }) {
  if (!evolved) return <span className="rk-cost">—</span>;
  if (candy === null) return <span className="rk-cost">Sin datos</span>;
  return (
    <span style={line} title={`${fmt(candy)} caramelos para evolucionar`}>
      <span style={item}>
        <CandyIcon />
        {fmt(candy)}
      </span>
    </span>
  );
}

/** Energía para la primera Megaevolución. */
export function MegaEnergyLine({ energy }: { energy: number | null }) {
  return (
    <span style={line} title={energy === null ? "Sin datos de energía" : `${fmt(energy)} de energía Mega`}>
      <span style={item}>
        <MegaIcon />
        {energy === null ? "—" : fmt(energy)}
      </span>
    </span>
  );
}

/** Tercer ataque: polvo y caramelos. */
export function ThirdMoveLine({ cost, candyOnly }: { cost: ThirdMoveCost | null; candyOnly?: boolean }) {
  if (!cost || (cost.candy === null && cost.dust === null)) return <span className="rk-cost">Sin datos</span>;
  return (
    <span style={line} title={`${cost.dust === null ? "—" : fmtDust(cost.dust)} polvo · ${cost.candy === null ? "—" : fmt(cost.candy)} car`}>
      {!candyOnly && (
        <span style={item}>
          <DustIcon />
          {cost.dust === null ? "—" : fmtDust(cost.dust)}
        </span>
      )}
      <span style={item}>
        <CandyIcon />
        {cost.candy === null ? "—" : fmt(cost.candy)}
      </span>
    </span>
  );
}
