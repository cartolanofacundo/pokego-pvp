import { describe, it, expect } from "vitest";
import { getPokemon } from "./data";
import { rankTeamAgainst } from "./team";

describe("rankTeamAgainst (con datos reales de PvPoke)", () => {
  const azumarill = getPokemon("azumarill")!;
  const medicham = getPokemon("medicham")!;
  const skarmory = getPokemon("skarmory")!;
  const altaria = getPokemon("altaria")!;
  const melmetal = getPokemon("melmetal")!;
  const team = [azumarill, medicham, skarmory];

  it("recomienda a Azumarill primero contra Altaria (Ice Beam x2.56)", () => {
    const ranked = rankTeamAgainst(team, altaria, "great");
    const bySpecies = Object.fromEntries(ranked.map((r) => [r!.speciesId, r!]));

    expect(bySpecies.azumarill.label).toBe("best");
    expect(bySpecies.azumarill.bestAttack).toBe("Ice Beam");
    // Azumarill debe tener el mayor puntaje total del equipo.
    const top = [...ranked].sort((a, b) => b!.total - a!.total)[0];
    expect(top!.speciesId).toBe("azumarill");
  });

  it("recomienda a Medicham primero contra Melmetal (lucha x1.6 vs acero) y dice Azumarill al final", () => {
    const ranked = rankTeamAgainst(team, melmetal, "great");
    const bySpecies = Object.fromEntries(ranked.map((r) => [r!.speciesId, r!]));

    expect(bySpecies.medicham.label).toBe("best");
    expect(bySpecies.medicham.bestAttack).toBe("Dynamic Punch");

    const sorted = [...ranked].sort((a, b) => b!.total - a!.total);
    expect(sorted[0]!.speciesId).toBe("medicham");
    expect(sorted[sorted.length - 1]!.speciesId).toBe("azumarill");
  });
});
