/**
 * Lienzo fluido. Mínimo 1440×810; de ahí para arriba se adapta: los
 * elementos (fichas, cajas, tipografía) conservan su tamaño y lo que se
 * mueve con la resolución es el fondo, el horizonte y la posición de los
 * Pokémon. `--h` es el alto del lienzo (nunca menos de 810) y de él salen el
 * horizonte (47 %) y las dos filas de la cancha. Por debajo del mínimo hay
 * scroll, no deformación.
 */
export function Viewport({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        minWidth: 1440,
        height: "var(--h)",
        // @ts-expect-error custom property
        "--h": "max(100vh, 810px)",
        overflow: "hidden",
      }}
    >
      {children}
    </div>
  );
}
