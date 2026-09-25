"use client";

import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import type { Species, Variant } from "@/lib/ranker/data";
import { formatRaw, normalizeRaw, resolveEntry, type Reading } from "@/lib/ranker/parse";
import { formatLevel } from "@/lib/ranker/cp";
import { purifiedIvs } from "@/lib/ranker/costs";
import { rankOf } from "@/lib/ranker/ivrank";
import type { RankerSettings } from "@/lib/ranker/box";
import { fmt } from "@/lib/ranker/format";

export interface IvInputHandle {
  focus: () => void;
}

const SEPARATORS = new Set([",", "-", "–", "/", " ", ".", ";"]);

export interface IvSubmit {
  reading: Reading;
  variant: Variant;
  lucky: boolean;
}

/** Carga inicial para editar un cargado existente. */
export interface IvInitial {
  atk: number;
  def: number;
  sta: number;
  cp: number;
  variant: Variant;
  lucky: boolean;
}

const VARIANT_LABEL: Record<Variant, string> = { normal: "Normal", shadow: "Oscuro", purified: "Purificado" };

/**
 * Campo de carga rápida más variante y Suertudo. Se tipean solo dígitos
 * ("101313549") y el campo muestra "10,13,13–549". Enter agrega o guarda;
 * Esc borra (o cancela, en modo edición). Sirve tanto para cargar un
 * Pokémon nuevo como para editar uno ya cargado: `initial` precarga los
 * valores y cambia el texto de los botones.
 */
export const IvInput = forwardRef<
  IvInputHandle,
  {
    species: Species;
    settings: RankerSettings;
    initial?: IvInitial;
    onSubmit: (s: IvSubmit) => void;
    onCancel?: () => void;
    onNextSpecies?: (dir: 1 | -1) => void;
  }
>(function IvInput({ species, settings, initial, onSubmit, onCancel, onNextSpecies }, ref) {
  // Todo con comas (nunca la raya del formato mostrado): greedy() y
  // allReadings() solo entienden dígitos y comas como separador explícito.
  const initialRaw = initial ? `${initial.atk},${initial.def},${initial.sta},${initial.cp}` : "";
  const [raw, setRaw] = useState(initialRaw);
  const [variant, setVariant] = useState<Variant>(initial?.variant ?? "normal");
  const [lucky, setLucky] = useState(initial?.lucky ?? false);
  const [submitted, setSubmitted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  useImperativeHandle(ref, () => ({ focus: () => inputRef.current?.focus() }));

  // Al abrir la edición de otro cargado, se vuelve a precargar.
  useEffect(() => {
    setRaw(initialRaw);
    setVariant(initial?.variant ?? "normal");
    setLucky(initial?.lucky ?? false);
    setSubmitted(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial?.atk, initial?.def, initial?.sta, initial?.cp, species.id]);

  const result = useMemo(() => resolveEntry(raw, species, settings), [raw, species, settings]);

  // Vista previa de purificación: solo tiene sentido viniendo de un Oscuro.
  const cameFromShadow = initial?.variant === "shadow";
  const preview = useMemo(() => {
    if (variant !== "purified" || !cameFromShadow || result.kind !== "ok") return null;
    const iv = purifiedIvs(result.reading);
    const row = rankOf(species, iv, 1500, settings);
    return { iv, row };
  }, [variant, cameFromShadow, result, species, settings]);

  const submit = (s: IvSubmit) => {
    onSubmit(s);
    if (!initial) {
      setRaw("");
      setVariant("normal");
      setLucky(false);
    }
    setSubmitted(false);
    inputRef.current?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.ctrlKey && (e.key === "ArrowDown" || e.key === "ArrowUp") && onNextSpecies) {
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
      if (initial && onCancel) onCancel();
      else {
        setRaw("");
        setSubmitted(false);
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (result.kind === "ok") submit({ reading: result.reading, variant, lucky });
      else setSubmitted(true);
    } else if (e.key.length === 1) {
      e.preventDefault();
    }
  };

  const displayRaw = result.kind === "ok" ? `${result.reading.atk},${result.reading.def},${result.reading.sta}–${result.reading.cp}` : formatRaw(raw);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <label className="rk-field rk-field--iv">
        <span className="sr-only">IV de ataque, defensa y PS, y CP</span>
        <input
          ref={inputRef}
          value={displayRaw}
          placeholder="10,13,13–549"
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
          <span className="kbd kbd--sm">↵ {initial ? "guarda" : "agrega"}</span>
          <span className="kbd kbd--sm">Esc {initial ? "cancela" : "borra"}</span>
        </span>
      </label>

      <div style={{ minHeight: 22 }} aria-live="polite">
        {result.kind === "ok" && (
          <span className="rk-note">
            <b style={{ color: "#86EFBC" }}>
              {result.reading.atk}/{result.reading.def}/{result.reading.sta}
            </b>{" "}
            · CP {fmt(result.reading.cp)} · nivel {formatLevel(result.reading.level)}
          </span>
        )}
        {result.kind === "empty" && (
          <span className="rk-note">Escribí todo junto, sin espaciar: ataque, defensa, PS y después el PC. Los separadores los ponemos nosotros.</span>
        )}
        {result.kind === "reading" && <span className="rk-note">{result.message}</span>}
        {result.kind === "invalid" && (raw.length > 0 && submitted) && <span className="rk-error">{result.message}</span>}
        {result.kind === "ambiguous" && (
          <span style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span className="rk-note">Hay dos formas de leerlo. Elegí una:</span>
            <span style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {result.readings.map((r, i) => (
                <button
                  key={`${r.atk}-${r.def}-${r.sta}`}
                  type="button"
                  className="btn"
                  style={{ height: 40, padding: "0 12px", fontSize: 13.5, gap: 10 }}
                  onClick={() => submit({ reading: r, variant, lucky })}
                >
                  <span className="kbd kbd--sm">{i + 1}</span>
                  <span className="rk-num">
                    {r.atk}/{r.def}/{r.sta}
                  </span>
                  <span style={{ color: "#B4BCC6" }}>nivel {formatLevel(r.level)}</span>
                </button>
              ))}
            </span>
          </span>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, paddingTop: 4 }}>
        <span className="rk-seg rk-seg--sans" role="radiogroup" aria-label="Variante">
          {(["normal", "shadow", "purified"] as Variant[]).map((v) => (
            <button
              key={v}
              type="button"
              role="radio"
              aria-checked={variant === v}
              onClick={() => {
                setVariant(v);
                if (v === "shadow") setLucky(false);
              }}
            >
              {VARIANT_LABEL[v]}
            </button>
          ))}
        </span>
        <span style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
          <span className="rk-seg rk-seg--sans" role="group" aria-label="Suertudo">
            <button type="button" aria-pressed={lucky} disabled={variant === "shadow"} onClick={() => setLucky((l) => !l)} style={variant === "shadow" ? { opacity: 0.5, cursor: "default" } : undefined}>
              Suertudo
            </button>
          </span>
          {variant === "shadow" && <span className="rk-cost" style={{ fontSize: 11.5 }}>un oscuro no puede ser suertudo</span>}
        </span>
      </div>

      {preview && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "14px 16px", borderRadius: 10, background: "rgba(255,255,255,0.06)" }}>
          <span style={{ fontSize: 14, color: "#DCE1E7" }}>
            Si lo purificás queda en{" "}
            <b className="rk-num" style={{ fontWeight: 600 }}>
              {preview.iv.atk} / {preview.iv.def} / {preview.iv.sta}
            </b>
            {preview.row && (
              <>
                {" y pasa a "}
                <span className={`rk-rank ${preview.row.rank <= 100 ? "rk-rank--good" : ""}`} style={{ fontSize: 18 }}>
                  #{fmt(preview.row.rank)}
                </span>
              </>
            )}
          </span>
        </div>
      )}

      {initial && (
        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="button"
            className="btn btn--primary"
            style={{ height: 42 }}
            disabled={result.kind !== "ok"}
            onClick={() => result.kind === "ok" && submit({ reading: result.reading, variant, lucky })}
          >
            Guardar
          </button>
          <button type="button" className="btn btn--ghost" style={{ height: 42 }} onClick={onCancel}>
            Cancelar
          </button>
        </div>
      )}
    </div>
  );
});
