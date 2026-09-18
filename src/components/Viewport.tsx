"use client";

import { useSyncExternalStore } from "react";

const W = 1920;
const H = 1080;

function subscribe(cb: () => void) {
  window.addEventListener("resize", cb);
  return () => window.removeEventListener("resize", cb);
}

function snapshot(): string {
  return `${window.innerWidth}x${window.innerHeight}`;
}

/**
 * El diseño es un lienzo fijo de 1920×1080. Para que ocupe toda la ventana sin
 * deformarse, se escala uniformemente al mayor factor que entra (llena el
 * alto y el ancho en una pantalla 16:9; en otras proporciones queda centrado
 * sobre el fondo base) y se centra. Todas las medidas del diseño se mantienen
 * en píxeles del lienzo.
 */
export function Viewport({ children }: { children: React.ReactNode }) {
  const size = useSyncExternalStore(subscribe, snapshot, () => `${W}x${H}`);
  const [vw, vh] = size.split("x").map(Number);
  const scale = Math.min(vw / W, vh / H);
  const left = Math.round((vw - W * scale) / 2);
  const top = Math.round((vh - H * scale) / 2);
  // Si la ventana es más ancha que 16:9, las bandas laterales continúan los
  // dos campos de la pista, partidos a la altura del horizonte (y = 508).
  const horizon = Math.round(top + 508 * scale);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        overflow: "hidden",
        background: `linear-gradient(180deg, #0F0A0B 0px, #1A1012 ${horizon - 1}px, #0B1017 ${horizon}px, #111D2B 100%)`,
      }}
    >
      <div
        style={{
          position: "absolute",
          left,
          top,
          width: W,
          height: H,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        {children}
      </div>
    </div>
  );
}
