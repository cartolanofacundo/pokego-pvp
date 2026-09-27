/**
 * "N px de diseño" en el lienzo lógico del combate y del rankeador (ver el
 * comentario de --u en globals.css). Se usa en los estilos inline; las
 * clases de CSS escriben "calc(N * var(--u))" directamente.
 */
export function u(n: number): string {
  return `calc(${n} * var(--u))`;
}

/**
 * Como `u`, pero con un piso en px para que el texto chico siga siendo
 * legible en la resolución mínima (1280×720, --u = 0.6667).
 */
export function uFloor(n: number, floorPx: number): string {
  return `max(${floorPx}px, ${u(n)})`;
}
