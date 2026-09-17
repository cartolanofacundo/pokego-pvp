"use client";

import { useState } from "react";
import { TYPE_COLORS, type PokemonType } from "@/lib/types";
import type { Pokemon } from "@/lib/data";
import { withBasePath } from "@/lib/basePath";

/**
 * Sprite animado de Pokémon Showdown (frente y espalda). Si falta el de
 * espalda para esa forma puntual, usa el de frente espejado; si falla
 * también el de frente, cae a un cuadro con gradiente de tipos + inicial
 * del nombre. Cada GIF tiene su propio ancho/alto (no son cuadrados como
 * los pixel-art viejos), así que se acotan dentro de una caja `size x size`
 * sin estirarlos.
 *
 * IMPORTANTE: quien la use debe pasarle `key={pokemon.speciesId}` (o algo
 * que incluya el speciesId) para que React la remonte al cambiar de
 * Pokémon; si no, el estado de "sprite roto" de la especie anterior podría
 * quedar pegado en la nueva.
 */
export function PokemonSprite({
  pokemon,
  facing,
  size = 96,
  className = "",
}: {
  pokemon: Pokemon;
  facing: "front" | "back";
  size?: number;
  className?: string;
}) {
  const [frontFailed, setFrontFailed] = useState(false);
  const [backFailed, setBackFailed] = useState(false);

  const frontSrc = withBasePath(`/sprites/${pokemon.speciesId}.gif`);
  const backSrc = withBasePath(`/sprites/back/${pokemon.speciesId}.gif`);

  const box = (children: React.ReactNode) => (
    <div
      className={`relative flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      {children}
      {pokemon.shadow && (
        <span
          className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-black flex items-center justify-center text-white text-[9px] leading-none"
          style={{ backgroundColor: "#5b2a86" }}
          title="Shadow"
        >
          ★
        </span>
      )}
    </div>
  );

  const imgStyle: React.CSSProperties = {
    maxWidth: size,
    maxHeight: size,
    width: "auto",
    height: "auto",
  };

  if (facing === "front" && !frontFailed) {
    return box(
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={frontSrc}
        alt={pokemon.speciesName}
        style={imgStyle}
        onError={() => setFrontFailed(true)}
      />
    );
  }

  if (facing === "back" && !backFailed) {
    return box(
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={backSrc}
        alt={pokemon.speciesName}
        style={imgStyle}
        onError={() => setBackFailed(true)}
      />
    );
  }

  // Fallback: espejar el sprite de frente para simular la espalda,
  // o el cuadro con gradiente si ni ese existe.
  if (facing === "back" && !frontFailed) {
    return box(
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={frontSrc}
        alt={pokemon.speciesName}
        style={{ ...imgStyle, transform: "scaleX(-1)" }}
        onError={() => setFrontFailed(true)}
      />
    );
  }

  const [t1, t2] = pokemon.types;
  const c1 = TYPE_COLORS[t1 as PokemonType] ?? "#888";
  const c2 = TYPE_COLORS[(t2 as PokemonType) ?? t1] ?? c1;

  return box(
    <div
      className="flex items-center justify-center rounded-full border-2 border-black text-white text-[10px] font-bold w-full h-full"
      style={{
        background: `linear-gradient(135deg, ${c1}, ${c2})`,
        textShadow: "1px 1px 0 rgba(0,0,0,0.5)",
      }}
    >
      {pokemon.speciesName.slice(0, 3).toUpperCase()}
    </div>
  );
}
