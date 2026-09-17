// Descarga los datos crudos de PvPoke (repo pvpoke/pvpoke, MIT) y genera
// src/data/pokemon.json, src/data/moves.json y src/data/meta.json.
// Se corre a mano con `npm run build-data`. No se ejecuta en runtime.

import { writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "..", "src", "data");

const GM_URL =
  "https://raw.githubusercontent.com/pvpoke/pvpoke/master/src/data/gamemaster.json";
const RANKINGS_URL = (cp) =>
  `https://raw.githubusercontent.com/pvpoke/pvpoke/master/src/data/rankings/all/overall/rankings-${cp}.json`;

const LEAGUES = [
  { key: "great", cp: 1500 },
  { key: "ultra", cp: 2500 },
  { key: "master", cp: 10000 },
];

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fetch failed ${res.status} for ${url}`);
  return res.json();
}

function isMega(speciesId) {
  return speciesId.includes("_mega");
}

async function main() {
  console.log("Descargando gamemaster de PvPoke...");
  const gm = await fetchJson(GM_URL);

  console.log("Descargando rankings por liga...");
  const rankingsByLeague = {};
  for (const { key, cp } of LEAGUES) {
    rankingsByLeague[key] = await fetchJson(RANKINGS_URL(cp));
    console.log(`  ${key} (cp${cp}): ${rankingsByLeague[key].length} entradas`);
  }

  // ---- moves.json ----
  const moves = {};
  for (const m of gm.moves) {
    moves[m.moveId] = {
      name: m.name,
      type: m.type,
      power: m.power,
      energy: m.energy,
      energyGain: m.energyGain,
      turns: m.turns,
      ...(m.buffs ? { buffs: m.buffs } : {}),
      ...(m.buffTarget ? { buffTarget: m.buffTarget } : {}),
      ...(m.buffApplyChance ? { buffApplyChance: m.buffApplyChance } : {}),
      ...(m.archetype ? { archetype: m.archetype } : {}),
    };
  }

  // ---- pokemon.json ----
  const gmBySpecies = new Map(gm.pokemon.map((p) => [p.speciesId, p]));

  // Unimos todos los speciesId que aparecen en al menos una liga, sin Mega.
  const speciesIds = new Set();
  for (const { key } of LEAGUES) {
    for (const entry of rankingsByLeague[key]) {
      if (isMega(entry.speciesId)) continue;
      speciesIds.add(entry.speciesId);
    }
  }

  const pokemon = [];
  const missingFromGamemaster = [];

  for (const speciesId of speciesIds) {
    const gmEntry = gmBySpecies.get(speciesId);
    if (!gmEntry) {
      missingFromGamemaster.push(speciesId);
      continue;
    }

    const leagues = {};
    for (const { key } of LEAGUES) {
      const idx = rankingsByLeague[key].findIndex(
        (e) => e.speciesId === speciesId
      );
      if (idx === -1) continue;
      const entry = rankingsByLeague[key][idx];

      const fastUsage = {};
      for (const fm of entry.moves?.fastMoves ?? []) {
        fastUsage[fm.moveId] = fm.uses;
      }
      const chargedUsage = {};
      for (const cm of entry.moves?.chargedMoves ?? []) {
        chargedUsage[cm.moveId] = cm.uses;
      }

      const matchups = {};
      for (const m of entry.matchups ?? []) {
        matchups[m.opponent] = m.rating;
      }
      const counters = {};
      for (const c of entry.counters ?? []) {
        counters[c.opponent] = c.rating;
      }

      leagues[key] = {
        rank: idx + 1,
        score: entry.score ?? null,
        rating: entry.rating ?? null,
        moveset: entry.moveset ?? [],
        fastUsage,
        chargedUsage,
        matchups,
        counters,
      };
    }

    pokemon.push({
      speciesId: gmEntry.speciesId,
      speciesName: gmEntry.speciesName,
      dex: gmEntry.dex,
      types: [gmEntry.types?.[0] ?? "none", gmEntry.types?.[1] ?? "none"],
      shadow: speciesId.endsWith("_shadow"),
      fastMoves: gmEntry.fastMoves ?? [],
      chargedMoves: gmEntry.chargedMoves ?? [],
      eliteMoves: gmEntry.eliteMoves ?? [],
      leagues,
    });
  }

  pokemon.sort((a, b) => a.speciesId.localeCompare(b.speciesId));

  if (missingFromGamemaster.length) {
    console.warn(
      `Aviso: ${missingFromGamemaster.length} speciesId de rankings no encontrados en gamemaster (se omiten):`,
      missingFromGamemaster.slice(0, 20)
    );
  }

  const meta = {
    generatedAt: new Date().toISOString(),
    gamemasterTimestamp: gm.timestamp ?? null,
    pokemonCount: pokemon.length,
    moveCount: Object.keys(moves).length,
  };

  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(
    path.join(OUT_DIR, "pokemon.json"),
    JSON.stringify(pokemon),
    "utf-8"
  );
  await writeFile(
    path.join(OUT_DIR, "moves.json"),
    JSON.stringify(moves),
    "utf-8"
  );
  await writeFile(
    path.join(OUT_DIR, "meta.json"),
    JSON.stringify(meta, null, 2),
    "utf-8"
  );

  console.log(
    `Listo: ${pokemon.length} pokemon, ${Object.keys(moves).length} moves.`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
