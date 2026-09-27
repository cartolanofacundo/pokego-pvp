"use client";

import { useId } from "react";
import type { PodiumTier } from "@/lib/ranker/podium";
import { PODIUM_NAME } from "@/lib/ranker/podium";

// Círculo con degradé en diagonal y un aro interior blanco al 55%. `useId()`
// para el degradé: hay varias medallas en pantalla y los ids no pueden repetirse.
const STOPS: Record<PodiumTier, [string, string, string]> = {
  1: ["#FFF1B8", "#E2B23C", "#9C7418"],
  2: ["#FFFFFF", "#C3CDD8", "#7E8A97"],
  3: ["#FFD9B8", "#C98450", "#7F4A22"],
};

export function Medal({ tier, size = 16 }: { tier: PodiumTier; size?: number }) {
  const id = useId();
  const [a, b, c] = STOPS[tier];
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" role="img" aria-label={PODIUM_NAME[tier]} style={{ flexShrink: 0 }}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={a} />
          <stop offset="0.55" stopColor={b} />
          <stop offset="1" stopColor={c} />
        </linearGradient>
      </defs>
      <circle cx="8" cy="8" r="7" fill={`url(#${id})`} />
      <circle cx="8" cy="8" r="4.6" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="1" />
    </svg>
  );
}
