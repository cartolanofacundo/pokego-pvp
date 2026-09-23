import { describe, it, expect } from "vitest";
import { getPokemon } from "./data";
import { matchupAdvantage, relevantAttackTypes } from "./matchup";

describe("matchupAdvantage (con datos reales de PvPoke, Ultra League)", () => {
  it("Lapras tiene ventaja contra Altaria (Ice Beam x2.56)", () => {
    const lapras = getPokemon("lapras")!;
    const altaria = getPokemon("altaria")!;
    const result = matchupAdvantage(lapras, altaria, "ultra");
    expect(result.maxMult).toBeCloseTo(2.56, 5);
    expect(result.advantage).toBe(true);
  });

  it("Raikou tiene ventaja contra Gyarados (Thunder Shock x2.56, agua/volador)", () => {
    const raikou = getPokemon("raikou")!;
    const gyarados = getPokemon("gyarados")!;
    const result = matchupAdvantage(raikou, gyarados, "ultra");
    expect(result.maxMult).toBeCloseTo(2.56, 5);
    expect(result.advantage).toBe(true);
  });

  it("Altaria NO tiene ventaja contra Lapras (nada supereefectivo, sin rating a favor)", () => {
    const altaria = getPokemon("altaria")!;
    const lapras = getPokemon("lapras")!;
    const result = matchupAdvantage(altaria, lapras, "ultra");
    expect(result.maxMult).toBeLessThan(1.6);
    expect(result.advantage).toBe(false);
  });
});

describe("relevantAttackTypes", () => {
  it("junta los tipos de ataque de todo el equipo, ignorando huecos vacíos", () => {
    const lapras = getPokemon("lapras")!;
    const annihilape = getPokemon("annihilape")!;
    const types = relevantAttackTypes([lapras, null, annihilape], "ultra");
    // Lapras: psywave(psychic)/sparkling_aria(water)/ice_beam(ice); Annihilape: low_kick(fighting)/rage_fist(ghost)/ice_punch(ice)
    expect(types.has("ice")).toBe(true);
    expect(types.has("water")).toBe(true);
    expect(types.has("fighting")).toBe(true);
    expect(types.has("ghost")).toBe(true);
  });
});
