// Formato de números en castellano rioplatense: 71.200, 1.473.

const nf = new Intl.NumberFormat("es-AR");

export function fmt(n: number): string {
  return nf.format(n);
}

/** Polvo estelar compacto: 71.200 -> "71,2 mil", 515.200 -> "515,2 mil". */
export function fmtDust(n: number): string {
  if (n < 10000) return fmt(n);
  return `${new Intl.NumberFormat("es-AR", { maximumFractionDigits: 1 }).format(n / 1000)} mil`;
}
