// Datos del rankeador de IV. Se corre a mano con `npm run build-ranker-data`.
// No se ejecuta en runtime.
//
// Fuentes:
//   - PvPoke gamemaster (MIT): especies lanzadas, estadísticas base, tipos,
//     familias y evoluciones, marca de Mega/Primal.
//   - PvPoke rankings: el puesto de cada especie en las siete ligas del
//     rankeador (Little, Great, Ultra, Master y las tres Mega).
//   - Game master de Niantic publicado por PokeMiners: caramelos por
//     evolución, costo del segundo ataque cargado, tabla de subida de nivel
//     (caramelos, caramelos XL, polvo) y multiplicadores de CP.
//
// Salida: src/data/ranker/species.json, ranks.json y costs.json.

import { writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "..", "src", "data", "ranker");

const PVPOKE = "https://raw.githubusercontent.com/pvpoke/pvpoke/master/src/data";
const NIANTIC_GM = "https://raw.githubusercontent.com/PokeMiners/game_masters/master/latest/latest.json";

// Las siete ligas del rankeador. `cap` es el tope de CP que define el rango
// de IV; `cup` es la copa de PvPoke de donde sale el puesto de la especie.
const LEAGUES = [
  { key: "little", cup: "all", cp: 500 },
  { key: "great", cup: "all", cp: 1500 },
  { key: "ultra", cup: "all", cp: 2500 },
  { key: "master", cup: "all", cp: 10000 },
  { key: "megagreat", cup: "mega", cp: 1500 },
  { key: "megaultra", cup: "mega", cp: 2500 },
  { key: "megamaster", cup: "mega", cp: 10000 },
];

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fetch failed ${res.status} for ${url}`);
  return res.json();
}

const isMegaTag = (p) => (p.tags ?? []).includes("mega");

/** Índice del game master de Niantic: dex -> ajustes de cada forma. */
function indexNiantic(gm) {
  const byDex = new Map();
  const dexOfPokemonId = new Map();
  for (const e of gm) {
    const s = e.data?.pokemonSettings;
    if (!s) continue;
    const m = /^V(\d{4})_POKEMON_/.exec(e.templateId);
    if (!m) continue;
    const dex = Number(m[1]);
    dexOfPokemonId.set(s.pokemonId, dex);
    if (!byDex.has(dex)) byDex.set(dex, []);
    byDex.get(dex).push({ form: s.form ?? null, pokemonId: s.pokemonId, settings: s });
  }
  return { byDex, dexOfPokemonId };
}

// PvPoke y Niantic nombran distinto algunas formas regionales.
const FORM_SYNONYMS = [
  [/_alolan\b/, "_alola"],
  [/_galarian\b/, "_galarian"],
  [/_hisuian\b/, "_hisuian"],
  [/_paldean\b/, "_paldea"],
];

function normalizeForm(id) {
  let s = id.toLowerCase().replace(/_shadow$/, "");
  for (const [re, to] of FORM_SYNONYMS) s = s.replace(re, to);
  return s.replace(/_normal$/, "");
}

/** Elige los ajustes de Niantic que corresponden a una especie de PvPoke. */
function nianticSettingsFor(pvpokeId, dex, byDex) {
  const candidates = byDex.get(dex) ?? [];
  if (!candidates.length) return null;
  const want = normalizeForm(pvpokeId);
  const exact = candidates.find((c) => c.form && normalizeForm(c.form) === want);
  if (exact) return exact.settings;
  const base = candidates.find((c) => c.form && /_NORMAL$/.test(c.form)) ?? candidates.find((c) => !c.form);
  return (base ?? candidates[0]).settings;
}

/** Caramelos para evolucionar de `settings` a la especie `targetDex` (y su forma, si se puede). */
function evolveCandy(settings, targetId, targetDex, dexOfPokemonId) {
  const branches = (settings?.evolutionBranch ?? []).filter(
    (b) => b.evolution && dexOfPokemonId.get(b.evolution) === targetDex
  );
  if (!branches.length) return null;
  const want = normalizeForm(targetId);
  const byForm = branches.find((b) => b.form && normalizeForm(b.form) === want);
  const b = byForm ?? branches[0];
  return typeof b.candyCost === "number" ? b.candyCost : null;
}

/** Trunca un número entre 0 y 1 a 15 cifras significativas. */
function truncate15(v) {
  const [, frac] = v.toPrecision(17).split(".");
  const lead = frac.match(/^0*/)[0].length;
  return Number(`0.${frac.slice(0, lead + 15)}`);
}

/**
 * Multiplicador de CP en medios niveles, del 1 al 51. El game master publica
 * los valores redondeados (0.7903); el juego los guarda en float32
 * (0.790300011634826), y esa diferencia alcanza para cambiar un empate de
 * rango. Por eso se pasan por Math.fround, como hace Stadium Gaming.
 */
function halfLevelCpm(cpmByLevel) {
  const out = [];
  const f = (lvl) => Math.fround(cpmByLevel[lvl - 1]);
  for (let lvl = 1; lvl <= 51; lvl++) {
    const a = f(lvl);
    out.push(a);
    if (lvl < 51) {
      const b = f(lvl + 1);
      out.push(Math.sqrt((a * a + b * b) / 2));
    }
  }
  // Stadium guarda cada valor truncado a 15 cifras significativas
  // (0.790300011634826, no ...827); con la misma precisión los empates
  // exactos de producto caen igual que en su tabla.
  return out.map(truncate15); // índice i => nivel 1 + i / 2
}

async function main() {
  console.log("Descargando gamemaster de PvPoke...");
  const gm = await fetchJson(`${PVPOKE}/gamemaster.json`);
  console.log("Descargando game master de Niantic (PokeMiners)...");
  const niantic = await fetchJson(NIANTIC_GM);
  const { byDex, dexOfPokemonId } = indexNiantic(niantic);

  // ---- species.json ----
  const released = gm.pokemon.filter((p) => p.released !== false && !(p.tags ?? []).includes("duplicate"));
  const ids = new Set(released.map((p) => p.speciesId));

  // Megas y Primales cuelgan de la especie cuyo id es su prefijo:
  // charizard_mega_x -> charizard, kyogre_primal -> kyogre.
  const megasOf = new Map();
  for (const p of released.filter(isMegaTag)) {
    const base = p.speciesId.replace(/_(mega|primal).*$/, "");
    if (!megasOf.has(base)) megasOf.set(base, []);
    megasOf.get(base).push(p.speciesId);
  }

  const byId = new Map(released.map((p) => [p.speciesId, p]));
  const missingCosts = [];
  const species = released.map((p) => {
    const settings = nianticSettingsFor(p.speciesId, p.dex, byDex);
    const evolutions = (p.family?.evolutions ?? []).filter((id) => ids.has(id));
    const candy = {};
    for (const t of evolutions) {
      const c = evolveCandy(settings, t, byId.get(t).dex, dexOfPokemonId);
      if (c !== null) candy[t] = c;
      else missingCosts.push(`${p.speciesId} -> ${t}`);
    }
    const third = settings?.thirdMove;
    const shadow = p.speciesId.endsWith("_shadow");
    return {
      id: p.speciesId,
      name: p.speciesName,
      dex: p.dex,
      atk: p.baseStats.atk,
      def: p.baseStats.def,
      sta: p.baseStats.hp,
      types: [p.types?.[0] ?? "none", p.types?.[1] ?? "none"],
      shadow,
      mega: isMegaTag(p),
      evolutions,
      evolveCandy: candy,
      // Las Shadow no pueden megaevolucionar.
      megas: shadow ? [] : (megasOf.get(p.speciesId) ?? []),
      third: third ? { candy: third.candyToUnlock ?? null, dust: third.stardustToUnlock ?? null } : null,
    };
  });
  species.sort((a, b) => a.dex - b.dex || a.id.localeCompare(b.id));

  // ---- ranks.json ----
  const ranks = {};
  for (const { key, cup, cp } of LEAGUES) {
    const list = await fetchJson(`${PVPOKE}/rankings/${cup}/overall/rankings-${cp}.json`);
    ranks[key] = Object.fromEntries(list.map((e, i) => [e.speciesId, i + 1]));
    console.log(`  ${key} (${cup}, cp${cp}): ${list.length} rankeadas`);
  }

  // ---- costs.json ----
  const up = niantic.find((e) => e.templateId === "POKEMON_UPGRADE_SETTINGS").data.pokemonUpgrades;
  const cpmByLevel = niantic.find((e) => e.data?.playerLevel).data.playerLevel.cpMultiplier;
  const costs = {
    cpm: halfLevelCpm(cpmByLevel),
    // Costo por subida (dos subidas por nivel). Índice = nivel entero - 1.
    candy: up.candyCost,
    stardust: up.stardustCost,
    // Caramelos XL desde el nivel 40. Índice = nivel entero - 40.
    xlCandy: up.xlCandyCost,
    xlFromLevel: up.xlCandyMinPokemonLevel,
    maxPowerUpLevel: up.maxNormalUpgradeLevel,
    shadowCandy: up.shadowCandyMultiplier,
    shadowDust: up.shadowStardustMultiplier,
  };

  const meta = {
    generatedAt: new Date().toISOString(),
    pvpokeGamemaster: gm.timestamp ?? null,
    speciesCount: species.length,
    leagues: LEAGUES,
  };

  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(path.join(OUT_DIR, "species.json"), JSON.stringify(species), "utf-8");
  await writeFile(path.join(OUT_DIR, "ranks.json"), JSON.stringify(ranks), "utf-8");
  await writeFile(path.join(OUT_DIR, "costs.json"), JSON.stringify(costs), "utf-8");
  await writeFile(path.join(OUT_DIR, "meta.json"), JSON.stringify(meta, null, 2), "utf-8");

  if (missingCosts.length) {
    console.warn(`Evoluciones sin costo en el game master de Niantic (${missingCosts.length}):`, missingCosts.slice(0, 20));
  }
  console.log(`Listo: ${species.length} especies.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
