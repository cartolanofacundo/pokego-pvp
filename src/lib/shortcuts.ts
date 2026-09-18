// Atajos de teclado: acciones, combinaciones por defecto, persistencia,
// formato para mostrar, detección de conflictos y de combinaciones que el
// navegador se reserva.
//
// Defaults acordados con el dueño del proyecto: "Nuevo combate" y "Cambiar
// de liga" van con N y L solas (sin Ctrl), porque Chrome no deja interceptar
// Ctrl N ni Ctrl L aunque la página esté en pantalla completa. Las teclas
// sueltas solo actúan cuando no hay un modal ni un campo de texto con foco.

import { loadJSON, saveJSON } from "./storage";

export type ActionId =
  | "rival1"
  | "rival2"
  | "rival3"
  | "ally1"
  | "ally2"
  | "ally3"
  | "addRival"
  | "addAlly"
  | "removeSelected"
  | "newBattle"
  | "cycleLeague"
  | "openConfig"
  | "close";

export interface Combo {
  /** `KeyboardEvent.code`: "KeyA", "Digit1", "Comma", "Delete", "Escape"... */
  code: string;
  ctrl: boolean;
  alt: boolean;
  shift: boolean;
}

export interface ActionDef {
  id: ActionId;
  label: string;
  group: "EN COMBATE" | "EQUIPOS" | "GENERAL";
  fixed?: boolean;
}

export const ACTIONS: ActionDef[] = [
  { id: "rival1", label: "Enemigo en campo 1", group: "EN COMBATE" },
  { id: "rival2", label: "Enemigo en campo 2", group: "EN COMBATE" },
  { id: "rival3", label: "Enemigo en campo 3", group: "EN COMBATE" },
  { id: "ally1", label: "Aliado en campo 1", group: "EN COMBATE" },
  { id: "ally2", label: "Aliado en campo 2", group: "EN COMBATE" },
  { id: "ally3", label: "Aliado en campo 3", group: "EN COMBATE" },
  { id: "addRival", label: "Agregar enemigo", group: "EQUIPOS" },
  { id: "addAlly", label: "Agregar aliado", group: "EQUIPOS" },
  { id: "removeSelected", label: "Quitar el seleccionado", group: "EQUIPOS" },
  { id: "newBattle", label: "Nuevo combate", group: "EQUIPOS" },
  { id: "cycleLeague", label: "Cambiar de liga", group: "GENERAL" },
  { id: "openConfig", label: "Abrir configuración", group: "GENERAL" },
  { id: "close", label: "Cerrar o cancelar", group: "GENERAL", fixed: true },
];

const c = (code: string, mods: Partial<Omit<Combo, "code">> = {}): Combo => ({
  code,
  ctrl: false,
  alt: false,
  shift: false,
  ...mods,
});

export const DEFAULT_SHORTCUTS: Record<ActionId, Combo | null> = {
  rival1: c("Digit1"),
  rival2: c("Digit2"),
  rival3: c("Digit3"),
  ally1: c("Digit1", { shift: true }),
  ally2: c("Digit2", { shift: true }),
  ally3: c("Digit3", { shift: true }),
  addRival: c("KeyA", { ctrl: true }),
  addAlly: c("KeyS", { ctrl: true }),
  removeSelected: c("Delete", { ctrl: true }),
  newBattle: c("KeyN"),
  cycleLeague: c("KeyL"),
  openConfig: c("Comma", { ctrl: true }),
  close: c("Escape"),
};

const STORAGE_KEY = "pokego-pvp:shortcuts:v1";

export function loadShortcuts(): Record<ActionId, Combo | null> {
  const saved = loadJSON<Partial<Record<ActionId, Combo | null>>>(STORAGE_KEY, {});
  return { ...DEFAULT_SHORTCUTS, ...saved, close: DEFAULT_SHORTCUTS.close };
}

export function saveShortcuts(map: Record<ActionId, Combo | null>): void {
  saveJSON(STORAGE_KEY, map);
}

export function combosEqual(a: Combo | null, b: Combo | null): boolean {
  if (!a || !b) return false;
  return a.code === b.code && a.ctrl === b.ctrl && a.alt === b.alt && a.shift === b.shift;
}

/** Combinaciones que Chrome/Edge no dejan interceptar desde una página. */
const BROWSER_RESERVED: Combo[] = [
  c("KeyN", { ctrl: true }),
  c("KeyN", { ctrl: true, shift: true }),
  c("KeyT", { ctrl: true }),
  c("KeyT", { ctrl: true, shift: true }),
  c("KeyW", { ctrl: true }),
  c("KeyW", { ctrl: true, shift: true }),
  c("KeyL", { ctrl: true }),
  c("Tab", { ctrl: true }),
  c("Tab", { ctrl: true, shift: true }),
  c("F4", { alt: true }),
  c("F4", { ctrl: true }),
];

export function isBrowserReserved(combo: Combo): boolean {
  return BROWSER_RESERVED.some((r) => combosEqual(r, combo));
}

const MODIFIER_CODES = new Set([
  "ControlLeft",
  "ControlRight",
  "ShiftLeft",
  "ShiftRight",
  "AltLeft",
  "AltRight",
  "MetaLeft",
  "MetaRight",
]);

/** Combo de un evento de teclado, o null si solo se apretó un modificador. */
export function comboFromEvent(e: KeyboardEvent): Combo | null {
  if (MODIFIER_CODES.has(e.code)) return null;
  return { code: e.code, ctrl: e.ctrlKey, alt: e.altKey, shift: e.shiftKey };
}

const KEY_NAMES: Record<string, string> = {
  Escape: "Esc",
  Delete: "Supr",
  Comma: ",",
  Period: ".",
  Space: "Espacio",
  Enter: "Enter",
  Backspace: "Retroceso",
  Tab: "Tab",
  ArrowUp: "↑",
  ArrowDown: "↓",
  ArrowLeft: "←",
  ArrowRight: "→",
  Minus: "-",
  Equal: "=",
  Slash: "/",
  Backslash: "\\",
  Semicolon: ";",
  Quote: "'",
  BracketLeft: "[",
  BracketRight: "]",
  Backquote: "`",
};

function keyName(code: string): string {
  if (KEY_NAMES[code]) return KEY_NAMES[code];
  if (code.startsWith("Key")) return code.slice(3);
  if (code.startsWith("Digit")) return code.slice(5);
  if (code.startsWith("Numpad")) return "Num " + code.slice(6);
  return code;
}

/** Partes de la combinación para mostrar en fichas: ["Ctrl", "A"], ["Shift", "1"], ["N"]. */
export function comboParts(combo: Combo | null): string[] {
  if (!combo) return [];
  const parts: string[] = [];
  if (combo.ctrl) parts.push("Ctrl");
  if (combo.alt) parts.push("Alt");
  if (combo.shift) parts.push("Shift");
  parts.push(keyName(combo.code));
  return parts;
}

/** "Ctrl A", "Shift 1", "N", "Ctrl ,", "Esc". */
export function comboLabel(combo: Combo | null): string {
  return comboParts(combo).join(" ");
}

/** Acción a la que ya está asignada `combo`, si hay conflicto. */
export function findConflict(
  map: Record<ActionId, Combo | null>,
  combo: Combo,
  except: ActionId
): ActionId | null {
  for (const action of ACTIONS) {
    if (action.id === except) continue;
    if (combosEqual(map[action.id], combo)) return action.id;
  }
  return null;
}

export function actionLabel(id: ActionId): string {
  return ACTIONS.find((a) => a.id === id)?.label ?? id;
}
