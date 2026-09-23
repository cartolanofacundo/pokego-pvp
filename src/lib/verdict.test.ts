import { describe, it, expect } from "vitest";
import { getPokemon } from "./data";
import { verdict } from "./verdict";
import { weaknessesTop3 } from "./weakness";

describe("verdict (semáforo de banca, con datos reales de PvPoke)", () => {
  const lapras = getPokemon("lapras")!;
  const feraligatr = getPokemon("feraligatr")!;
  const melmetal = getPokemon("melmetal")!;
  const skarmory = getPokemon("skarmory")!;
  const annihilape = getPokemon("annihilape")!;
  const tinkaton = getPokemon("tinkaton")!;

  it("usa el rating de PvPoke cuando el par está rankeado", () => {
    // En Ultra League, Lapras tiene a Feraligatr en sus matchups (610) y a Melmetal en sus counters (315).
    expect(verdict(lapras, feraligatr, "ultra")).toBe("win");
    expect(verdict(lapras, melmetal, "ultra")).toBe("lose");
    // Annihilape vs Tinkaton: counter con rating 306.
    expect(verdict(annihilape, tinkaton, "ultra")).toBe("lose");
  });

  it("cae a la heurística de tipos cuando PvPoke no rankea el par", () => {
    // Melmetal no aparece en el ranking de Skarmory ni al revés en Ultra League.
    // Skarmory (acero/volador) recibe Thunder Shock x1.6; sus voladores pegan x1 a Melmetal.
    const r = verdict(skarmory, melmetal, "ultra");
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
