// Descarga sprites ANIMADOS (GIF) de frente y espalda desde Pokémon Showdown
// para cada speciesId de src/data/pokemon.json. Se corre a mano con
// `npm run build-sprites`. No se ejecuta en runtime.
//
// A diferencia de la v1 (sprites estáticos de PokeAPI), acá el mapeo
// PvPoke -> nombre de archivo es EXACTO (no heurístico): se arma a partir de
// los propios campos `num`/`baseSpecies`/`forme` del pokedex de Showdown
// (data/pokedex.ts, dominio público de Smogon, así arma su propio cliente).
//
// Regla de nombre de archivo verificada contra el CDN real:
//   - especie base (sin baseSpecies): toID(name) completo, ej. "Ho-Oh" -> "hooh"
//   - forma (con baseSpecies + forme): toID(baseSpecies) + "-" + cada
//     segmento de `forme` (separado por "-") pasado por toID, ej.
//     baseSpecies="Darmanitan", forme="Galar-Zen" -> "darmanitan-galar-zen"

import { writeFile, mkdir, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const PUBLIC_SPRITES = path.join(ROOT, "public", "sprites");
const CACHE_DIR = path.join(__dirname, ".cache");

const POKEDEX_URL =
  "https://raw.githubusercontent.com/smogon/pokemon-showdown/master/data/pokedex.ts";
const SPRITE_BASE = "https://play.pokemonshowdown.com/sprites";

// Sinónimos entre el sufijo de PvPoke y el nombre de forma de Showdown.
const WORD_SYNONYMS = {
  alolan: "alola",
  galarian: "galar",
  hisuian: "hisui",
  paldean: "paldea",
  ordinary: "standard",
  overcast: "standard",
  hero: "",
};

function toID(text) {
  return text.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function normalizeSuffix(raw) {
  return raw
    .toLowerCase()
    .split(/[_-]+/)
    .map((tok) => tok.replace(/[^a-z0-9]/g, "")) // ej. "Pa'u" -> "pau"
    .filter(Boolean)
    .map((tok) => (tok in WORD_SYNONYMS ? WORD_SYNONYMS[tok] : tok))
    .filter(Boolean)
    .join("-");
}

/** Nombre de archivo de sprite tal como lo sirve el CDN de Showdown. */
function spriteFileName(entry) {
  if (entry.__override) return entry.__override;
  if (entry.baseSpecies) {
    const base = toID(entry.baseSpecies);
    const formeSegs = entry.forme.split("-").map(toID).filter(Boolean);
    return [base, ...formeSegs].join("-");
  }
  return toID(entry.name);
}

async function ensureCacheDir() {
  await mkdir(CACHE_DIR, { recursive: true });
}

async function fetchPokedex() {
  const cachePath = path.join(CACHE_DIR, "showdown-pokedex.ts");
  let src;
  if (existsSync(cachePath)) {
    src = await readFile(cachePath, "utf-8");
  } else {
    const res = await fetch(POKEDEX_URL, { headers: { "User-Agent": "pokego-pvp-build-script" } });
    if (!res.ok) throw new Error(`No se pudo bajar pokedex.ts: ${res.status}`);
    src = await res.text();
    await writeFile(cachePath, src, "utf-8");
  }

  // El archivo es "export const Pokedex: <tipo> = { ... };" — el objeto
  // literal en sí es JS válido (claves sin comillas, valores JSON-like), así
  // que lo evaluamos directo. Es un dato de un repo público de confianza,
  // no código de terceros arbitrario.
  const start = src.indexOf("{");
  const end = src.lastIndexOf("};");
  const objectLiteral = src.slice(start, end + 1);
  // eslint-disable-next-line no-new-func
  const pokedex = new Function(`return (${objectLiteral});`)();
  return pokedex;
}

/** Agrupa las entradas del pokedex de Showdown por número de dex nacional. */
function groupByDex(pokedex) {
  const byDex = new Map();
  for (const [key, entry] of Object.entries(pokedex)) {
    if (!entry.num || entry.num <= 0) continue; // saltea CAP/formas sin dex
    const list = byDex.get(entry.num) ?? [];
    list.push({ key, ...entry });
    byDex.set(entry.num, list);
  }
  return byDex;
}

function suffixTokensOf(speciesIdNoShadow) {
  return speciesIdNoShadow.split("_").slice(1);
}

// Un puñado de formas cuyo nombre en PvPoke no tiene ninguna combinación
// razonable de sinónimos contra el `forme`/`baseForme` de Showdown (choque
// real de vocabulario, no un sufijo raro): overrides explícitos, directo al
// nombre de archivo de sprite.
const SPECIES_ID_OVERRIDES = {
  // PvPoke le dice "sunny" a la forma que Showdown llama "Sunshine"; pero
  // "sunny" también es el nombre real de una forma de Castform, así que no
  // se puede resolver con un sinónimo global sin romper ese otro caso.
  cherrim_sunny: "cherrim-sunshine",
};

/** Elige la entrada de Showdown (base o forma) que mejor matchea el speciesId de PvPoke. */
function resolveShowdownEntry(speciesIdNoShadow, dex, candidates) {
  if (!candidates || candidates.length === 0) return null;
  const baseEntry = candidates.find((e) => !e.baseSpecies) ?? candidates[0];

  if (SPECIES_ID_OVERRIDES[speciesIdNoShadow]) {
    return { entry: { ...baseEntry, __override: SPECIES_ID_OVERRIDES[speciesIdNoShadow] }, matched: true };
  }

  const suffixParts = suffixTokensOf(speciesIdNoShadow);
  if (suffixParts.length === 0) return { entry: baseEntry, matched: true };

  const wantedSuffix = normalizeSuffix(suffixParts.join("-"));
  if (!wantedSuffix) return { entry: baseEntry, matched: true }; // ej. "hero"

  const wantedTokens = new Set(wantedSuffix.split("-").filter(Boolean));

  // Candidatos a puntuar: todas las formas con `baseSpecies` propio, MÁS la
  // base con su `baseForme` (ej. Darmanitan-Standard, Shaymin-Land,
  // Urshifu-Single-Strike suelen ser justo la forma "por defecto", que
  // Showdown no separa en una entrada propia, solo la anota en `baseForme`
  // de la base). Sin esto, un sufijo como "curly" en Tatsugiri terminaba
  // matcheando por descarte la entrada "Curly-Mega" en vez de la base.
  const scoringPool = [
    ...candidates
      .filter((e) => e.baseSpecies)
      .map((e) => ({ entry: e, formeText: e.forme })),
    ...(baseEntry.baseForme ? [{ entry: baseEntry, formeText: baseEntry.baseForme }] : []),
  ];

  let best = null;
  let bestScore = 0;
  for (const { entry, formeText } of scoringPool) {
    const formeSuffix = normalizeSuffix(formeText);
    if (!formeSuffix) continue;

    let score = 0;
    if (formeSuffix === wantedSuffix) score = 2;
    else if (formeSuffix.includes(wantedSuffix) || wantedSuffix.includes(formeSuffix)) score = 1;

    const formeTokens = new Set(formeSuffix.split("-").filter(Boolean));
    const overlap = [...wantedTokens].filter((t) => formeTokens.has(t)).length;
    score += overlap * 0.3;

    if (score > bestScore) {
      bestScore = score;
      best = entry;
    }
  }

  // Umbral >=1 (match exacto o de substring): el bonus de solapamiento de
  // tokens (+0.3 por palabra) no alcanza solo, para que "single-strike" no
  // termine ganando por descarte contra "rapid-strike" (comparten "strike").
  if (best && bestScore >= 1) return { entry: best, matched: true };
  return { entry: baseEntry, matched: false };
}

async function downloadTo(url, destPath) {
  const res = await fetch(url);
  if (!res.ok) return false;
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(destPath, buf);
  return true;
}

const DRY_RUN = process.argv.includes("--dry-run");

async function main() {
  await ensureCacheDir();
  await mkdir(PUBLIC_SPRITES, { recursive: true });
  await mkdir(path.join(PUBLIC_SPRITES, "back"), { recursive: true });

  console.log("Descargando pokedex de Pokémon Showdown...");
  const pokedex = await fetchPokedex();
  const byDex = groupByDex(pokedex);
  console.log(`  ${Object.keys(pokedex).length} entradas, ${byDex.size} números de dex.`);

  const pokemon = JSON.parse(
    await readFile(path.join(ROOT, "src", "data", "pokemon.json"), "utf-8")
  );

  if (DRY_RUN) {
    const sampleIds = process.argv.slice(process.argv.indexOf("--dry-run") + 1);
    const sample = sampleIds.length
      ? pokemon.filter((p) => sampleIds.includes(p.speciesId))
      : pokemon;
    for (const entry of sample) {
      const baseId = entry.shadow ? entry.speciesId.replace(/_shadow$/, "") : entry.speciesId;
      const candidates = byDex.get(entry.dex);
      const resolved = resolveShowdownEntry(baseId, entry.dex, candidates);
      const fileName = resolved ? spriteFileName(resolved.entry) : "SIN CANDIDATOS";
      console.log(
        `${entry.speciesId} (dex ${entry.dex}) -> ${fileName}${resolved && !resolved.matched ? "  [fallback a base, no matcheó]" : ""}`
      );
    }
    return;
  }

  const unmatched = [];
  const failed = [];
  let downloaded = 0;
  let skipped = 0;

  for (const entry of pokemon) {
    const baseId = entry.shadow ? entry.speciesId.replace(/_shadow$/, "") : entry.speciesId;
    const candidates = byDex.get(entry.dex);
    const resolved = resolveShowdownEntry(baseId, entry.dex, candidates);

    if (!resolved) {
      failed.push(`${entry.speciesId} (sin entrada en Showdown para dex ${entry.dex})`);
      continue;
    }
    if (!resolved.matched) unmatched.push(entry.speciesId);

    const fileName = spriteFileName(resolved.entry);
    // Algunas formas (sobre todo agregadas después de la era Black/White,
    // como los estilos de Tauros de Paldea, las fusiones de Necrozma, el
    // segundo estilo de Urshifu, o las formas Origin de Dialga/Palkia) están
    // bien mapeadas pero Showdown nunca les dibujó un sprite animado propio.
    // En ese caso usamos el sprite de la especie base como respaldo visual,
    // en vez de dejar la especie sin ninguna imagen.
    const baseEntry = candidates?.find((e) => !e.baseSpecies) ?? candidates?.[0] ?? null;
    const baseFileName = baseEntry ? spriteFileName(baseEntry) : null;

    const frontDest = path.join(PUBLIC_SPRITES, `${entry.speciesId}.gif`);
    const backDest = path.join(PUBLIC_SPRITES, "back", `${entry.speciesId}.gif`);

    if (!existsSync(frontDest)) {
      let ok = await downloadTo(`${SPRITE_BASE}/ani/${fileName}.gif`, frontDest);
      if (!ok && baseFileName && baseFileName !== fileName) {
        ok = await downloadTo(`${SPRITE_BASE}/ani/${baseFileName}.gif`, frontDest);
        if (ok) unmatched.push(`${entry.speciesId} (sin sprite propio, uso el de la base)`);
      }
      if (ok) downloaded++;
      else failed.push(`${entry.speciesId} (front, archivo=${fileName})`);
    } else {
      skipped++;
    }

    if (!existsSync(backDest)) {
      let ok = await downloadTo(`${SPRITE_BASE}/ani-back/${fileName}.gif`, backDest);
      if (!ok && baseFileName && baseFileName !== fileName) {
        ok = await downloadTo(`${SPRITE_BASE}/ani-back/${baseFileName}.gif`, backDest);
      }
      // Si tampoco hay espalda de la base, el front-end usa el sprite de
      // frente espejado (fallback silencioso, ver PokemonSprite.tsx).
    }
  }

  console.log(`\nDescargados: ${downloaded}, ya existentes: ${skipped}`);
  if (failed.length) {
    console.warn(`\nFallaron (sin sprite ni de frente): ${failed.length}`);
    console.warn(failed);
  }
  if (unmatched.length) {
    console.warn(
      `\nFormas que cayeron a la especie base por no matchear ninguna forma de Showdown (${unmatched.length}):`
    );
    console.warn(unmatched);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
