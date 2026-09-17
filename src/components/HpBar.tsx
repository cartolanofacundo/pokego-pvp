/** Barra de HP puramente decorativa (siempre llena): recrea la estética de
 * la pantalla de combate sin simular una pelea real turno a turno. */
export function HpBar({ pct = 100 }: { pct?: number }) {
  const color = pct > 50 ? "var(--hp-green)" : pct > 20 ? "var(--hp-yellow)" : "var(--hp-red)";
  return (
    <div className="gb-hp-track w-full">
      <div className="gb-hp-fill" style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  );
}
