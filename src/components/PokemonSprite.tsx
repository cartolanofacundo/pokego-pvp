"use client";

import { useState } from "react";
import { TYPE_COLORS, type PokemonType } from "@/lib/types";
import type { Pokemon } from "@/lib/data";
import { withBasePath } from "@/lib/basePath";

/**
 * Sprite pixel-art de PokeAPI. Si falta el de espalda, usa el de frente
 * espejado; si falla también el de frente, cae a un cuadro con gradiente
 * de tipos + inicial del nombre.
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

  const frontSrc = withBasePath(`/sprites/${pokemon.speciesId}.png`);
  const backSrc = withBasePath(`/sprites/back/${pokemon.speciesId}.png`);

  if (facing === "front" && !frontFailed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={frontSrc}
        alt={pokemon.speciesName}
        width={size}
        height={size}
        className={`pixelated ${className}`}
        style={{ width: size, height: size, imageRendering: "pixelated" }}
        onError={() => setFrontFailed(true)}
      />
    );
  }

  if (facing === "back" && !backFailed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={backSrc}
        alt={pokemon.speciesName}
        width={size}
        height={size}
        className={`pixelated ${className}`}
        style={{ width: size, height: size, imageRendering: "pixelated" }}
        onError={() => setBackFailed(true)}
      />
    );
  }

  // Fallback: espejar el sprite de frente para simular la espalda,
  // o el cuadro con gradiente si ni ese existe.
  if (facing === "back" && !frontFailed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={frontSrc}
        alt={pokemon.speciesName}
        width={size}
        height={size}
        className={`pixelated ${className}`}
        style={{
          width: size,
          height: size,
          imageRendering: "pixelated",
          transform: "scaleX(-1)",
        }}
        onError={() => setFrontFailed(true)}
      />
    );
  }

  const [t1, t2] = pokemon.types;
  const c1 = TYPE_COLORS[t1 as PokemonType] ?? "#888";
  const c2 = TYPE_COLORS[(t2 as PokemonType) ?? t1] ?? c1;

  return (
    <div
      className={`flex items-center justify-center rounded-full border-2 border-black text-white text-[10px] font-bold ${className}`}
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${c1}, ${c2})`,
        textShadow: "1px 1px 0 rgba(0,0,0,0.5)",
      }}
    >
      {pokemon.speciesName.slice(0, 3).toUpperCase()}
    </div>
  );
}
