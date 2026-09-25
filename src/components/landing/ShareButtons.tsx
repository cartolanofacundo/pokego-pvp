"use client";

import { useEffect, useState } from "react";

/** Copiar enlace (Clipboard API) y Compartir (navigator.share, oculto si no existe). Solo se ven en mobile. */
export function ShareButtons({ url }: { url: string }) {
  const [canShare, setCanShare] = useState(false);
  const [copied, setCopied] = useState(false);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setCanShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  return (
    <span className="land-mobile-banner__actions">
      <button
        type="button"
        className="btn btn--primary"
        style={{ height: 44, fontSize: 14.5 }}
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          } catch {
            // portapapeles no disponible: no hay nada más que ofrecer acá
          }
        }}
      >
        {copied ? "¡Copiado!" : "Copiar enlace"}
      </button>
      {canShare && (
        <button
          type="button"
          className="btn"
          style={{ height: 44, fontSize: 14.5 }}
          onClick={() => navigator.share({ url, title: "PokéGO PVP" })}
        >
          Compartir
        </button>
      )}
    </span>
  );
}
