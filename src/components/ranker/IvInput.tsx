"use client";

import { forwardRef, useImperativeHandle, useMemo, useRef, useState } from "react";
import type { Species } from "@/lib/ranker/data";
import { formatRaw, normalizeRaw, resolveEntry, type Reading } from "@/lib/ranker/parse";
import { formatLevel } from "@/lib/ranker/cp";

export interface IvInputHandle {
  focus: () => void;
}

const SEPARATORS = new Set([",", "-", "/", " ", ".", ";"]);

/**
 * Campo de carga rápida. Se tipean solo dígitos ("101313549") y el campo
 * muestra "10,13,13-549". Una coma, un guion o una barra fuerzan el corte de
 * un IV. Enter agrega y deja el campo listo para el siguiente del mismo
 * Pokémon; Esc borra.
 */
export const IvInput = forwardRef<
  IvInputHandle,
  { species: Species; onAdd: (r: Reading) => void; onNextSpecies: (dir: 1 | -1) => void }
>(function IvInput({ species, onAdd, onNextSpecies }, ref) {
  const [raw, setRaw] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  useImperativeHandle(ref, () => ({ focus: () => inputRef.current?.focus() }));

  const result = useMemo(() => resolveEntry(raw, species), [raw, species]);

  const add = (r: Reading) => {
    onAdd(r);
    setRaw("");
    setSubmitted(false);
    inputRef.current?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.ctrlKey && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      e.preventDefault();
      onNextSpecies(e.key === "ArrowDown" ? 1 : -1);
      return;
    }
    if (e.ctrlKey || e.altKey || e.metaKey) return;
    if (/^\d$/.test(e.key)) {
      e.preventDefault();
      setRaw((r) => r + e.key);
      setSubmitted(false);
    } else if (SEPARATORS.has(e.key)) {
      e.preventDefault();
      setRaw((r) => (r && !r.endsWith(",") ? r + "," : r));
    } else if (e.key === "Backspace") {
      e.preventDefault();
      setRaw((r) => r.slice(0, -1));
      setSubmitted(false);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setRaw("");
      setSubmitted(false);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (result.kind === "ok") add(result.reading);
      else setSubmitted(true);
    } else if (e.key.length === 1) {
      e.preventDefault();
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <label className="rk-field rk-field--iv">
        <span className="sr-only">IV de ataque, defensa y PS, y CP</span>
        <input
          ref={inputRef}
          // Si el CP deja una sola lectura válida, el campo muestra esa (con
          // "11313141" se ve "1,13,13-141", no la lectura más larga).
          value={
            result.kind === "ok"
              ? `${result.reading.atk},${result.reading.def},${result.reading.sta}-${result.reading.cp}`
              : formatRaw(raw)
          }
          placeholder="10,13,13-549"
          inputMode="numeric"
          autoComplete="off"
          spellCheck={false}
          onChange={() => {}}
          onKeyDown={onKeyDown}
          onPaste={(e) => {
            e.preventDefault();
            setRaw(normalizeRaw(e.clipboardData.getData("text")));
            setSubmitted(false);
          }}
        />
        <span style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
          <span className="kbd kbd--sm">↵ agrega</span>
          <span className="kbd kbd--sm">Esc borra</span>
        </span>
      </label>

      <div style={{ minHeight: 44 }} aria-live="polite">
        {result.kind === "ok" && (
          <span className="rk-note">
            <b style={{ color: "#86EFBC" }}>
              {result.reading.atk}/{result.reading.def}/{result.reading.sta}
            </b>{" "}
            · CP {result.reading.cp} · nivel {formatLevel(result.reading.level)} · Enter para agregar
          </span>
        )}
        {result.kind === "incomplete" && (
          <span className="rk-note">
            Tipeá ataque, defensa, PS y CP de corrido: <span className="rk-num">101313549</span> queda{" "}
            <span className="rk-num">10,13,13-549</span>. Ctrl ↓ pasa a la siguiente especie de la pokédex.
          </span>
        )}
        {result.kind === "error" && (raw.length > 0 && (submitted || formatRaw(raw).includes("-"))) && (
          <span className="rk-error">{result.message}</span>
        )}
        {result.kind === "ambiguous" && (
          <span style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
            <span className="rk-note">Se puede leer de {result.readings.length} maneras. Elegí una o separá con una coma:</span>
            {result.readings.map((r) => (
              <button key={`${r.atk}-${r.def}-${r.sta}`} type="button" className="btn" style={{ height: 34, padding: "0 12px", fontSize: 13.5 }} onClick={() => add(r)}>
                <span className="rk-num">
                  {r.atk}/{r.def}/{r.sta}
                </span>
                <span style={{ color: "#B4BCC6" }}>nivel {formatLevel(r.level)}</span>
              </button>
            ))}
          </span>
        )}
      </div>
    </div>
  );
});
