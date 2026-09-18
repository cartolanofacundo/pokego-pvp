"use client";

import { useEffect, useState } from "react";
import type { Pokemon } from "@/lib/data";
import { withBasePath } from "@/lib/basePath";

/**
 * Plataforma + sprite de campo. Dos anillos elípticos del color del campo,
 * sombra de contacto y el sprite anclado al piso de su fila. El propio va
 * más grande (545 px) que el rival (410 px): está adelante, y esa diferencia
 * da la profundidad. En ventanas bajas el sprite se achica para entrar en la
 * fila. Vacío: anillos punteados y un "?".
 *
 * Sprites de campo: GIF animados de Pokémon Showdown (frente y espalda),
 * decisión del dueño del proyecto. Sin `pixelated`: no son pixel art.
 *
 * Luz difusa: la mitad del dex es oscura y un sprite negro o violeta se
 * funde con su campo. Dos drop-shadow sin desplazamiento (uno abierto casi
 * blanco, otro ancho del color del campo) más un halo radial detrás de cada
 * combatiente, por debajo de los anillos. La separación viene del volumen de
 * luz, no de un borde duro.
 *
 * Movimiento: el sprite entra desde su lado (220 ms) y el anterior sale en
 * 120 ms mientras el nuevo entra; en campo respira (el único bucle).
 */
export function Stage({ side, pokemon }: { side: "rival" | "ally"; pokemon: Pokemon | null }) {
  if (side === "rival") return <RivalStage pokemon={pokemon} />;
  return <AllyStage pokemon={pokemon} />;
}

const RIVAL_LIGHT =
  "drop-shadow(0 0 5px rgba(255,238,238,0.26)) drop-shadow(0 0 34px rgba(255,170,170,0.34)) drop-shadow(0 24px 24px rgba(0,0,0,0.62))";
const ALLY_LIGHT =
  "drop-shadow(0 0 5px rgba(238,246,255,0.28)) drop-shadow(0 0 36px rgba(150,195,250,0.38)) drop-shadow(0 22px 22px rgba(0,0,0,0.66)) contrast(1.06)";

const EXIT_MS = 120;

/**
 * Sprite en campo. Cuando cambia el Pokémon, el saliente queda 120 ms con su
 * animación de salida (sin scale, más rápida que la entrada) y el entrante
 * arranca en el mismo instante desde su lado.
 */
function FieldSprite({ side, pokemon }: { side: "rival" | "ally"; pokemon: Pokemon | null }) {
  const [current, setCurrent] = useState(pokemon);
  const [outgoing, setOutgoing] = useState<Pokemon | null>(null);
  if (current?.speciesId !== pokemon?.speciesId) {
    // Ajuste de estado durante el render: el que estaba pasa a saliente.
    setOutgoing(current);
    setCurrent(pokemon);
  }
  useEffect(() => {
    if (!outgoing) return;
    const t = setTimeout(() => setOutgoing(null), EXIT_MS);
    return () => clearTimeout(t);
  }, [outgoing]);

  const cls = side === "rival" ? "rival" : "vos";
  const src = (p: Pokemon) => withBasePath(side === "rival" ? `/sprites/${p.speciesId}.gif` : `/sprites/back/${p.speciesId}.gif`);
  const light = side === "rival" ? RIVAL_LIGHT : ALLY_LIGHT;

  return (
    <>
      {outgoing && (
        <span key={`out-${outgoing.speciesId}`} className={`stage__sprite stage__sprite--${cls} stage__sprite--out`} aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="stage__img" src={src(outgoing)} alt="" style={{ filter: light }} />
        </span>
      )}
      {current && (
        <span key={current.speciesId} className={`stage__sprite stage__sprite--${cls} stage__sprite--in`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className={`stage__img stage__img--breath ${side === "ally" ? "stage__img--breath-late" : ""}`}
            src={src(current)}
            alt={side === "rival" ? current.speciesName : `${current.speciesName} de espaldas`}
            style={{ filter: light }}
          />
        </span>
      )}
    </>
  );
}

function RivalStage({ pokemon }: { pokemon: Pokemon | null }) {
  const dashed = pokemon === null;
  const ring = dashed ? "dashed" : "solid";
  return (
    <div className="stage stage--rival" data-coach="rival-stage">
      <div
        style={{
          position: "absolute", top: "44%", left: "50%", width: 620, height: 620, transform: "translate(-50%,-50%)",
          background: "radial-gradient(circle, rgba(255,150,150,0.15) 0%, rgba(255,150,150,0) 62%)",
        }}
      />
      <div
        style={{
          position: "absolute", bottom: 4, left: "50%", width: 430, height: 92, transform: "translateX(-50%)",
          borderRadius: "50%", border: `1px ${ring} rgba(255,168,168,${dashed ? 0.40 : 0.42})`,
          background: `radial-gradient(ellipse at center, rgba(255,150,150,${dashed ? 0.05 : 0.24}) 0%, rgba(255,150,150,0) 72%)`,
        }}
      />
      <div
        style={{
          position: "absolute", bottom: 22, left: "50%", width: 288, height: 60, transform: "translateX(-50%)",
          borderRadius: "50%", border: `1px ${ring} rgba(255,168,168,${dashed ? 0.38 : 0.40})`,
          background: `radial-gradient(ellipse at center, rgba(255,150,150,${dashed ? 0.07 : 0.24}) 0%, rgba(255,150,150,0) 74%)`,
        }}
      />
      {pokemon && (
        <div
          style={{
            position: "absolute", bottom: 36, left: "50%", width: 218, height: 38, transform: "translateX(-50%)",
            background: "radial-gradient(ellipse at center, rgba(0,0,0,0.66) 0%, rgba(0,0,0,0) 72%)",
          }}
        />
      )}
      <FieldSprite side="rival" pokemon={pokemon} />
      {!pokemon && (
        <span
          className="display"
          style={{
            position: "absolute", bottom: 92, left: "50%", transform: "translateX(-50%)",
            display: "flex", alignItems: "center", justifyContent: "center", width: 168, height: 168,
            borderRadius: "50%", border: "1px dashed rgba(255,255,255,0.25)",
            fontSize: 58, fontWeight: 800, color: "rgba(255,255,255,0.13)",
          }}
        >
          ?
        </span>
      )}
    </div>
  );
}

function AllyStage({ pokemon }: { pokemon: Pokemon | null }) {
  const dashed = pokemon === null;
  const ring = dashed ? "dashed" : "solid";
  return (
    <div className="stage stage--vos" data-coach="vos-stage">
      <div
        style={{
          position: "absolute", top: "46%", left: "50%", width: 740, height: 740, transform: "translate(-50%,-50%)",
          background: "radial-gradient(circle, rgba(120,175,245,0.18) 0%, rgba(120,175,245,0) 62%)",
        }}
      />
      <div
        style={{
          position: "absolute", bottom: 4, left: "50%", width: 552, height: 116, transform: "translateX(-50%)",
          borderRadius: "50%", border: `1px ${ring} rgba(150,192,244,${dashed ? 0.44 : 0.46})`,
          background: `radial-gradient(ellipse at center, rgba(130,180,244,${dashed ? 0.05 : 0.26}) 0%, rgba(130,180,244,0) 72%)`,
        }}
      />
      <div
        style={{
          position: "absolute", bottom: 26, left: "50%", width: 372, height: 76, transform: "translateX(-50%)",
          borderRadius: "50%", border: `1px ${ring} rgba(150,192,244,${dashed ? 0.42 : 0.44})`,
          background: `radial-gradient(ellipse at center, rgba(130,180,244,${dashed ? 0.08 : 0.26}) 0%, rgba(130,180,244,0) 74%)`,
        }}
      />
      {pokemon && (
        <div
          style={{
            position: "absolute", bottom: 42, left: "50%", width: 282, height: 48, transform: "translateX(-50%)",
            background: "radial-gradient(ellipse at center, rgba(0,0,0,0.70) 0%, rgba(0,0,0,0) 72%)",
          }}
        />
      )}
      <FieldSprite side="ally" pokemon={pokemon} />
      {!pokemon && (
        <span
          className="display"
          style={{
            position: "absolute", bottom: 110, left: "50%", transform: "translateX(-50%)",
            display: "flex", alignItems: "center", justifyContent: "center", width: 210, height: 210,
            borderRadius: "50%", border: "1px dashed rgba(255,255,255,0.26)",
            fontSize: 72, fontWeight: 800, color: "rgba(255,255,255,0.14)",
          }}
        >
          ?
        </span>
      )}
    </div>
  );
}

export function Connector({ side, dim }: { side: "rival" | "ally"; dim: boolean }) {
  if (side === "rival") {
    return (
      <span className={`connector ${dim ? "connector--dim" : ""}`}>
        <span className="connector__tick" />
        <span className="connector__line connector__line--rival" />
        <span className="connector__diamond" style={{ background: "#E8CFCF" }} />
      </span>
    );
  }
  return (
    <span className={`connector ${dim ? "connector--dim" : ""}`}>
      <span className="connector__diamond" style={{ background: "#CFDCEC" }} />
      <span className="connector__line connector__line--vos" />
      <span className="connector__tick" />
    </span>
  );
}
