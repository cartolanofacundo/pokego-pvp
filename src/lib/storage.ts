// Persistencia liviana en localStorage con try/catch: si falla (modo privado,
// storage bloqueado, SSR) simplemente no persiste, sin romper la app.

export function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function saveJSON(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignorar: almacenamiento no disponible
  }
}
