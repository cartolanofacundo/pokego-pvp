import { describe, it, expect } from "vitest";
import { getPokemon, getPokemonForLeague, teamHasMega } from "./data";

describe("Megas (una por equipo)", () => {
  it("marca como Mega a las Megas, las X/Y y los Primales, y no a la especie base", () => {
    expect(getPokemon("charizard_mega_x")!.mega).toBe(true);
    expect(getPokemon("gyarados_mega")!.mega).toBe(true);
    expect(getPokemon("kyogre_primal")!.mega).toBe(true);
    expect(getPokemon("charizard")!.mega).toBe(false);
    expect(getPokemon("gyarados")!.mega).toBe(false);
  });

  it("detecta si un equipo ya tiene su Mega, ignorando huecos vacíos", () => {
    expect(teamHasMega([null, null, null])).toBe(false);
    expect(teamHasMega(["gyarados", null, "lapras"])).toBe(false);
    expect(teamHasMega([null, "gyarados_mega", "lapras"])).toBe(true);
    expect(teamHasMega(["groudon_primal", null, null])).toBe(true);
    // Un id que ya no existe en los datos no cuenta como Mega.
    expect(teamHasMega(["no_existe", null, null])).toBe(false);
  });

  it("las Megas solo tienen datos en Master League Mega Edition", () => {
    const megasIn = (league: "ultra" | "megamaster" | "retro") =>
      getPokemonForLeague(league).filter((p) => p.mega).length;
    expect(megasIn("megamaster")).toBeGreaterThan(0);
    expect(megasIn("ultra")).toBe(0);
    expect(megasIn("retro")).toBe(0);
  });
});
