import type { Combo } from "@/lib/shortcuts";
import { comboLabel } from "@/lib/shortcuts";

/** Ficha de tecla. Recibe la combinación actual (puede ser null si la acción quedó sin atajo). */
export function Kbd({
  combo,
  small = false,
  className = "",
  style,
}: {
  combo: Combo | null;
  small?: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  const label = combo ? comboLabel(combo) : "—";
  return (
    <span className={`kbd ${small ? "kbd--sm" : ""} ${className}`} style={style}>
      {label}
    </span>
  );
}
