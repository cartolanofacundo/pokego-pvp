// Prefijo de ruta cuando la app se sirve desde un subdirectorio (GitHub
// Pages: https://usuario.github.io/pokego-pvp/). Vacío en local/Vercel.
// Debe usarse para cualquier ruta absoluta a /public que no pase por
// next/image o next/link (que ya lo agregan solos).
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function withBasePath(path: string): string {
  return `${BASE_PATH}${path}`;
}
