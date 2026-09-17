// Descarga sprites pixel-art (frente y espalda) de PokeAPI para cada
// speciesId de src/data/pokemon.json. Se corre a mano con `npm run build-sprites`.
// No se ejecuta en runtime. Usa un cache local en scripts/.cache para no
// re-descargar en corridas siguientes.

import { writeFile, mkdir, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const PUBLIC_SPRITES = path.join(ROOT, "public", "sprites");
const CACHE_DIR = path.join(__dirname, ".cache");

const SPRITE_BASE =
  "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon";
const SPECIES_API = (dex) => `https://pokeapi.co/api/v2/pokemon-species/${dex}`;

// Palabras que PvPoke y PokeAPI nombran distinto para la misma forma.
// Se aplican de a una palabra (ya separadas por "_" o "-") antes de comparar.
const WORD_SYNONYMS = {
  alolan: "alola",
  galarian: "galar",
  hisuian: "hisui",
  paldean: "paldea",
  ordinary: "standard",
  overcast: "standard",
  hero: "", // Zacian/Zamazenta "hero" = forma base (sin sufijo) en PokeAPI
};

function normalizeSuffix(raw) {
  return raw
    .toLowerCase()
    .split(/[_-]+/)
    .filter(Boolean)
    .map((tok) => (tok in WORD_SYNONYMS ? WORD_SYNONYMS[tok] : tok))
    .filter(Boolean)
    .join("-");
}

async function ensureCacheDir() {
  await mkdir(CACHE_DIR, { recursive: true });
}

async function cachedFetchJson(url, cacheKey) {
  const cachePath = path.join(CACHE_DIR, `${cacheKey}.json`);
  if (existsSync(cachePath)) {
    return JSON.parse(await readFile(cachePath, "utf-8"));
  }
  const res = await fetch(url);
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

function baseSpeciesIdOf(speciesId) {
  return speciesId.split("_")[0];
}

function suffixOf(speciesId) {
  return speciesId.split("_").slice(1).join("-");
}

// Devuelve { id, matched } donde matched=false significa "se usó la forma
// base porque ninguna variedad de PokeAPI matcheó el sufijo pedido".
function resolvePokeApiId(speciesIdNoShadow, dex, speciesJson) {
  const suffixRaw = suffixOf(speciesIdNoShadow);

  if (!suffixRaw) {
    const def = speciesJson?.varieties?.find((v) => v.is_default);
    return { id: def ? idFromUrl(def.pokemon.url) : dex, matched: true };
  }

  if (!speciesJson) return { id: dex, matched: false };

  const wantedSuffix = normalizeSuffix(suffixRaw);
  const wantedTokens = new Set(wantedSuffix.split("-").filter(Boolean));

  let best = null;
  let bestScore = 0;

  for (const variety of speciesJson.varieties ?? []) {
    const varietyRaw = variety.pokemon.name
      .replace(`${speciesJson.name}-`, "")
      .replace(speciesJson.name, "");
    const varietySuffix = normalizeSuffix(varietyRaw);

    let score = 0;
    if (wantedSuffix && varietySuffix) {
      if (varietySuffix === wantedSuffix) score = 2;
      else if (
        varietySuffix.includes(wantedSuffix) ||
        wantedSuffix.includes(varietySuffix)
      )
        score = 1;

      const varietyTokens = new Set(varietySuffix.split("-").filter(Boolean));
      const overlap = [...wantedTokens].filter((t) =>
        varietyTokens.has(t)
      ).length;
      score += overlap * 0.3;
    } else if (!wantedSuffix && !varietySuffix) {
      score = variety.is_default ? 3 : 1;
    }

    if (score > bestScore) {
      bestScore = score;
      best = variety;
    }
  }

  if (best && bestScore > 0) {
    return { id: idFromUrl(best.pokemon.url), matched: true };
  }
  return { id: dex, matched: false };
}

async function downloadTo(url, destPath) {
  const res = await fetch(url);
  if (!res.ok) return false;
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(destPath, buf);
  return true;
}

async function main() {
  await ensureCacheDir();
  await mkdir(PUBLIC_SPRITES, { recursive: true });
  await mkdir(path.join(PUBLIC_SPRITES, "back"), { recursive: true });

  const pokemon = JSON.parse(
    await readFile(path.join(ROOT, "src", "data", "pokemon.json"), "utf-8")
  );

  const unmatched = [];
  const failed = [];
  let downloaded = 0;
  let skipped = 0;

  const speciesCache = new Map();

  for (const entry of pokemon) {
    const baseId = entry.shadow
      ? entry.speciesId.replace(/_shadow$/, "")
      : entry.speciesId;

    let pokeApiId;

    if (baseSpeciesIdOf(baseId) === baseId) {
      pokeApiId = entry.dex;
    } else {
      if (!speciesCache.has(entry.dex)) {
        const json = await cachedFetchJson(
          SPECIES_API(entry.dex),
          `species-${entry.dex}`
        );
        speciesCache.set(entry.dex, json);
      }
      const speciesJson = speciesCache.get(entry.dex);
      const { id, matched } = resolvePokeApiId(
        baseId,
        entry.dex,
        speciesJson
      );
      pokeApiId = id;
      if (!matched) unmatched.push(entry.speciesId);
    }

    const frontDest = path.join(PUBLIC_SPRITES, `${entry.speciesId}.png`);
    const backDest = path.join(
      PUBLIC_SPRITES,
      "back",
      `${entry.speciesId}.png`
    );

    if (!existsSync(frontDest)) {
      const ok = await downloadTo(`${SPRITE_BASE}/${pokeApiId}.png`, frontDest);
      if (ok) downloaded++;
      else failed.push(`${entry.speciesId} (front, id=${pokeApiId})`);
    } else {
      skipped++;
    }

    if (!existsSync(backDest)) {
      await downloadTo(`${SPRITE_BASE}/back/${pokeApiId}.png`, backDest);
      // Si falla, el front-end usa el sprite de frente espejado como respaldo.
    }
  }

  console.log(`Descargados: ${downloaded}, ya existentes: ${skipped}`);
  if (failed.length) {
    console.warn(`\nFallaron (sin sprite ni de frente): ${failed.length}`);
    console.warn(failed);
  }
  if (unmatched.length) {
    console.warn(
      `\nFormas que cayeron al sprite base (dex) por no matchear ninguna variedad (${unmatched.length}), revisar si visualmente importa:`
    );
    console.warn(unmatched);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
