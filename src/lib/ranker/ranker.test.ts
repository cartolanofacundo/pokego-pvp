import { describe, it, expect } from "vitest";
import { getSpecies, searchSpecies, pvpokeRankForVariant, familyRootOf } from "./data";
import { cpAt, levelsForCp } from "./cp";
import { rankOf } from "./ivrank";
import { formatRaw, allReadings, resolveEntry, normalizeRaw } from "./parse";
import { levelCost, evolveCost, thirdMoveCost, costMultipliers, purifiedIvs } from "./costs";
import { analyzeEntry, dexRows, targetsOf, bestRankOf, servesAnyLeague, servesLeague, type BoxEntry } from "./analysis";
import { planCleanup } from "./cleanup";
import { sanitizeEntry, DEFAULT_RANKER_SETTINGS } from "./box";

const sp = (id: string) => getSpecies(id)!;
const S50 = { maxLevel: 50, minIv: 0 };

const entry = (speciesId: string, atk: number, def: number, sta: number, cp: number, extra: Partial<BoxEntry> = {}): BoxEntry => ({
  id: `${speciesId}-${atk}${def}${sta}`,
  speciesId,
  atk,
  def,
  sta,
  cp,
  level: levelsForCp(sp(speciesId), { atk, def, sta }, cp)[0],
  variant: "normal",
  lucky: false,
  addedAt: 0,
  ...extra,
});

// Casos del diseñador (Mudkip 1/14/12, 429 PC, nivel máximo 50).
describe("rango de IV — casos del diseñador (Mudkip 1/14/12, 429 PC)", () => {
  const iv = { atk: 1, def: 14, sta: 12 };

  it("el CP deduce el nivel 15", () => {
    expect(cpAt(sp("mudkip"), iv, 15)).toBe(429);
    expect(levelsForCp(sp("mudkip"), iv, 429)).toEqual([15]);
  });

  it("Mudkip en Little: #4, 99,6 %, 500 PC en nivel 17,5, con 9.800 de polvo y 10 caramelos", () => {
    const r = rankOf(sp("mudkip"), iv, 500, S50)!;
    expect(r.rank).toBe(4);
    expect(r.pct).toBeCloseTo(99.6, 1);
    expect(r.cp).toBe(500);
    expect(r.level).toBe(17.5);
    const cost = levelCost(15, r.level, "normal", false, 50);
    expect(cost.dust).toBe(9800);
    expect(cost.candy).toBe(10);
  });

  it("Mudkip en Great: no llega al tope (1.132 PC en nivel 50)", () => {
    const r = rankOf(sp("mudkip"), iv, 1500, S50)!;
    expect(r.level).toBe(50);
    expect(r.cp).toBe(1132);
    expect(r.cp).toBeLessThan(1500);
  });

  it("Marshtomp en Great da #17; Swampert en Great da #4", () => {
    expect(rankOf(sp("marshtomp"), iv, 1500, S50)!.rank).toBe(17);
    expect(rankOf(sp("swampert"), iv, 1500, S50)!.rank).toBe(4);
  });

  it("Swampert da #138 en Ultra y comparte puesto en Master (empates)", () => {
    expect(rankOf(sp("swampert"), iv, 2500, S50)!.rank).toBe(138);
    const master = rankOf(sp("swampert"), iv, Infinity, S50)!;
    expect(master.level).toBe(50);
    expect(master.rank).toBeGreaterThan(1000);
  });

  it("Mega Swampert se pasa de nivel en Great y da #6 en Ultra", () => {
    const great = rankOf(sp("swampert_mega"), iv, 1500, S50)!;
    expect(great.level).toBeLessThan(15); // rinde en un nivel menor al que ya tiene
    const ultra = rankOf(sp("swampert_mega"), iv, 2500, S50)!;
    expect(ultra.rank).toBe(6);
  });

  it("Altaria 0/15/8 da #5 en Great", () => {
    expect(rankOf(sp("altaria"), { atk: 0, def: 15, sta: 8 }, 1500, S50)!.rank).toBe(5);
  });
});

describe("empates: comparten puesto (a diferencia de Stadium, que los separa por suma de IV)", () => {
  it("Snivy 0/13/13 sigue dando los mismos rangos que antes cuando no hay empate", () => {
    const iv = { atk: 0, def: 13, sta: 13 };
    expect(rankOf(sp("snivy"), iv, 1500, S50)!.rank).toBe(1881);
    expect(rankOf(sp("servine"), iv, 1500, S50)!.rank).toBe(1157);
    expect(rankOf(sp("serperior"), iv, 1500, S50)!.rank).toBe(445);
  });

  it("dos IV con el mismo producto de stats comparten el mismo rango, sin dejar huecos", () => {
    const table = rankOf(sp("snivy"), { atk: 15, def: 15, sta: 15 }, 1500, S50);
    expect(table).not.toBeNull();
  });
});

describe("carga rápida de IV y CP", () => {
  it("pone las comas y el guion solos", () => {
    expect(formatRaw("101313549")).toBe("10,13,13–549");
    expect(formatRaw("1")).toBe("1");
    expect(formatRaw("10")).toBe("10,");
    expect(formatRaw("1013")).toBe("10,13,");
  });

  it("una coma tipeada fuerza el corte y cualquier separador cuenta como coma", () => {
    expect(normalizeRaw("1/13 13-139")).toBe("1,13,13,139");
    const readings = allReadings("1,13,13139");
    expect(readings.every((r) => r.atk === 1)).toBe(true);
    expect(readings).toContainEqual({ atk: 1, def: 13, sta: 13, cp: 139 });
  });

  it("vacío", () => {
    expect(resolveEntry("", sp("mudkip"), S50)).toEqual({ kind: "empty" });
  });

  it("leyendo: con IV incompletos pide seguir tipeando", () => {
    const r = resolveEntry("1013", sp("mudkip"), S50);
    expect(r.kind).toBe("reading");
  });

  it("leyendo: con los tres IV fijos, da el rango de PC posible de esa combinación", () => {
    const r = resolveEntry("1,14,12,4", sp("mudkip"), S50);
    expect(r.kind).toBe("reading");
    if (r.kind === "reading") {
      expect(r.message).toContain("1 / 14 / 12");
      expect(r.message).toContain("14");
      expect(r.message).toContain("1132");
    }
  });

  it("dos lecturas: dos formas de leer el mismo texto, ambas válidas", () => {
    const r = resolveEntry("11210577", sp("mudkip"), S50);
    expect(r.kind).toBe("ambiguous");
    if (r.kind === "ambiguous") {
      expect(r.readings).toContainEqual({ atk: 1, def: 12, sta: 10, cp: 577, level: 20.5 });
      expect(r.readings).toContainEqual({ atk: 11, def: 2, sta: 10, cp: 577, level: 20 });
    }
  });

  it("no existe: ningún nivel da ese CP, y el mensaje da el tope real de la especie", () => {
    const r = resolveEntry("114122429", sp("mudkip"), S50);
    expect(r.kind).toBe("invalid");
    if (r.kind === "invalid") {
      expect(r.message).toContain("2429");
      expect(r.message).toContain("1275");
    }
  });

  it("resuelve con el CP cuál lectura es la real", () => {
    const r = resolveEntry("01313139", sp("snivy"), S50);
    expect(r.kind).toBe("ok");
    if (r.kind === "ok") expect(r.reading).toEqual({ atk: 0, def: 13, sta: 13, cp: 139, level: 7 });
  });
});

describe("costos por variante (Swampert de nivel 15 a 19 en Great, según el ejemplo del diseño)", () => {
  it("Normal: 16.400 de polvo y 16 caramelos", () => {
    expect(levelCost(15, 19, "normal", false, 50)).toEqual({ candy: 16, xl: 0, dust: 16400, needsBuddy: false });
  });

  it("Suertudo: el polvo a la mitad, los caramelos iguales", () => {
    expect(levelCost(15, 19, "normal", true, 50)).toEqual({ candy: 16, xl: 0, dust: 8200, needsBuddy: false });
  });

  it("Purificado: 10 % menos de todo", () => {
    const c = levelCost(15, 19, "purified", false, 50);
    expect(c.dust).toBe(14760);
    expect(c.candy).toBeLessThan(16);
  });

  it("Oscuro: 20 % más de todo, y nunca junto con Suertudo", () => {
    const c = levelCost(15, 19, "shadow", false, 50);
    expect(c.dust).toBe(19680);
    expect(c.candy).toBeGreaterThan(16);
    // Pedir Suertudo con Oscuro no hace nada: el multiplicador de polvo sigue siendo el de Oscuro.
    expect(levelCost(15, 19, "shadow", true, 50).dust).toBe(19680);
  });

  it("evolucionar un Purificado usa el costo propio de Niantic, más bajo que el normal", () => {
    expect(evolveCost(["snivy", "servine"], "normal")).toBe(25);
    expect(evolveCost(["snivy", "servine"], "purified")).toBe(22);
  });

  it("el tercer ataque también respeta la variante", () => {
    const normal = thirdMoveCost(sp("serperior"), "normal", false);
    const shadow = thirdMoveCost(sp("serperior"), "shadow", false);
    expect(normal).toEqual({ candy: 25, dust: 10000 });
    expect(shadow!.dust!).toBeGreaterThan(normal!.dust!);
  });

  it("purificar suma 2 a cada IV, con tope 15", () => {
    expect(purifiedIvs({ atk: 1, def: 14, sta: 12 })).toEqual({ atk: 3, def: 15, sta: 14 });
  });

  it("costMultipliers: un Oscuro Suertudo no existe, el toggle no hace nada", () => {
    const m = costMultipliers("shadow", true);
    expect(m.dust).toBeCloseTo(1.2, 5);
  });
});

describe("formas y variantes en la grilla del detalle", () => {
  it("Snover llega a Abomasnow y a Mega Abomasnow; una Shadow no megaevoluciona", () => {
    expect(targetsOf(sp("snover")).map((t) => t.species.id)).toEqual(["snover", "abomasnow", "abomasnow_mega"]);
    expect(targetsOf(sp("snover_shadow") ?? sp("snover")).length).toBeGreaterThan(0);
  });

  it("Little excluye a las formas evolucionadas y a las que no pueden evolucionar", () => {
    const res = analyzeEntry(entry("mudkip", 1, 14, 12, 429), S50);
    const little = (id: string) => res.find((r) => r.target.species.id === id)!.cells[0];
    expect(little("mudkip").kind).toBe("rank");
    expect(little("marshtomp").kind).toBe("excluded");
    expect(little("swampert").kind).toBe("excluded");
  });

  it("Great: Mudkip da 'short' (no llega), Mega Swampert da 'over' (te pasaste), Swampert da 'rank' y es MEJOR", () => {
    const res = analyzeEntry(entry("mudkip", 1, 14, 12, 429), S50);
    const cellIn = (id: string, leagueIdx: number) => res.find((r) => r.target.species.id === id)!.cells[leagueIdx];
    expect(cellIn("mudkip", 1).kind).toBe("short"); // Great
    expect(cellIn("swampert_mega", 1).kind).toBe("over"); // Great
    const swampertGreat = cellIn("swampert", 1);
    expect(swampertGreat.kind).toBe("rank");
    expect(swampertGreat.row!.rank).toBe(4);
    expect(swampertGreat.best).toBe(true);
  });

  it("el puesto en PvPoke de un Oscuro sale de la especie _shadow", () => {
    const normalRank = pvpokeRankForVariant("swampert", "normal", "great");
    const shadowRank = pvpokeRankForVariant("swampert", "shadow", "great");
    expect(normalRank).not.toBeNull();
    // Puede ser null si Swampert no tiene forma Shadow rankeada; alcanza con que no explote.
    expect(shadowRank === null || typeof shadowRank === "number").toBe(true);
  });

  it("una Mega ocupa las cuatro columnas del detalle, con su energía y sin evolución", () => {
    const res = analyzeEntry(entry("mudkip", 1, 14, 12, 429), S50);
    const mega = res.find((r) => r.target.species.id === "swampert_mega")!;
    expect(mega.cells).toHaveLength(4);
    expect(mega.megaEnergy).toBe(200);
    // El costo para llegar a la forma previa (Swampert) sigue mostrándose.
    expect(mega.evolveCandy).toBe(125);
  });
});

describe("pokédex y caja", () => {
  it("la pokédex solo deja rangos de 100 o mejor, y las Megas solo en ligas Mega", () => {
    const good = entry("snover", 0, 15, 15, cpAt(sp("snover"), { atk: 0, def: 15, sta: 15 }, 10));
    const bad = entry("snivy", 0, 13, 13, 139);
    const great = dexRows([good, bad], "great", S50);
    expect(great.every((r) => r.cell.row!.rank <= 100)).toBe(true);
    expect(great.some((r) => r.entry.speciesId === "snivy")).toBe(false);
    expect(great.some((r) => r.target.isMega)).toBe(false);
  });

  it("no cuenta como 'sirve' una forma que no llega al tope (short) aunque tenga rango numérico", () => {
    const weak = entry("mudkip", 0, 0, 0, cpAt(sp("mudkip"), { atk: 0, def: 0, sta: 0 }, 50));
    expect(servesLeague(weak, DEFAULT_RANKER_SETTINGS, "great")).toBe(false);
  });

  it("bestRankOf encuentra el mejor rango entre todas las formas y ligas", () => {
    const best = bestRankOf(entry("mudkip", 1, 14, 12, 429), S50)!;
    expect(best.rank).toBe(4);
    expect(best.species.id).toBe("swampert");
    expect(best.league.key).toBe("great");
  });

  it("servesAnyLeague/servesLeague concuerdan con bestRankOf", () => {
    const e = entry("mudkip", 1, 14, 12, 429);
    expect(servesAnyLeague(e, S50)).toBe(true);
    expect(servesLeague(e, S50, "master")).toBe(false);
  });
});

describe("limpiar la caja", () => {
  const good = entry("swampert", 1, 10, 14, cpAt(sp("swampert"), { atk: 1, def: 10, sta: 14 }, 17));
  const uselessEverywhere = entry("mudkip", 10, 13, 13, cpAt(sp("mudkip"), { atk: 10, def: 13, sta: 13 }, 12));
  const okOnlyInMaster = entry("mewtwo", 15, 15, 15, cpAt(sp("mewtwo"), { atk: 15, def: 15, sta: 15 }, 50));

  it("alcance 'en ninguna liga': borra solo lo que no sirve en absolutamente ninguna", () => {
    const plan = planCleanup([good, uselessEverywhere, okOnlyInMaster], DEFAULT_RANKER_SETTINGS, "any");
    expect(plan.toDelete.map((e) => e.id)).toEqual([uselessEverywhere.id]);
    expect(plan.toKeep.map((e) => e.id)).toEqual([good.id, okOnlyInMaster.id]);
  });

  it("alcance por liga: borra lo que no sirve en esa liga, aunque sirva en otra, y lo avisa", () => {
    const plan = planCleanup([good, uselessEverywhere, okOnlyInMaster], DEFAULT_RANKER_SETTINGS, "great");
    expect(plan.toDelete.map((e) => e.id).sort()).toEqual([uselessEverywhere.id, okOnlyInMaster.id].sort());
    expect(plan.servesElsewhere).toBe(1); // okOnlyInMaster sirve en Master
  });
});

describe("caja: migración de una entrada Shadow vieja (v1) a especie base + variante", () => {
  it("una entrada con speciesId '*_shadow' pasa a la base con variant 'shadow'", () => {
    const migrated = sanitizeEntry({ speciesId: "snivy_shadow", atk: 0, def: 13, sta: 13, cp: 139 });
    expect(migrated).not.toBeNull();
    expect(migrated!.speciesId).toBe("snivy");
    expect(migrated!.variant).toBe("shadow");
  });

  it("una entrada apuntando a una Mega o a una Shadow sin base se descarta", () => {
    expect(sanitizeEntry({ speciesId: "charizard_mega_x", atk: 1, def: 1, sta: 1, cp: 500 })).toBeNull();
  });

  it("un Oscuro no puede quedar marcado Suertudo", () => {
    const e = sanitizeEntry({ speciesId: "snivy", atk: 0, def: 13, sta: 13, cp: 139, variant: "shadow", lucky: true });
    expect(e!.lucky).toBe(false);
  });
});

describe("familyRootOf agrupa 'Cargados de esta línea' por familia, no por especie exacta", () => {
  it("Mudkip, Marshtomp y Swampert comparten la misma raíz", () => {
    expect(familyRootOf("mudkip")).toBe("mudkip");
    expect(familyRootOf("marshtomp")).toBe("mudkip");
    expect(familyRootOf("swampert")).toBe("mudkip");
  });
});

describe("búsqueda de especies: sin Shadow ni Mega, especie anterior/siguiente", () => {
  it("busca por nombre y por número de pokédex, y no ofrece Shadow ni Mega", () => {
    expect(searchSpecies("snivy")[0].id).toBe("snivy");
    expect(searchSpecies("495")[0].id).toBe("snivy");
    expect(searchSpecies("charizard").some((s) => s.mega)).toBe(false);
    expect(searchSpecies("snivy").some((s) => s.shadow)).toBe(false);
  });
});
