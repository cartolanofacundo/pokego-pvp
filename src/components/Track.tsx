// Pista de combate (valores recalibrados para luz ambiente: la banda de sombra
// y la viñeta van más bajas a propósito; oscurecer los bordes arruina la
// lectura con reflejo): campos rival/propio, banda de sombra, horizonte,
// scanline, viñeta, marcas en L y ficha VS. Todo decorativo (pointer-events: none).
// El horizonte va al 47 % del alto del lienzo (508/1080 en el diseño) y se
// apaga a 336 px de cada borde, antes de tocar los rieles (48 + 288). Todas
// las medidas están en `u()`: la pista entera achica o crece con --u, junto
// con los rieles, la caja y los sprites (ver globals.css).

import { u } from "@/lib/scale";

const HORIZON = "calc(var(--h) * 0.47)";

export function Track() {
  const mark = (style: React.CSSProperties) => (
    <span style={{ position: "absolute", background: "rgba(255,255,255,0.30)", ...style }} />
  );
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }} aria-hidden="true">
      <div
        style={{
          position: "absolute", left: 0, right: 0, top: 0, height: HORIZON,
          background:
            "radial-gradient(900px 520px at 68% 24%, rgba(255,92,92,0.17) 0%, rgba(255,92,92,0) 66%), linear-gradient(180deg, #0F0A0B 0%, #1A1012 100%)",
        }}
      />
      <div
        style={{
          position: "absolute", left: 0, right: 0, top: HORIZON, bottom: 0,
          background:
            "radial-gradient(900px 520px at 32% 76%, rgba(92,152,236,0.21) 0%, rgba(92,152,236,0) 66%), linear-gradient(180deg, #0B1017 0%, #111D2B 100%)",
        }}
      />
      <div
        style={{
          position: "absolute", left: 0, right: 0, top: `calc(${HORIZON} - ${u(110)})`, height: u(200),
          background: "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.34) 50%, rgba(0,0,0,0) 100%)",
        }}
      />
      <div
        style={{
          position: "absolute", left: u(336), right: u(336), top: `calc(${HORIZON} - ${u(8)})`, height: u(16),
          background: "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.07) 50%, rgba(255,255,255,0) 100%)",
          filter: "blur(5px)",
        }}
      />
      <div
        style={{
          position: "absolute", left: u(336), right: u(336), top: `calc(${HORIZON} - ${u(1)})`, height: u(2),
          background: "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.58) 50%, rgba(255,255,255,0) 100%)",
        }}
      />
      <div
        style={{
          position: "absolute", inset: 0,
          background:
            "repeating-linear-gradient(0deg, rgba(255,255,255,0.020) 0px, rgba(255,255,255,0.020) 1px, rgba(255,255,255,0) 1px, rgba(255,255,255,0) 3px)",
        }}
      />
      <div
        style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(73% 72% at 50% 50%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.28) 100%)",
        }}
      />

      {mark({ left: u(48), top: u(88), width: u(22), height: u(1) })}
      {mark({ left: u(48), top: u(88), width: u(1), height: u(22) })}
      {mark({ right: u(48), top: u(88), width: u(22), height: u(1) })}
      {mark({ right: u(48), top: u(88), width: u(1), height: u(22) })}
      {mark({ left: u(48), bottom: u(36), width: u(22), height: u(1) })}
      {mark({ left: u(48), bottom: u(36), width: u(1), height: u(22) })}
      {mark({ right: u(48), bottom: u(36), width: u(22), height: u(1) })}
      {mark({ right: u(48), bottom: u(36), width: u(1), height: u(22) })}

      <span
        style={{
          position: "absolute", left: "50%", top: `calc(${HORIZON} - ${u(15)})`, transform: "translateX(-50%)",
          display: "flex", alignItems: "center", gap: u(14),
        }}
      >
        <span style={{ width: u(90), height: 1, background: "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.36) 100%)" }} />
        <span
          className="mono"
          style={{
            display: "inline-flex", alignItems: "center", height: u(30), padding: `0 ${u(16)} 0 ${u(18)}`,
            background: "#0B0D11", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.34)",
            clipPath: `polygon(${u(9)} 0, 100% 0, calc(100% - ${u(9)}) 100%, 0 100%)`,
            fontSize: u(13), fontWeight: 600, letterSpacing: "0.3em", color: "#DCE1E7",
          }}
        >
          VS
        </span>
        <span style={{ width: u(90), height: 1, background: "linear-gradient(90deg, rgba(255,255,255,0.36) 0%, rgba(255,255,255,0) 100%)" }} />
      </span>
    </div>
  );
}
