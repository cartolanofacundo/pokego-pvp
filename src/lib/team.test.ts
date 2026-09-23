import { describe, it, expect } from "vitest";
import { getPokemon } from "./data";
import { rankTeamAgainst } from "./team";

describe("rankTeamAgainst (con datos reales de PvPoke, Ultra League)", () => {
  const lapras = getPokemon("lapras")!;
  const annihilape = getPokemon("annihilape")!;
  const skarmory = getPokemon("skarmory")!;
  const altaria = getPokemon("altaria")!;
  const melmetal = getPokemon("melmetal")!;
  const team = [lapras, annihilape, skarmory];

  it("recomienda a Lapras primero contra Altaria (Ice Beam x2.56)", () => {
    const ranked = rankTeamAgainst(team, altaria, "ultra");
    const bySpecies = Object.fromEntries(ranked.map((r) => [r!.speciesId, r!]));

    expect(bySpecies.lapras.label).toBe("best");
    expect(bySpecies.lapras.bestAttack).toBe("Ice Beam");
    // Lapras debe tener el mayor puntaje total del equipo.
    const top = [...ranked].sort((a, b) => b!.total - a!.total)[0];
    expect(top!.speciesId).toBe("lapras");
  });

  it("recomienda a Skarmory primero contra Melmetal (Drill Run, tierra x1.6 vs acero) y deja a Lapras al final", () => {
    const ranked = rankTeamAgainst(team, melmetal, "ultra");
    const bySpecies = Object.fromEntries(ranked.map((r) => [r!.speciesId, r!]));

    expect(bySpecies.skarmory.label).toBe("best");
    expect(bySpecies.skarmory.bestAttack).toBe("Drill Run");

    const sorted = [...ranked].sort((a, b) => b!.total - a!.total);
    expect(sorted[0]!.speciesId).toBe("skarmory");
    expect(sorted[sorted.length - 1]!.speciesId).toBe("lapras");
  });
});
