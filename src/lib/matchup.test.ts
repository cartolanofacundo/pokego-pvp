import { describe, it, expect } from "vitest";
import { getPokemon } from "./data";
import { matchupAdvantage, relevantAttackTypes } from "./matchup";

describe("matchupAdvantage (con datos reales de PvPoke)", () => {
  it("Azumarill tiene ventaja contra Altaria (Ice Beam x2.56)", () => {
    const azumarill = getPokemon("azumarill")!;
    const altaria = getPokemon("altaria")!;
    const result = matchupAdvantage(azumarill, altaria, "great");
    expect(result.maxMult).toBeCloseTo(2.56, 5);
    expect(result.advantage).toBe(true);
  });

  it("Melmetal tiene ventaja contra Skarmory (Thunder Shock x2.56, acero/volador)", () => {
    const melmetal = getPokemon("melmetal")!;
    const skarmory = getPokemon("skarmory")!;
    const result = matchupAdvantage(melmetal, skarmory, "great");
    expect(result.advantage).toBe(true);
  });

  it("Altaria NO tiene ventaja contra Azumarill (nada supereefectivo, rating bajo)", () => {
    const altaria = getPokemon("altaria")!;
    const azumarill = getPokemon("azumarill")!;
    const result = matchupAdvantage(altaria, azumarill, "great");
    expect(result.maxMult).toBeLessThan(1.6);
    expect(result.advantage).toBe(false);
  });
});

describe("relevantAttackTypes", () => {
  it("junta los tipos de ataque de todo el equipo, ignorando huecos vacíos", () => {
    const azumarill = getPokemon("azumarill")!;
    const medicham = getPokemon("medicham")!;
    const types = relevantAttackTypes([azumarill, null, medicham], "great");
    // Azumarill: bubble(water)/ice_beam(ice)/play_rough(fairy); Medicham: psycho_cut(psychic)/ice_punch(ice)/dynamic_punch(fighting)
    expect(types.has("ice")).toBe(true);
    expect(types.has("fairy")).toBe(true);
    expect(types.has("fighting")).toBe(true);
  });
});
