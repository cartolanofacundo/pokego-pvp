import type { ActionId, Combo } from "@/lib/shortcuts";
import { Kbd } from "./Kbd";
import { GearIcon } from "./Icons";
import { u } from "@/lib/scale";

/** Bienvenida (Onboarding.dc.html). Se muestra una sola vez. */
export function Onboarding({
  shortcuts,
  onSkip,
  onStartTour,
}: {
  shortcuts: Record<ActionId, Combo | null>;
  onSkip: () => void;
  onStartTour: () => void;
}) {
  const row = (label: string, combo: Combo | null, extra?: string) => (
    <span style={{ display: "flex", alignItems: "center", gap: 12, height: u(50), padding: `0 ${u(16)}`, background: "rgba(255,255,255,0.04)" }}>
      <span style={{ fontSize: "max(12px, calc(15.5 * var(--u)))", fontWeight: 500, flexGrow: 1, minWidth: 0 }}>{label}</span>
      {extra ? (
        <span className="kbd" style={{ height: u(27), padding: `0 ${u(10)}`, background: "rgba(255,255,255,0.08)", fontSize: "max(9px, calc(12 * var(--u)))", color: "#DDE2E8" }}>{extra}</span>
      ) : (
        <Kbd combo={combo} style={{ height: u(27), padding: `0 ${u(10)}`, background: "rgba(255,255,255,0.08)", fontSize: "max(9px, calc(12 * var(--u)))", color: "#DDE2E8" }} />
      )}
    </span>
  );

  const digits = (ids: ActionId[]) =>
    ids
      .map((id) => shortcuts[id])
      .filter((c): c is Combo => c !== null)
      .map((c) => {
        const mods = [c.ctrl && "Ctrl", c.alt && "Alt", c.shift && "Shift"].filter(Boolean).join(" ");
        const key = c.code.startsWith("Digit") ? c.code.slice(5) : c.code.startsWith("Key") ? c.code.slice(3) : c.code;
        return { mods, key };
      });

  const rivalDigits = digits(["rival1", "rival2", "rival3"]);
  const allyDigits = digits(["ally1", "ally2", "ally3"]);
  const rivalLabel = rivalDigits.length ? `${rivalDigits[0].mods ? rivalDigits[0].mods + " " : ""}${rivalDigits.map((d) => d.key).join(" ")}` : "—";
  const allyLabel = allyDigits.length ? `${allyDigits[0].mods ? allyDigits[0].mods + " " : ""}${allyDigits.map((d) => d.key).join(" ")}` : "—";

  return (
    // Centrado con flex, no con translateX: la animación de entrada de .panel
    // termina en `transform: none` y pisaba el translate (quedaba corrido a
    // la derecha y cortado).
    <div
      style={{ position: "absolute", inset: 0, zIndex: 60, display: "flex", justifyContent: "center", alignItems: "center", padding: u(40) }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-title"
    >
      <div className="veil" />
      <div
        className="panel panel--cut-28"
        style={{
          width: u(860), maxWidth: "100%", maxHeight: "100%", overflowY: "auto",
          display: "flex", flexDirection: "column", padding: `${u(44)} ${u(48)} ${u(36)}`,
        }}
      >
        <span className="panel__edge" />
        <span className="label" style={{ fontSize: 11, letterSpacing: "0.2em", color: "#A8B0BB" }}>PRIMERA VEZ ACÁ</span>
        <span id="welcome-title" className="display" style={{ fontSize: "max(30px, calc(52 * var(--u)))", fontWeight: 800, letterSpacing: "-0.035em", lineHeight: 1.04, marginTop: u(16) }}>
          Todo el matchup,
          <br />
          de un vistazo
        </span>
        <span style={{ fontSize: "max(14px, calc(18 * var(--u)))", lineHeight: 1.55, color: "#BFC6CE", marginTop: u(16), maxWidth: u(640) }}>
          Cargá los seis Pokémon del combate y la pantalla te muestra, mientras jugás en el celular, qué ataque te pega fuerte, cuánto tarda
          cada cargado y a quién conviene mandar.
        </span>

        <span className="label" style={{ fontSize: 10.5, letterSpacing: "0.2em", margin: `${u(34)} 0 ${u(16)}` }}>ATAJOS POR DEFECTO</span>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: `${u(10)} ${u(24)}` }}>
          {row("Agregar aliado", shortcuts.addAlly)}
          {row("Agregar rival", shortcuts.addRival)}
          {row("Poner un aliado en campo", null, allyLabel)}
          {row("Poner un rival en campo", null, rivalLabel)}
          {row("Nuevo combate", shortcuts.newBattle)}
          {row("Cerrar o cancelar", shortcuts.close)}
        </div>

        <span style={{ display: "flex", alignItems: "center", gap: 10, marginTop: u(18) }}>
          <GearIcon size={16} color="#A8B0BB" />
          <span style={{ fontSize: "max(12px, calc(14.5 * var(--u)))", color: "#B4BCC6" }}>
            Cualquiera de estos se cambia desde <span style={{ fontWeight: 600, color: "#7FE0EF" }}>Configuración</span>, con la tecla que te
            quede cómoda.
          </span>
        </span>

        <span style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 12, marginTop: u(34) }}>
          <button type="button" className="btn btn--ghost" style={{ borderRadius: 0 }} onClick={onSkip}>
            Empezar sin recorrido
          </button>
          <button type="button" className="btn btn--primary btn--cut" onClick={onStartTour} autoFocus>
            Mostrame cómo funciona
          </button>
        </span>
      </div>
    </div>
  );
}
