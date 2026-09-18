import { typeStyle } from "@/lib/typeStyles";
import { typeLabelEs } from "@/lib/typeLabels";

export function TypeChip({
  type,
  variant = "row",
}: {
  type: string;
  variant?: "row" | "header" | "weak" | "search";
}) {
  const s = typeStyle(type);
  const cls =
    variant === "header"
      ? "type-chip type-chip--header"
      : variant === "weak"
        ? "type-chip type-chip--weak"
        : variant === "search"
          ? "type-chip type-chip--search"
          : "type-chip";
  return (
    <span className={cls} style={{ background: s.bg, color: s.fg }}>
      {typeLabelEs(type)}
    </span>
  );
}

export function TypeChips({
  types,
  variant = "header",
  gap = 5,
}: {
  types: readonly (string | null | undefined)[];
  variant?: "row" | "header" | "weak" | "search";
  gap?: number;
}) {
  const valid = types.filter((t): t is string => !!t && t !== "none");
  return (
    <span style={{ display: "flex", gap }}>
      {valid.map((t) => (
        <TypeChip key={t} type={t} variant={variant} />
      ))}
    </span>
  );
}
