// Podio de IV: los rangos #1, #2 y #3 pasan a oro, plata y bronce en lugar
// del verde, para distinguir de un vistazo los mejores IV de la caja. Del #4
// al #100 sigue el verde, y del #101 para abajo, el gris.
//
// El rango que se compara es el "de competencia" que ya calcula `ivrank.ts`:
// si dos combinaciones empatan en el #2, las dos son plata y la siguiente
// entrada es #4 (no hay bronce).

export type PodiumTier = 1 | 2 | 3;

export const PODIUM_NAME: Record<PodiumTier, string> = { 1: "oro", 2: "plata", 3: "bronce" };

/** Nombre en inglés de las clases y tokens CSS (.rk-podium--gold, --gold-text…). */
export const PODIUM_CLASS: Record<PodiumTier, "gold" | "silver" | "bronze"> = { 1: "gold", 2: "silver", 3: "bronze" };

/** null cuando el rango no entra al podio (no es #1, #2 ni #3). */
export function podiumOf(rank: number): PodiumTier | null {
  return rank === 1 || rank === 2 || rank === 3 ? rank : null;
}
