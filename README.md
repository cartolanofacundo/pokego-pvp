# PokéGO PVP

App de consulta estática para jugadores de PVP de Pokémon GO: elegí tu equipo
y el Pokémon del rival, y te muestra tipos, debilidades, ataques recomendados
por [PvPoke](https://pvpoke.com) y con qué conviene atacar o a quién conviene
cambiar. Sin API ni base de datos: todos los datos están en JSON dentro del
repo, generados a partir del repo público de PvPoke y de PokeAPI.

## Uso

```bash
npm install
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000).

## Regenerar los datos

Los JSON de `src/data/` y los sprites de `public/sprites/` **no** se generan
en tiempo de ejecución: se corren a mano cuando se quiere actualizar el
ranking/moveset de PvPoke o agregar Pokémon nuevos.

```bash
npm run build-data     # descarga gamemaster + rankings de PvPoke -> src/data/*.json
npm run build-sprites  # descarga sprites pixel-art de PokeAPI -> public/sprites/
```

`build-sprites` cachea las respuestas de PokeAPI en `scripts/.cache` (no se
commitea) para no volver a pegarle a la API en corridas siguientes.

## Tests

```bash
npm test
```

Cubre la tabla de efectividad de tipos, la heurística de recomendación de
ataques (poder × STAB × efectividad) y el ranking de switch de equipo, con
casos reales tomados de los datos de PvPoke (Azumarill/Melmetal/Altaria).

## Build estático

```bash
npm run build
```

Genera `out/` como HTML/CSS/JS estático (`next.config.ts` tiene
`output: "export"`), listo para servir desde cualquier hosting estático.

## Alcance de los datos

- Ligas: Great (CP 1500), Ultra (CP 2500) y Master (sin tope de CP).
- Se incluyen formas Shadow; se excluyen las Mega.
- La recomendación de ataque es una heurística propia (poder × STAB ×
  efectividad de tipo), no el simulador de PvPoke.
