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
const RANKINGS_URL = (cup, cp) =>
  `https://raw.githubusercontent.com/pvpoke/pvpoke/master/src/data/rankings/${cup}/overall/rankings-${cp}.json`;

// Ligas de la temporada vigente de GO Battle League. `cup` es el id de copa
// de PvPoke (ver `formats` en su gamemaster): "all" es la liga abierta.
// Al cambiar la rotación se edita esta lista y la de src/lib/data.ts (LEAGUES).
// Las reglas de cada copa (tipos prohibidos, Megas) ya vienen aplicadas en los
// rankings de PvPoke: una especie solo tiene datos en las ligas donde es legal.
const LEAGUES = [
  { key: "ultra", cup: "all", cp: 2500, title: "Ultra League" },
  { key: "megamaster", cup: "mega", cp: 10000, title: "Master League Mega Edition" },
  { key: "retro", cup: "retro", cp: 1500, title: "Retro Cup" },
];

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fetch failed ${res.status} for ${url}`);
  return res.json();
}

async function main() {
  console.log("Descargando gamemaster de PvPoke...");
  const gm = await fetchJson(GM_URL);

  console.log("Descargando rankings por liga...");
  const rankingsByLeague = {};
  for (const { key, cup, cp } of LEAGUES) {
    rankingsByLeague[key] = await fetchJson(RANKINGS_URL(cup, cp));
    console.log(`  ${key} (${cup}, cp${cp}): ${rankingsByLeague[key].length} entradas`);
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

  // Unimos todos los speciesId que aparecen en al menos una liga. Las Megas y
  // Primales entran solo si alguna copa las admite (hoy, Master League Mega).
  const speciesIds = new Set();
  for (const { key } of LEAGUES) {
    for (const entry of rankingsByLeague[key]) {
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
      // Megas y Primales: PvPoke les pone la etiqueta "mega". Solo se permite
      // una por equipo, así que el buscador las esconde cuando ya hay una.
      mega: (gmEntry.tags ?? []).includes("mega"),
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
    leagues: LEAGUES.map(({ key, cup, cp, title }) => ({
      key, cup, cp, title, count: rankingsByLeague[key].length,
    })),
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
