import { describe, it, expect } from "vitest";
import { getSpecies, searchSpecies } from "./data";
import { cpAt, levelsForCp } from "./cp";
import { rankOf } from "./ivrank";
import { formatRaw, allReadings, resolveEntry, normalizeRaw } from "./parse";
import { levelCost, evolveCost, thirdMoveCost } from "./costs";
import { analyzeEntry, dexRows, targetsOf, type BoxEntry } from "./analysis";

const sp = (id: string) => getSpecies(id)!;
const S50 = { maxLevel: 50, minIv: 0 };
const S40 = { maxLevel: 40, minIv: 0 };

// Números de referencia leídos del Rank Checker de Stadium Gaming.
describe("rango de IV (igual que Stadium Gaming)", () => {
  it("Snover 10/10/10 con nivel máximo 40", () => {
    const iv = { atk: 10, def: 10, sta: 10 };
    const snover = rankOf(sp("snover"), iv, 1500, S40)!;
    expect(snover.rank).toBe(740);
    expect(snover.cp).toBe(1075);
    expect(snover.level).toBe(40);
    const aboGreat = rankOf(sp("abomasnow"), iv, 1500, S40)!;
    expect(aboGreat.rank).toBe(2775);
    expect(aboGreat.cp).toBe(1473);
    expect(aboGreat.level).toBe(23);
    expect(rankOf(sp("abomasnow"), iv, 2500, S40)!.rank).toBe(741);
  });

  it("Snivy 0/13/13 y sus evoluciones con nivel máximo 50", () => {
    const iv = { atk: 0, def: 13, sta: 13 };
    const snivy = rankOf(sp("snivy"), iv, 1500, S50)!;
    expect([snivy.rank, snivy.cp, snivy.level]).toEqual([1881, 808, 50]);
    const servine = rankOf(sp("servine"), iv, 1500, S50)!;
    expect([servine.rank, servine.cp, servine.level]).toEqual([1157, 1434, 50]);
    expect(rankOf(sp("servine"), iv, 2500, S50)!.rank).toBe(1737);
    const serpGreat = rankOf(sp("serperior"), iv, 1500, S50)!;
    expect([serpGreat.rank, serpGreat.cp, serpGreat.level]).toEqual([445, 1473, 25]);
    const serpUltra = rankOf(sp("serperior"), iv, 2500, S50)!;
    expect([serpUltra.rank, serpUltra.cp, serpUltra.level]).toEqual([1591, 2332, 50]);
  });

  it("en Master League gana el 15/15/15, al nivel máximo", () => {
    const r = rankOf(sp("mewtwo"), { atk: 15, def: 15, sta: 15 }, Infinity, S50)!;
    expect([r.rank, r.level]).toEqual([1, 50]);
  });

  it("el IV mínimo achica el universo de combinaciones", () => {
    const r = rankOf(sp("snivy"), { atk: 10, def: 10, sta: 10 }, 1500, { maxLevel: 50, minIv: 10 })!;
    expect(r.rank).toBeLessThanOrEqual(216); // 6 × 6 × 6
  });
});

describe("CP y nivel", () => {
  it("Snivy 0/13/13 con 139 de CP está en nivel 7", () => {
    const iv = { atk: 0, def: 13, sta: 13 };
    expect(cpAt(sp("snivy"), iv, 7)).toBe(139);
    expect(levelsForCp(sp("snivy"), iv, 139)).toEqual([7]);
  });
});

describe("carga rápida de IV y CP", () => {
  it("pone las comas y el guion solos", () => {
    expect(formatRaw("101313549")).toBe("10,13,13-549");
    expect(formatRaw("01313808")).toBe("0,13,13-808");
    expect(formatRaw("1")).toBe("1");
    expect(formatRaw("10")).toBe("10,");
    expect(formatRaw("1013")).toBe("10,13,");
    expect(formatRaw("101313")).toBe("10,13,13-");
    expect(formatRaw("")).toBe("");
  });

  it("una coma tipeada fuerza el corte y cualquier separador cuenta como coma", () => {
    expect(normalizeRaw("1/13 13-139")).toBe("1,13,13,139");
    expect(formatRaw("1,13,13139")).toBe("1,13,13-139");
    // La coma fija el primer IV en 1; el resto admite varias lecturas y el CP decide.
    const readings = allReadings("1,13,13139");
    expect(readings.every((r) => r.atk === 1)).toBe(true);
    expect(readings).toContainEqual({ atk: 1, def: 13, sta: 13, cp: 139 });
  });

  it("resuelve con el CP cuál lectura es la real", () => {
    const r = resolveEntry("01313139", sp("snivy"));
    expect(r.kind).toBe("ok");
    if (r.kind === "ok") expect(r.reading).toEqual({ atk: 0, def: 13, sta: 13, cp: 139, level: 7 });
  });

  it("avisa si falta tipear algo o si el CP no existe", () => {
    expect(resolveEntry("1013", sp("snivy")).kind).toBe("incomplete");
    expect(resolveEntry("1515159999", sp("snivy")).kind).toBe("error");
  });
});

describe("costos (iguales a los de Stadium para Snivy 0/13/13 en nivel 7)", () => {
  it("subir del 7 al 25 cuesta 72 caramelos y 71.200 de polvo", () => {
    expect(levelCost(7, 25, false, 50)).toEqual({ candy: 72, xl: 0, dust: 71200, needsBuddy: false });
  });

  it("subir del 7 al 50 cuesta 292 caramelos, 296 XL y 515.200 de polvo", () => {
    expect(levelCost(7, 50, false, 50)).toEqual({ candy: 292, xl: 296, dust: 515200, needsBuddy: false });
  });

  it("el nivel 51 pide mejor amigo y la Shadow paga 1.2 veces", () => {
    expect(levelCost(49, 51, false, 51).needsBuddy).toBe(true);
    const shadow = levelCost(7, 25, true, 50);
    expect(shadow.dust).toBe(Math.ceil(71200 * 1.2));
    expect(shadow.candy).toBeGreaterThan(72);
  });

  it("evolucionar Snivy a Serperior cuesta 125 caramelos; el segundo cargado, 25 y 10.000", () => {
    expect(evolveCost(["snivy", "servine", "serperior"])).toBe(125);
    expect(thirdMoveCost(sp("serperior"), false)).toEqual({ candy: 25, dust: 10000 });
  });
});

describe("formas y pokédex", () => {
  it("Snover llega a Abomasnow y a Mega Abomasnow; una Shadow no megaevoluciona", () => {
    expect(targetsOf(sp("snover")).map((t) => t.species.id)).toEqual(["snover", "abomasnow", "abomasnow_mega"]);
    expect(targetsOf(sp("snover_shadow")).some((t) => t.isMega)).toBe(false);
  });

  const entry = (speciesId: string, atk: number, def: number, sta: number, cp: number): BoxEntry => ({
    id: `${speciesId}-${atk}${def}${sta}`, speciesId, atk, def, sta, cp,
    level: levelsForCp(sp(speciesId), { atk, def, sta }, cp)[0], addedAt: 0,
  });

  it("el detalle tiene una fila por forma y una columna por tope de CP", () => {
    const res = analyzeEntry(entry("snivy", 0, 13, 13, 139), S50);
    expect(res.map((r) => r.target.species.id)).toEqual(["snivy", "servine", "serperior"]);
    expect(res[2].cells.map((c) => c.league.key)).toEqual(["little", "great", "ultra", "master"]);
    expect(res[2].cells[1].row!.rank).toBe(445);
  });

  it("la pokédex solo deja rangos de 100 o mejor, y las Megas solo en ligas Mega", () => {
    // Snover 0/15/15: rango 1 como Abomasnow en Great League (según el orden por producto).
    const good = entry("snover", 0, 15, 15, cpAt(sp("snover"), { atk: 0, def: 15, sta: 15 }, 10));
    const bad = entry("snivy", 0, 13, 13, 139);
    const great = dexRows([good, bad], "great", S50);
    expect(great.every((r) => r.cell.row!.rank <= 100)).toBe(true);
    expect(great.some((r) => r.entry.speciesId === "snivy")).toBe(false);
    expect(great.some((r) => r.target.isMega)).toBe(false);
    expect(dexRows([good], "megagreat", S50).length).toBeGreaterThanOrEqual(great.filter((r) => r.entry === good).length);
  });
});

describe("búsqueda de especies", () => {
  it("busca por nombre y por número de pokédex", () => {
    expect(searchSpecies("snivy")[0].id).toBe("snivy");
    expect(searchSpecies("495")[0].id).toBe("snivy");
  });
});
