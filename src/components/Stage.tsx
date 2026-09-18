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
 */
export function Stage({ side, pokemon }: { side: "rival" | "ally"; pokemon: Pokemon | null }) {
  if (side === "rival") return <RivalStage pokemon={pokemon} />;
  return <AllyStage pokemon={pokemon} />;
}

function RivalStage({ pokemon }: { pokemon: Pokemon | null }) {
  const dashed = pokemon === null;
  const ring = dashed ? "dashed" : "solid";
  return (
    <div className="stage stage--rival" data-coach="rival-stage">
      <div
        style={{
          position: "absolute", bottom: 4, left: "50%", width: 430, height: 92, transform: "translateX(-50%)",
          borderRadius: "50%", border: `1px ${ring} rgba(255,168,168,${dashed ? 0.30 : 0.32})`,
          background: `radial-gradient(ellipse at center, rgba(255,150,150,${dashed ? 0.05 : 0.17}) 0%, rgba(255,150,150,0) 72%)`,
        }}
      />
      <div
        style={{
          position: "absolute", bottom: 22, left: "50%", width: 288, height: 60, transform: "translateX(-50%)",
          borderRadius: "50%", border: `1px ${ring} rgba(255,168,168,${dashed ? 0.28 : 0.30})`,
          background: `radial-gradient(ellipse at center, rgba(255,150,150,${dashed ? 0.07 : 0.24}) 0%, rgba(255,150,150,0) 74%)`,
        }}
      />
      {pokemon ? (
        <>
          <div
            style={{
              position: "absolute", bottom: 36, left: "50%", width: 218, height: 38, transform: "translateX(-50%)",
              background: "radial-gradient(ellipse at center, rgba(0,0,0,0.66) 0%, rgba(0,0,0,0) 72%)",
            }}
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={pokemon.speciesId}
            className="stage__img stage__img--rival"
            src={withBasePath(`/sprites/${pokemon.speciesId}.gif`)}
            alt={pokemon.speciesName}
            style={{ filter: "drop-shadow(0 24px 24px rgba(0,0,0,0.62))" }}
          />
        </>
      ) : (
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
          position: "absolute", bottom: 4, left: "50%", width: 552, height: 116, transform: "translateX(-50%)",
          borderRadius: "50%", border: `1px ${ring} rgba(150,192,244,${dashed ? 0.32 : 0.34})`,
          background: `radial-gradient(ellipse at center, rgba(130,180,244,${dashed ? 0.05 : 0.19}) 0%, rgba(130,180,244,0) 72%)`,
        }}
      />
      <div
        style={{
          position: "absolute", bottom: 26, left: "50%", width: 372, height: 76, transform: "translateX(-50%)",
          borderRadius: "50%", border: `1px ${ring} rgba(150,192,244,${dashed ? 0.30 : 0.32})`,
          background: `radial-gradient(ellipse at center, rgba(130,180,244,${dashed ? 0.08 : 0.26}) 0%, rgba(130,180,244,0) 74%)`,
        }}
      />
      {pokemon ? (
        <>
          <div
            style={{
              position: "absolute", bottom: 42, left: "50%", width: 282, height: 48, transform: "translateX(-50%)",
              background: "radial-gradient(ellipse at center, rgba(0,0,0,0.70) 0%, rgba(0,0,0,0) 72%)",
            }}
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={pokemon.speciesId}
            className="stage__img stage__img--vos"
            src={withBasePath(`/sprites/back/${pokemon.speciesId}.gif`)}
            alt={`${pokemon.speciesName} de espaldas`}
            style={{ filter: "drop-shadow(0 22px 22px rgba(0,0,0,0.66))" }}
          />
        </>
      ) : (
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
