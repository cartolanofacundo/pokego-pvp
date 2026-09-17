"use client";

import { useState } from "react";
import { TYPE_COLORS, type PokemonType } from "@/lib/types";
import { EFFECT_SYMBOL, type MoveScore } from "@/lib/recommend";

export function OtherMoves({
  fast,
  charged,
}: {
  fast: MoveScore[];
  charged: MoveScore[];
}) {
  const [open, setOpen] = useState(false);
  if (fast.length === 0 && charged.length === 0) return null;

  return (
    <div className="w-full">
      <button
        onClick={() => setOpen((o) => !o)}
        className="text-[7px] underline text-neutral-300 hover:text-white"
      >
        {open ? "Ocultar otros ataques ▲" : "Otros ataques posibles ▼"}
      </button>
      {open && (
        <div className="flex flex-col gap-0.5 mt-1">
          {[...fast, ...charged].map((m) => {
            const color = TYPE_COLORS[m.type as PokemonType] ?? "#888";
            return (
              <div
                key={m.moveId}
                className="flex items-center justify-between gap-1 text-[7px] px-1.5 py-0.5 rounded border border-black/40"
                style={{ backgroundColor: color, color: "white" }}
              >
                <span style={{ textShadow: "1px 1px 0 rgba(0,0,0,0.5)" }}>
                  {m.name} {m.isFast ? "(rápido)" : ""}
                </span>
                <span className="font-bold">{EFFECT_SYMBOL[m.tier]}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
