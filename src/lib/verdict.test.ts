import { describe, it, expect } from "vitest";
import { getPokemon } from "./data";
import { verdict } from "./verdict";
import { weaknessesTop3 } from "./weakness";

describe("verdict (semáforo de banca, con datos reales de PvPoke)", () => {
  const azumarill = getPokemon("azumarill")!;
  const altaria = getPokemon("altaria")!;
  const melmetal = getPokemon("melmetal")!;
  const skarmory = getPokemon("skarmory")!;

  it("usa el rating de PvPoke cuando el par está rankeado", () => {
    // Azumarill tiene a Altaria en sus matchups (646) y a Melmetal en sus counters (321).
    expect(verdict(azumarill, altaria, "great")).toBe("win");
    expect(verdict(azumarill, melmetal, "great")).toBe("lose");
    // Skarmory vs Melmetal: counter con rating 157.
    expect(verdict(skarmory, melmetal, "great")).toBe("lose");
  });

  it("cae a la heurística de tipos cuando PvPoke no rankea el par", () => {
    // Melmetal no aparece en el ranking de Skarmory ni al revés en Master League.
    // Skarmory (acero/volador) recibe Thunder Shock x2.56; sus voladores pegan x1 a Melmetal.
    const r = verdict(skarmory, melmetal, "master");
    expect(["lose", "even"]).toContain(r);
  });
});

describe("weaknessesTop3", () => {
  it("ordena por multiplicador y después alfabéticamente en español, máximo tres", () => {
    // Melmetal (acero): fuego, lucha, tierra
    expect(weaknessesTop3(["steel", "none"])).toEqual(["fire", "fighting", "ground"]);
    // Azumarill (agua/hada): eléctrico, planta, veneno
    expect(weaknessesTop3(["water", "fairy"])).toEqual(["electric", "grass", "poison"]);
    // Altaria (dragón/volador): hielo x2.56 primero, después dragón, hada, roca (solo entran tres)
    expect(weaknessesTop3(["dragon", "flying"])).toEqual(["ice", "dragon", "fairy"]);
  });
});
