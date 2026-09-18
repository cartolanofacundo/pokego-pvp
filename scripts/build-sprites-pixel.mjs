// Descarga los sprites pixel-art de 96 px de PokeAPI (frente) para las
// fichas de equipo y el buscador. Se corre a mano con `npm run build-sprites-pixel`.
// Salida: public/sprites/pixel/<speciesId>.png
//
// Los sprites de campo (grandes, animados) los baja scripts/build-sprites.mjs
// desde Pokémon Showdown; este script es solo para el pixel art chico, que el
// diseño usa a propósito con `image-rendering: pixelated`.

import { writeFile, mkdir, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const OUT_DIR = path.join(ROOT, "public", "sprites", "pixel");
const CACHE_DIR = path.join(__dirname, ".cache");

const SPRITE_BASE = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon";
const SPECIES_API = (dex) => `https://pokeapi.co/api/v2/pokemon-species/${dex}`;

const WORD_SYNONYMS = {
  alolan: "alola",
  galarian: "galar",
  hisuian: "hisui",
  paldean: "paldea",
  ordinary: "standard",
  overcast: "standard",
  hero: "",
};

function normalizeSuffix(raw) {
  return raw
    .toLowerCase()
    .split(/[_-]+/)
    .map((tok) => tok.replace(/[^a-z0-9]/g, ""))
    .filter(Boolean)
    .map((tok) => (tok in WORD_SYNONYMS ? WORD_SYNONYMS[tok] : tok))
    .filter(Boolean)
    .join("-");
}

async function cachedFetchJson(url, cacheKey) {
  const cachePath = path.join(CACHE_DIR, `${cacheKey}.json`);
  if (existsSync(cachePath)) return JSON.parse(await readFile(cachePath, "utf-8"));
  const res = await fetch(url, { headers: { "User-Agent": "pokego-pvp-build-script" } });
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error(`fetch failed ${res.status} for ${url}`);
  }
  const json = await res.json();
  await writeFile(cachePath, JSON.stringify(json), "utf-8");
  return json;
}

function idFromUrl(url) {
  const m = url.match(/\/(\d+)\/?$/);
  return m ? Number(m[1]) : null;
}

/** Resuelve el id de PokeAPI para una forma de PvPoke usando las variedades de la especie. */
function resolvePokeApiId(speciesIdNoShadow, dex, speciesJson) {
  const suffixRaw = speciesIdNoShadow.split("_").slice(1).join("-");
  if (!suffixRaw) {
    const def = speciesJson?.varieties?.find((v) => v.is_default);
    return { id: def ? idFromUrl(def.pokemon.url) : dex, matched: true };
  }
  if (!speciesJson) return { id: dex, matched: false };

  const wantedSuffix = normalizeSuffix(suffixRaw);
  if (!wantedSuffix) {
    const def = speciesJson.varieties?.find((v) => v.is_default);
    return { id: def ? idFromUrl(def.pokemon.url) : dex, matched: true };
  }
  const wantedTokens = new Set(wantedSuffix.split("-"));

  let best = null;
  let bestScore = 0;
  for (const variety of speciesJson.varieties ?? []) {
    const varietyRaw = variety.pokemon.name
      .replace(`${speciesJson.name}-`, "")
      .replace(speciesJson.name, "");
    const varietySuffix = normalizeSuffix(varietyRaw);
    if (!varietySuffix) continue;
    let score = 0;
    if (varietySuffix === wantedSuffix) score = 2;
    else if (varietySuffix.includes(wantedSuffix) || wantedSuffix.includes(varietySuffix)) score = 1;
    const varietyTokens = new Set(varietySuffix.split("-"));
    score += [...wantedTokens].filter((t) => varietyTokens.has(t)).length * 0.3;
    if (score > bestScore) {
      bestScore = score;
      best = variety;
    }
  }
  if (best && bestScore >= 1) return { id: idFromUrl(best.pokemon.url), matched: true };
  return { id: dex, matched: false };
}

async function downloadTo(url, destPath) {
  const res = await fetch(url);
  if (!res.ok) return false;
  await writeFile(destPath, Buffer.from(await res.arrayBuffer()));
  return true;
}

async function main() {
  await mkdir(CACHE_DIR, { recursive: true });
  await mkdir(OUT_DIR, { recursive: true });
  const pokemon = JSON.parse(await readFile(path.join(ROOT, "src", "data", "pokemon.json"), "utf-8"));

  const speciesCache = new Map();
  const unmatched = [];
  const failed = [];
  let downloaded = 0;
  let skipped = 0;

  for (const entry of pokemon) {
    const dest = path.join(OUT_DIR, `${entry.speciesId}.png`);
    if (existsSync(dest)) {
      skipped++;
      continue;
    }
    const baseId = entry.shadow ? entry.speciesId.replace(/_shadow$/, "") : entry.speciesId;
    let pokeApiId = entry.dex;
    if (baseId.includes("_")) {
      if (!speciesCache.has(entry.dex)) {
        speciesCache.set(entry.dex, await cachedFetchJson(SPECIES_API(entry.dex), `species-${entry.dex}`));
      }
      const r = resolvePokeApiId(baseId, entry.dex, speciesCache.get(entry.dex));
      pokeApiId = r.id;
      if (!r.matched) unmatched.push(entry.speciesId);
    }
    let ok = await downloadTo(`${SPRITE_BASE}/${pokeApiId}.png`, dest);
    if (!ok && pokeApiId !== entry.dex) ok = await downloadTo(`${SPRITE_BASE}/${entry.dex}.png`, dest);
    if (ok) downloaded++;
    else failed.push(entry.speciesId);
  }

  console.log(`Descargados: ${downloaded}, ya existentes: ${skipped}`);
  if (failed.length) console.warn(`Fallaron: ${failed.length}`, failed);
  if (unmatched.length) console.warn(`Cayeron a la especie base (${unmatched.length}):`, unmatched);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
