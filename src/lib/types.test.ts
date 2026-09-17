import { describe, it, expect } from "vitest";
import { effectiveness } from "./types";

describe("effectiveness", () => {
  it("dobla el multiplicador cuando ambos tipos del defensor son débiles", () => {
    expect(effectiveness("ice", ["dragon", "flying"])).toBeCloseTo(2.56, 5);
  });

  it("dobla la resistencia cuando ambos tipos resisten", () => {
    expect(effectiveness("electric", ["ground", null])).toBeCloseTo(0.390625, 6);
  });

  it("es neutral cuando no hay relación especial", () => {
    expect(effectiveness("normal", ["fire", null])).toBeCloseTo(1, 5);
  });

  it("combina un tipo fuerte y uno resistido", () => {
    // Fuego vs planta (x1.6) y roca (x0.625) => x1
    expect(effectiveness("fire", ["grass", "rock"])).toBeCloseTo(1, 5);
  });
});
