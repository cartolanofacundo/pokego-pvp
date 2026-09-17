import type { SwitchLabel } from "@/lib/team";

const BADGE: Record<SwitchLabel, { icon: string; bg: string; label: string }> = {
  best: { icon: "★", bg: "#3fbf50", label: "Mejor opción" },
  good: { icon: "✓", bg: "#4a90d9", label: "Aguanta" },
  risky: { icon: "!", bg: "#e0a52c", label: "Riesgoso" },
  avoid: { icon: "✕", bg: "#d9483c", label: "Evitar" },
};

export function SwitchBadge({ label, size = 16 }: { label: SwitchLabel; size?: number }) {
  const b = BADGE[label];
  return (
    <div
      className="rounded-full border-2 border-black flex items-center justify-center text-white font-bold"
      style={{ width: size, height: size, backgroundColor: b.bg, fontSize: size * 0.55 }}
      title={b.label}
    >
      {b.icon}
    </div>
  );
}

export { BADGE as SWITCH_BADGE_META };
