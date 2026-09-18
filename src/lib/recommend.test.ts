import { describe, it, expect } from "vitest";
import { getPokemon } from "./data";
import { analyzeMoveset, effectTier, formatMult } from "./recommend";

describe("effectTier", () => {
  it("distingue los 5 multiplicadores discretos posibles", () => {
    expect(effectTier(2.56)).toBe("double-super");
    expect(effectTier(1.6)).toBe("super");
    expect(effectTier(1)).toBe("neutral");
    expect(effectTier(0.625)).toBe("resisted");
    expect(effectTier(0.390625)).toBe("double-resisted");
  });
});

describe("formatMult", () => {
  it("formatea los 5 multiplicadores, incluso con ruido de punto flotante (1.6*1.6)", () => {
    expect(formatMult(1.6 * 1.6)).toBe("×2.56"); // 2.5600000000000005 en JS
    expect(formatMult(1.6)).toBe("×1.6");
    expect(formatMult(1)).toBe("×1");
    expect(formatMult(0.625)).toBe("×0.63");
    expect(formatMult(0.390625)).toBe("×0.39");
    expect(formatMult(0.625 * 0.390625)).toBe("×0.24");
  });
});

describe("analyzeMoveset (con datos reales de PvPoke)", () => {
  it("recomienda Ice Beam sobre Play Rough para Azumarill vs Altaria en Great League", () => {
    const azumarill = getPokemon("azumarill")!;
    const altaria = getPokemon("altaria")!;
    expect(azumarill).toBeDefined();
    expect(altaria).toBeDefined();

    const analysis = analyzeMoveset(azumarill, altaria, "great");
    expect(analysis.best?.moveId).toBe("ICE_BEAM");

    const playRough = analysis.charged.find((m) => m.moveId === "PLAY_ROUGH");
    expect(playRough?.tier).toBe("super"); // x1.6 (fairy vs dragón/volador)

    const iceBeam = analysis.charged.find((m) => m.moveId === "ICE_BEAM");
    expect(iceBeam?.tier).toBe("double-super"); // x2.56 (hielo vs dragón/volador)
    expect(iceBeam!.score).toBeGreaterThan(playRough!.score);
  });

  it("dentro del moveset recomendado, prefiere Double Iron Bash (STAB neutral) sobre Dynamic Punch (resistido)", () => {
    const melmetal = getPokemon("melmetal")!;
    const altaria = getPokemon("altaria")!;

    const analysis = analyzeMoveset(melmetal, altaria, "great");
    expect(analysis.best?.moveId).toBe("DOUBLE_IRON_BASH");

    const dynamicPunch = analysis.charged.find((m) => m.moveId === "DYNAMIC_PUNCH");
    expect(dynamicPunch?.tier).toBe("resisted"); // lucha x0.625 vs volador
  });

  it("Rock Slide (fuera del moveset recomendado) pegaría más fuerte que Double Iron Bash pese a no tener STAB", () => {
    const melmetal = getPokemon("melmetal")!;
    const altaria = getPokemon("altaria")!;

    const analysis = analyzeMoveset(melmetal, altaria, "great");
    const dib = analysis.charged.find((m) => m.moveId === "DOUBLE_IRON_BASH")!;
    const rockSlide = analysis.otherCharged.find((m) => m.moveId === "ROCK_SLIDE")!;

    expect(dib.isStab).toBe(true);
    expect(rockSlide.isStab).toBe(false);
    expect(rockSlide.tier).toBe("super"); // roca x1.6 vs volador
    expect(rockSlide.score).toBeGreaterThan(dib.score);
  });
});
