"use client";

import { useEffect, useState } from "react";
import {
  actionLabel,
  comboFromEvent,
  comboLabel,
  comboParts,
  combosEqual,
  DEFAULT_SHORTCUTS,
  findConflict,
  isBrowserReserved,
  type ActionId,
  type Combo,
} from "@/lib/shortcuts";
import { WarningIcon, ResetIcon } from "./Icons";

type Phase =
  | { kind: "waiting" }
  | { kind: "captured"; combo: Combo }
  | { kind: "conflict"; combo: Combo; with: ActionId }
  | { kind: "reserved"; combo: Combo };

/**
 * Edición de un atajo (Atajo-Esperando / Atajo-Conflicto, traducidos a la
 * pista). Esperando: anillo cian, Guardar deshabilitado. Conflicto: anillo
 * rojo, la combinación en fichas grandes, advertencia con consecuencia y el
 * botón principal en rojo "Reasignar igual". Esc cancela siempre.
 */
export function ShortcutModal({
  action,
  shortcuts,
  onSave,
  onCancel,
}: {
  action: ActionId;
  shortcuts: Record<ActionId, Combo | null>;
  onSave: (combo: Combo, stealFrom: ActionId | null) => void;
  onCancel: () => void;
}) {
  const [phase, setPhase] = useState<Phase>({ kind: "waiting" });
  const defaultCombo = DEFAULT_SHORTCUTS[action];

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.code === "Escape") {
        e.preventDefault();
        onCancel();
        return;
      }
      if (e.code === "Enter" && (phase.kind === "captured" || phase.kind === "conflict")) {
        e.preventDefault();
        onSave(phase.combo, phase.kind === "conflict" ? phase.with : null);
        return;
      }
      const combo = comboFromEvent(e);
      if (!combo) return;
      e.preventDefault();
      e.stopPropagation();
      if (combo.code === "Enter" || combo.code === "Tab") return;
      if (isBrowserReserved(combo)) {
        setPhase({ kind: "reserved", combo });
        return;
      }
      if (combosEqual(combo, shortcuts[action])) {
        setPhase({ kind: "captured", combo });
        return;
      }
      const conflict = findConflict(shortcuts, combo, action);
      setPhase(conflict ? { kind: "conflict", combo, with: conflict } : { kind: "captured", combo });
    }
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [action, shortcuts, phase, onCancel, onSave]);

  const isRed = phase.kind === "conflict" || phase.kind === "reserved";
  const ring = isRed ? "0 0 0 2px rgba(255,107,107,0.42)" : "0 0 0 2px rgba(111,227,242,0.40)";
  const boxBg = isRed ? "rgba(255,107,107,0.07)" : "rgba(255,255,255,0.04)";
  const canSave = phase.kind === "captured" || phase.kind === "conflict";

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 50 }} role="dialog" aria-modal="true" aria-labelledby="shortcut-title">
      <div style={{ position: "absolute", inset: 0, background: "rgba(7,9,12,0.76)" }} />
      <div
        className="panel"
        style={{
          position: "absolute", top: 300, left: "50%", transform: "translateX(-50%)", width: 560,
          display: "flex", flexDirection: "column", padding: "24px 24px 18px",
          clipPath: "polygon(24px 0, 100% 0, 100% calc(100% - 24px), calc(100% - 24px) 100%, 0 100%)",
        }}
      >
        <span className="panel__edge" style={{ left: 24 }} />

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span className="label" style={{ fontSize: 11, letterSpacing: "0.16em", color: "#A8B0BB" }}>EDITAR ATAJO</span>
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className="mono" style={{ fontSize: 10.5, letterSpacing: "0.08em", color: "#949DA9" }}>CANCELAR</span>
            <span className="kbd kbd--sm">Esc</span>
          </span>
        </div>

        <span id="shortcut-title" style={{ fontSize: 27, fontWeight: 600, letterSpacing: "-0.02em", marginTop: 14 }}>
          {actionLabel(action)}
        </span>

        <div
          style={{
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12,
            height: 124, marginTop: 18, background: boxBg, boxShadow: ring,
            clipPath: "polygon(14px 0, 100% 0, 100% 100%, 0 100%, 0 14px)",
          }}
          aria-live="polite"
        >
          {phase.kind === "waiting" ? (
            <>
              <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#6FE3F2" }} />
                <span style={{ fontSize: 18, fontWeight: 500, color: "#DCE1E7", letterSpacing: "-0.01em" }}>Presioná la combinación</span>
              </span>
              <span className="mono" style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: "0.14em", color: "#9CA6B2" }}>
                CTRL · ALT · SHIFT + UNA TECLA
              </span>
            </>
          ) : (
            <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {comboParts(phase.combo).map((part, i) => (
                <span key={i} style={{ display: "contents" }}>
                  {i > 0 && <span className="mono" style={{ fontSize: 17, color: "#9CA6B2" }}>+</span>}
                  <span
                    className="mono"
                    style={{
                      display: "inline-flex", alignItems: "center", height: 52, padding: "0 20px",
                      background: "rgba(255,255,255,0.09)", fontSize: 20, fontWeight: 600, color: "#F2F3F5",
                      clipPath: "polygon(8px 0, 100% 0, 100% 100%, 0 100%, 0 8px)",
                    }}
                  >
                    {part}
                  </span>
                </span>
              ))}
            </span>
          )}
        </div>

        {phase.kind === "conflict" && (
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "14px 16px", marginTop: 14, background: "rgba(255,107,107,0.16)" }}>
            <WarningIcon size={18} label="Conflicto" />
            <span style={{ fontSize: 14, lineHeight: 1.5, color: "#FFC2C2" }}>
              {comboLabel(phase.combo)} ya lo usa <span style={{ fontWeight: 600 }}>{actionLabel(phase.with)}</span>. Si lo reasignás, esa acción se
              queda sin atajo hasta que le pongas uno nuevo.
            </span>
          </div>
        )}

        {phase.kind === "reserved" && (
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "14px 16px", marginTop: 14, background: "rgba(255,107,107,0.16)" }}>
            <WarningIcon size={18} label="No se puede capturar" />
            <span style={{ fontSize: 14, lineHeight: 1.5, color: "#FFC2C2" }}>
              {comboLabel(phase.combo)} se la queda el navegador: no se puede capturar desde la aplicación. Probá otra.
            </span>
          </div>
        )}

        {phase.kind !== "conflict" && phase.kind !== "reserved" && (
          <span style={{ fontSize: 13.5, lineHeight: 1.5, color: "#A8B0BB", marginTop: 14 }}>
            Las combinaciones que usa el navegador, como Ctrl&nbsp;W o Ctrl&nbsp;T, no se pueden capturar.
          </span>
        )}

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 22 }}>
          {phase.kind === "waiting" || phase.kind === "captured" ? (
            <button
              type="button"
              className="btn"
              style={{ background: "transparent", color: "#B4BCC6", fontSize: 13.5, fontWeight: 500, padding: "0 14px", gap: 8 }}
              onClick={() => defaultCombo && setPhase({ kind: "captured", combo: defaultCombo })}
            >
              <ResetIcon size={14} color="#B4BCC6" />
              <span>Restablecer a {comboLabel(defaultCombo)}</span>
            </button>
          ) : (
            <button
              type="button"
              className="btn"
              style={{ background: "transparent", color: "#B4BCC6", fontSize: 13.5, fontWeight: 500, padding: "0 14px", gap: 8 }}
              onClick={() => setPhase({ kind: "waiting" })}
            >
              <ResetIcon size={14} color="#B4BCC6" />
              <span>Probar otra tecla</span>
            </button>
          )}

          <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button type="button" className="btn btn--ghost" style={{ padding: "0 20px" }} onClick={onCancel}>
              Cancelar
            </button>
            {phase.kind === "conflict" ? (
              <button
                type="button"
                className="btn"
                style={{ padding: "0 22px", background: "rgba(255,107,107,0.18)", boxShadow: "inset 0 0 0 1px rgba(255,107,107,0.38)", color: "#FFC2C2" }}
                onClick={() => onSave(phase.combo, phase.with)}
              >
                Reasignar igual
              </button>
            ) : (
              <button
                type="button"
                className="btn"
                disabled={!canSave}
                style={{
                  padding: "0 22px",
                  background: canSave ? "#F2F3F5" : "rgba(255,255,255,0.06)",
                  color: canSave ? "#0B0D11" : "#8E97A3",
                  cursor: canSave ? "pointer" : "default",
                }}
                onClick={() => phase.kind === "captured" && onSave(phase.combo, null)}
              >
                Guardar
              </button>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}
