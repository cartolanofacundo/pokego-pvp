// Pista de combate: campos rival/propio, banda de sombra, horizonte,
// scanline, viñeta, marcas en L y ficha VS. Todo decorativo (pointer-events: none).
// Medidas de Main.dc.html.

export function Track() {
  const mark = (style: React.CSSProperties) => (
    <span style={{ position: "absolute", background: "rgba(255,255,255,0.16)", ...style }} />
  );
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }} aria-hidden="true">
      <div
        style={{
          position: "absolute", left: 0, right: 0, top: 0, height: 508,
          background:
            "radial-gradient(900px 520px at 68% 24%, rgba(255,92,92,0.11) 0%, rgba(255,92,92,0) 66%), linear-gradient(180deg, #0F0A0B 0%, #1A1012 100%)",
        }}
      />
      <div
        style={{
          position: "absolute", left: 0, right: 0, top: 508, bottom: 0,
          background:
            "radial-gradient(900px 520px at 32% 76%, rgba(92,152,236,0.14) 0%, rgba(92,152,236,0) 66%), linear-gradient(180deg, #0B1017 0%, #111D2B 100%)",
        }}
      />
      <div
        style={{
          position: "absolute", left: 0, right: 0, top: 398, height: 200,
          background: "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.45) 50%, rgba(0,0,0,0) 100%)",
        }}
      />
      <div
        style={{
          position: "absolute", left: 336, right: 336, top: 500, height: 16,
          background: "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.07) 50%, rgba(255,255,255,0) 100%)",
          filter: "blur(5px)",
        }}
      />
      <div
        style={{
          position: "absolute", left: 336, right: 336, top: 507, height: 2,
          background: "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.38) 50%, rgba(255,255,255,0) 100%)",
        }}
      />
      <div
        style={{
          position: "absolute", inset: 0,
          background:
            "repeating-linear-gradient(0deg, rgba(255,255,255,0.014) 0px, rgba(255,255,255,0.014) 1px, rgba(255,255,255,0) 1px, rgba(255,255,255,0) 3px)",
        }}
      />
      <div
        style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(1400px 780px at 50% 50%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.45) 100%)",
        }}
      />

      {mark({ left: 48, top: 88, width: 22, height: 1 })}
      {mark({ left: 48, top: 88, width: 1, height: 22 })}
      {mark({ right: 48, top: 88, width: 22, height: 1 })}
      {mark({ right: 48, top: 88, width: 1, height: 22 })}
      {mark({ left: 48, bottom: 36, width: 22, height: 1 })}
      {mark({ left: 48, bottom: 36, width: 1, height: 22 })}
      {mark({ right: 48, bottom: 36, width: 22, height: 1 })}
      {mark({ right: 48, bottom: 36, width: 1, height: 22 })}

      <span
        style={{
          position: "absolute", left: "50%", top: 493, transform: "translateX(-50%)",
          display: "flex", alignItems: "center", gap: 14,
        }}
      >
        <span style={{ width: 90, height: 1, background: "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.22) 100%)" }} />
        <span
          className="mono"
          style={{
            display: "inline-flex", alignItems: "center", height: 30, padding: "0 16px 0 18px",
            background: "#0B0D11", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.22)",
            clipPath: "polygon(9px 0, 100% 0, calc(100% - 9px) 100%, 0 100%)",
            fontSize: 13, fontWeight: 600, letterSpacing: "0.3em", color: "#C9CFD8",
          }}
        >
          VS
        </span>
        <span style={{ width: 90, height: 1, background: "linear-gradient(90deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0) 100%)" }} />
      </span>
    </div>
  );
}
