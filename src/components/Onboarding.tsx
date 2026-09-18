import type { ActionId, Combo } from "@/lib/shortcuts";
import { Kbd } from "./Kbd";
import { GearIcon } from "./Icons";

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
    <span style={{ display: "flex", alignItems: "center", gap: 12, height: 50, padding: "0 16px", background: "rgba(255,255,255,0.04)" }}>
      <span style={{ fontSize: 15.5, fontWeight: 500, flexGrow: 1, minWidth: 0 }}>{label}</span>
      {extra ? (
        <span className="kbd" style={{ height: 27, padding: "0 10px", background: "rgba(255,255,255,0.08)", fontSize: 12, color: "#DDE2E8" }}>{extra}</span>
      ) : (
        <Kbd combo={combo} style={{ height: 27, padding: "0 10px", background: "rgba(255,255,255,0.08)", fontSize: 12, color: "#DDE2E8" }} />
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
    <div style={{ position: "absolute", inset: 0, zIndex: 60 }} role="dialog" aria-modal="true" aria-labelledby="welcome-title">
      <div className="veil" />
      <div
        className="panel panel--cut-28"
        style={{
          position: "absolute", top: 132, left: "50%", transform: "translateX(-50%)", width: 860,
          display: "flex", flexDirection: "column", padding: "44px 48px 36px",
        }}
      >
        <span className="panel__edge" />
        <span className="label" style={{ fontSize: 11, letterSpacing: "0.2em", color: "#8B94A0" }}>PRIMERA VEZ ACÁ</span>
        <span id="welcome-title" className="display" style={{ fontSize: 52, fontWeight: 800, letterSpacing: "-0.035em", lineHeight: 1.04, marginTop: 16 }}>
          Todo el matchup,
          <br />
          de un vistazo
        </span>
        <span style={{ fontSize: 18, lineHeight: 1.55, color: "#A8B0BA", marginTop: 16, maxWidth: 640 }}>
          Cargá los seis Pokémon del combate y la pantalla te muestra, mientras jugás en el celular, qué ataque te pega fuerte, cuánto tarda
          cada cargado y a quién conviene mandar.
        </span>

        <span className="label" style={{ fontSize: 10.5, letterSpacing: "0.2em", margin: "34px 0 16px" }}>ATAJOS POR DEFECTO</span>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "10px 24px" }}>
          {row("Agregar aliado", shortcuts.addAlly)}
          {row("Agregar rival", shortcuts.addRival)}
          {row("Poner un aliado en campo", null, allyLabel)}
          {row("Poner un rival en campo", null, rivalLabel)}
          {row("Nuevo combate", shortcuts.newBattle)}
          {row("Cerrar o cancelar", shortcuts.close)}
        </div>

        <span style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 18 }}>
          <GearIcon size={16} color="#8B94A0" />
          <span style={{ fontSize: 14.5, color: "#9BA3AE" }}>
            Cualquiera de estos se cambia desde <span style={{ fontWeight: 600, color: "#7FE0EF" }}>Configuración</span>, con la tecla que te
            quede cómoda.
          </span>
        </span>

        <span style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 12, marginTop: 34 }}>
          <button type="button" className="btn btn--ghost" style={{ height: 48, padding: "0 22px", borderRadius: 0, fontSize: 15 }} onClick={onSkip}>
            Empezar sin recorrido
          </button>
          <button type="button" className="btn btn--primary btn--cut" style={{ height: 48, padding: "0 26px", fontSize: 15 }} onClick={onStartTour} autoFocus>
            Mostrame cómo funciona
          </button>
        </span>
      </div>
    </div>
  );
}
