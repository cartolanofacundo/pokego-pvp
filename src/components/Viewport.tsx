/**
 * Lienzo del combate y del rankeador. Ancho mínimo 1280; por debajo hay
 * scroll horizontal, no deformación.
 *
 * `scale` (por defecto) activa la unidad de escala `--u` (ver globals.css):
 * todo el contenido achica o crece en la misma proporción, hasta el tamaño
 * de diseño de 1920×1080, en un lienzo del alto de la ventana. Es el combate.
 *
 * El rankeador usa `scale={false}`: es una herramienta de tablas y números,
 * así que el texto queda a su tamaño de diseño y el lienzo crece con el
 * contenido (scroll de página vertical, sin paneles que scrolleen por
 * dentro). Sin `overflow: hidden`, así los encabezados `sticky` se pegan al
 * borde de la ventana.
 */
export function Viewport({ children, scale = true }: { children: React.ReactNode; scale?: boolean }) {
  return (
    <div
      className={scale ? "viewport-scale" : undefined}
      style={
        scale
          ? { position: "relative", width: "100%", minWidth: 1280, height: "var(--h)", overflow: "hidden" }
          : { position: "relative", width: "100%", minWidth: 1280, minHeight: "var(--h)" }
      }
    >
      {children}
    </div>
  );
}
