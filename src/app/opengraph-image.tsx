import { ImageResponse } from "next/og";
import { APP_NAME } from "@/lib/site";

export const dynamic = "force-static";
export const alt = `${APP_NAME}: stats de PvP en vivo y ranking de IV para Pokémon GO`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Sin captura: el generador de imágenes no lee WebP. Mismo degradé del hero
// de la landing (campo rojizo a azulado) con el H1 encima; se reemplaza por
// una versión con captura cuando el pipeline soporte esos formatos.
export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "linear-gradient(135deg, #2A1416 0%, #1A1012 45%, #0B1017 75%, #080A0D 100%)",
          color: "#F2F3F5",
        }}
      >
        <div style={{ display: "flex", fontSize: 26, letterSpacing: 4, textTransform: "uppercase", color: "#C2C9D2" }}>
          Pokémon GO · PvP · en español
        </div>
        <div style={{ display: "flex", fontSize: 62, fontWeight: 800, lineHeight: 1.08, maxWidth: 1000, marginTop: 28 }}>
          Stats de PvP en vivo y ranking de IV
        </div>
        <div style={{ display: "flex", fontSize: 30, fontWeight: 700, marginTop: 44 }}>{APP_NAME}</div>
      </div>
    ),
    { ...size }
  );
}
