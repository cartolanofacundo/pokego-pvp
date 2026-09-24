// Carga rápida de IV y CP: se tipean solo dígitos ("101313549") y el campo
// muestra "10,13,13-549". Cada IV es de 0 a 15, así que un "1" puede ser un
// IV solo o el comienzo de 10-15: mientras se escribe se toma la lectura más
// larga, y al confirmar se prueban todas las lecturas posibles y se quedan las
// que dan exactamente ese CP en algún nivel. Una coma tipeada a mano fuerza
// el corte ("1,13,13139" es 1/13/13 con CP 139).

import { levelsForCp, type BaseStats, type Ivs } from "./cp";

/** Normaliza lo tipeado: solo dígitos y comas (cualquier separador cuenta como coma). */
export function normalizeRaw(text: string): string {
  return text.replace(/[\s./\-;]/g, ",").replace(/[^0-9,]/g, "").replace(/,+/g, ",").replace(/^,/, "");
}

interface Greedy {
  ivs: string[];
  /** Un "1" que todavía puede ser 10-15. */
  pending: string;
  cp: string;
}

function greedy(raw: string): Greedy {
  const ivs: string[] = [];
  let cur = "";
  let i = 0;
  while (i < raw.length && ivs.length < 3) {
    const c = raw[i];
    if (c === ",") {
      if (cur) {
        ivs.push(cur);
        cur = "";
      }
      i++;
      continue;
    }
    if (cur === "") {
      if (c === "1") cur = "1";
      else ivs.push(c);
      i++;
      continue;
    }
    // cur === "1"
    if (c >= "0" && c <= "5") {
      ivs.push("1" + c);
      cur = "";
      i++;
    } else {
      ivs.push("1");
      cur = "";
    }
  }
  if (cur && ivs.length < 3) return { ivs, pending: cur, cp: "" };
  if (cur) ivs.push(cur);
  return { ivs, pending: "", cp: raw.slice(i).replace(/,/g, "") };
}

/** Texto que muestra el campo: "10,13,13-549", con las comas y el guion puestos solos. */
export function formatRaw(raw: string): string {
  const g = greedy(raw);
  let out = g.ivs.join(",");
  if (g.pending) return out + (out ? "," : "") + g.pending;
  if (g.ivs.length === 0) return "";
  if (g.ivs.length < 3) return out + ",";
  out += "-" + g.cp;
  return out;
}

export interface Candidate extends Ivs {
  cp: number;
}

/** Todas las lecturas posibles de lo tipeado como tres IV y un CP. */
export function allReadings(raw: string): Candidate[] {
  const out: Candidate[] = [];
  const walk = (pos: number, ivs: number[]) => {
    while (raw[pos] === ",") pos++;
    if (ivs.length === 3) {
      const cpText = raw.slice(pos).replace(/,/g, "");
      if (/^\d{2,5}$/.test(cpText) && Number(cpText) >= 10) {
        out.push({ atk: ivs[0], def: ivs[1], sta: ivs[2], cp: Number(cpText) });
      }
      return;
    }
    const c = raw[pos];
    if (c === undefined) return;
    walk(pos + 1, [...ivs, Number(c)]);
    const n = raw[pos + 1];
    if (c === "1" && n !== undefined && n >= "0" && n <= "5") walk(pos + 2, [...ivs, Number(c + n)]);
  };
  walk(0, []);
  return out;
}

export interface Reading extends Candidate {
  level: number;
}

export type ParseResult =
  | { kind: "incomplete" }
  | { kind: "ok"; reading: Reading }
  | { kind: "ambiguous"; readings: Reading[] }
  | { kind: "error"; message: string };

/** Resuelve lo tipeado contra las estadísticas base de la especie elegida. */
export function resolveEntry(raw: string, base: BaseStats): ParseResult {
  const g = greedy(raw);
  if (g.ivs.length < 3 || g.pending || g.cp.length < 2) return { kind: "incomplete" };

  const valid: Reading[] = [];
  for (const c of allReadings(raw)) {
    const levels = levelsForCp(base, c, c.cp);
    if (levels.length) valid.push({ ...c, level: levels[0] });
  }
  if (valid.length === 1) return { kind: "ok", reading: valid[0] };
  if (valid.length > 1) return { kind: "ambiguous", readings: valid };
  return {
    kind: "error",
    message: `Con ${g.ivs.join("/")} ningún nivel da ${g.cp} de CP. Revisá los IV, el CP o la especie.`,
  };
}
