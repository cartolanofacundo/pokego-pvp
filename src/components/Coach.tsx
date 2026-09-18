"use client";

import { useEffect, useState } from "react";
import type { ActionId, Combo } from "@/lib/shortcuts";
import { comboLabel } from "@/lib/shortcuts";

/**
 * Recorrido guiado (Coach-1 a Coach-6). Cada paso recorta un área real de
 * la pantalla con un box-shadow gigante y apoya la tarjeta con una flechita
 * del lado del foco. El área se mide en el DOM (atributo `data-coach` del
 * elemento enfocado) y se expande 14 px, así funciona en cualquier
 * resolución; los desplazamientos de la tarjeta respecto del foco son los de
 * las mesas de trabajo.
 */
interface StepDef {
  target: string;
  pad: number;
  arrow: "left" | "right" | "top";
  title: string;
  text: string;
  shortcut?: { action: ActionId; label: string };
}

export const COACH_STEPS: StepDef[] = [
  {
    target: "ally-rail",
    pad: 14,
    arrow: "right",
    title: "Tu equipo, una sola vez",
    text: "Cargá tus tres Pokémon. Quedan guardados entre combates, así la próxima vez arrancás directo.",
    shortcut: { action: "addAlly", label: "AGREGAR ALIADO" },
  },
  {
    target: "rival-rail",
    pad: 14,
    arrow: "left",
    title: "Los rivales, sobre la marcha",
    text: "Al equipo de enfrente lo vas cargando durante el combate, a medida que te los muestran.",
    shortcut: { action: "addRival", label: "AGREGAR RIVAL" },
  },
  {
    target: "vos-stats",
    pad: 14,
    arrow: "right",
    title: "Tus ataques",
    text: "Cada ataque muestra su energía y sus turnos de carga. Mientras no haya rival en campo ves el poder base; apenas cargues uno, ese número pasa a ser cuánto le pegás.",
  },
  {
    target: "rival-stats",
    pad: 14,
    arrow: "left",
    title: "Lo que te pega a vos",
    text: "Verde es a tu favor y rojo en tu contra, de los dos lados. El triángulo marca el ataque rival que te hace daño doble.",
  },
  {
    target: "ally-rail",
    pad: 14,
    arrow: "right",
    title: "A quién mandar",
    text: "El punto de color de cada Pokémon del banco te dice si le gana, empata o pierde contra el que está enfrente ahora mismo.",
  },
  {
    target: "header-controls",
    pad: 6,
    arrow: "top",
    title: "Liga y atajos",
    text: "Cambiá de liga cuando cambies de formato. Todos los atajos se editan desde la rueda dentada, con la tecla que te quede cómoda.",
    shortcut: { action: "openConfig", label: "ABRIR CONFIGURACIÓN" },
  },
];

const CARD_W = 380;

interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
}

export function Coach({
  step,
  shortcuts,
  onNext,
  onSkip,
}: {
  step: number; // 1..6
  shortcuts: Record<ActionId, Combo | null>;
  onNext: () => void;
  onSkip: () => void;
}) {
  const def = COACH_STEPS[step - 1];
  const last = step === COACH_STEPS.length;
  const [focus, setFocus] = useState<Box | null>(null);

  useEffect(() => {
    const measure = () => {
      const el = document.querySelector<HTMLElement>(`[data-coach="${def.target}"]`);
      const host = document.querySelector<HTMLElement>("main");
      if (!el || !host) return;
      const r = el.getBoundingClientRect();
      const h = host.getBoundingClientRect();
      setFocus({
        left: Math.round(r.left - h.left - def.pad),
        top: Math.round(r.top - h.top - def.pad),
        width: Math.round(r.width + def.pad * 2),
        height: Math.round(r.height + def.pad * 2),
      });
    };
    // Se mide después del commit (rAF) para que el estado de muestra ya esté en el DOM.
    const id = requestAnimationFrame(measure);
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener("resize", measure);
    };
  }, [def]);

  if (!focus) return null;

  const card: React.CSSProperties =
    def.arrow === "right"
      ? { left: focus.left - 30 - CARD_W, top: focus.top + 75 }
      : def.arrow === "left"
        ? { left: focus.left + focus.width + 36, top: focus.top + 66 }
        : { left: focus.left - 12, top: focus.top + focus.height + 28 };
  const arrowStyle: React.CSSProperties =
    def.arrow === "right" ? { right: -8, top: 52 } : def.arrow === "left" ? { left: -8, top: 52 } : { left: 46, top: -8 };

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 60 }} role="dialog" aria-modal="true" aria-labelledby="coach-title">
      <div
        style={{
          position: "absolute", ...focus,
          boxShadow: "0 0 0 9999px rgba(6,7,9,0.84), inset 0 0 0 2px rgba(255,255,255,0.38)",
          pointerEvents: "none",
        }}
      />
      <div className="panel panel--cut-18" style={{ position: "absolute", ...card, width: CARD_W, display: "flex", flexDirection: "column", padding: 22 }}>
        <span style={{ position: "absolute", width: 16, height: 16, background: "#12151A", transform: "rotate(45deg)", ...arrowStyle }} />
        <span className="label" style={{ fontSize: 10.5, color: "#A8B0BB" }}>PASO {step} DE {COACH_STEPS.length}</span>
        <span id="coach-title" style={{ fontSize: 21, fontWeight: 600, letterSpacing: "-0.02em", marginTop: 10 }}>{def.title}</span>
        <span style={{ fontSize: 14.5, lineHeight: 1.55, color: "#B4BCC6", marginTop: 8 }}>{def.text}</span>
        {def.shortcut && (
          <span style={{ display: "flex", alignItems: "center", gap: 9, marginTop: 16 }}>
            <span className="kbd" style={{ height: 26, padding: "0 10px", background: "rgba(255,255,255,0.08)", fontSize: 12 }}>
              {comboLabel(shortcuts[def.shortcut.action]) || "—"}
            </span>
            <span className="mono" style={{ fontSize: 10.5, letterSpacing: "0.08em", color: "#9CA6B2" }}>{def.shortcut.label}</span>
          </span>
        )}
        <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 22 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }} aria-hidden="true">
            {COACH_STEPS.map((_, i) => (
              <span
                key={i}
                style={{
                  width: i + 1 === step ? 20 : 5, height: 5, borderRadius: 999,
                  background: i + 1 === step ? "#DCE1E7" : "rgba(255,255,255,0.22)",
                }}
              />
            ))}
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button type="button" className="btn" style={{ height: 40, padding: "0 14px", background: "transparent", color: "#B4BCC6", fontSize: 13.5, fontWeight: 500 }} onClick={onSkip}>
              Saltar
            </button>
            <button
              type="button"
              className="btn btn--primary"
              style={{ height: 40, padding: "0 18px", fontSize: 13.5, borderRadius: 0, clipPath: "polygon(0 0, 100% 0, 100% 100%, 8px 100%, 0 calc(100% - 8px))" }}
              onClick={onNext}
              autoFocus
            >
              {last ? "Empezar" : "Siguiente"}
            </button>
          </span>
        </span>
      </div>
    </div>
  );
}
