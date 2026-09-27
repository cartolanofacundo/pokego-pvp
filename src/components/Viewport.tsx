/**
 * Lienzo del combate y del rankeador. Mínimo 1280×720; por debajo hay scroll,
 * no deformación.
 *
 * `scale` (por defecto) activa la unidad de escala `--u` (ver globals.css):
 * todo el contenido achica o crece en la misma proporción, hasta el tamaño
 * de diseño de 1920×1080. El combate la usa; el rankeador no (`scale={false}`):
 * es una herramienta de tablas y números, así que el texto queda siempre a
 * su tamaño de diseño y lo que no entra se reorganiza con container queries.
 */
export function Viewport({ children, scale = true }: { children: React.ReactNode; scale?: boolean }) {
  return (
    <div
      className={scale ? "viewport-scale" : undefined}
      style={{
        position: "relative",
        width: "100%",
        minWidth: 1280,
        height: "var(--h)",
        overflow: "hidden",
      }}
    >
      {children}
    </div>
  );
}
