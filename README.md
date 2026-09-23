# PokéGO PVP

Segunda pantalla para PVP de Pokémon GO. Se usa en una computadora al lado del
celular mientras se pelea: cargás tu equipo una vez, vas cargando los rivales
sobre la marcha, y la pantalla te muestra qué ataque te pega fuerte, cuánto
tarda cada cargado y a quién conviene mandar. Sin API ni base de datos: todo
es estático.

Herramienta de uso individual. Lienzo fijo de **1920×1080**, sin responsivo ni
soporte móvil. Teclado primero; el ratón es el plan B.

## Uso

```bash
npm install
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000) a pantalla completa (F11).

## Datos y sprites

Dos fuentes públicas, cacheadas en el repo. No se consultan en runtime.

```bash
npm run build-data          # PvPoke gamemaster + rankings -> src/data/*.json
npm run build-sprites       # Pokémon Showdown, GIF animados de frente y espalda -> public/sprites/
npm run build-sprites-pixel # PokeAPI, pixel art 96 px -> public/sprites/pixel/
```

- **PvPoke** (`gamemaster.json` y los rankings de cada copa): tipos,
  movimientos (poder, energía, ganancia, turnos), moveset recomendado por liga,
  orden de uso ("más usados") y rating de matchups/counters.
- **Pokémon Showdown**: sprites de campo. El rival de frente (410 px) y el
  propio de espaldas (545 px). Decisión del dueño del proyecto: el diseño
  reservaba ese slot para imágenes "con movimiento" y estos GIF lo ocupan tal
  cual, sin `pixelated`.
- **PokeAPI**: pixel art de 96 px para las fichas de equipo (84 px) y el
  buscador (44 px), con `image-rendering: pixelated` a propósito.

### Ligas

Las de la temporada vigente de GO Battle League. Cada una sale de su propio
ranking de PvPoke (`rankings/<copa>/overall/rankings-<cp>.json`):

| Liga | Copa de PvPoke | CP | Reglas |
| --- | --- | --- | --- |
| Ultra League | `all` | 2500 | abierta |
| Master League Mega Edition | `mega` | 10000 | admite Megas y Primales |
| Retro Cup | `retro` | 1500 | sin siniestro, hada ni acero, sin Megas |

Las reglas de cada copa ya vienen aplicadas en los rankings: una especie solo
tiene datos en las ligas donde es legal, así que el buscador de cada liga se
filtra solo. Las Megas y Primales aparecen solo en Master League Mega Edition.

**Cambiar la rotación**: editar la lista `LEAGUES` en
`scripts/build-data.mjs` y en `src/lib/data.ts` (mismas claves, en el mismo
orden), y correr los tres scripts de arriba. Los de sprites saltean los
archivos que ya existen, así que solo bajan las especies nuevas.

Las especies que quedaron fuera de todas las ligas vigentes (47 al pasar de
Great/Ultra/Master a esta rotación) no tienen datos, pero sus sprites se
conservan en `public/sprites/` por si esas ligas vuelven. Un equipo guardado
con alguna de ellas carga igual: ese hueco queda vacío.

Ocho Megas recientes (Chesnaught, Delphox, Greninja, Falinks, Malamar,
Staraptor y Raichu X e Y) usan la espalda animada de la especie base, porque
Showdown no les dibujó una propia.

## Decisiones documentadas (las que el brief pedía definir)

- **Multiplicador de tipo**: producto de la efectividad contra cada tipo del
  defensor, con los valores de Pokémon GO (1.6 / 1 / 0.625 / 0.390625). Se
  muestra a dos decimales sin ceros finales: ×2.56, ×1.6, ×1, ×0.63, ×0.39,
  ×0.24. Ver `src/lib/types.ts` y `formatMult` en `src/lib/recommend.ts`.
- **Turnos de carga**: `ceil(energía del cargado / ganancia del rápido) ×
  turnos del rápido`. Ver `src/lib/recommend.ts`.
- **Semáforo de banca** (`src/lib/verdict.ts`): rating de PvPoke cuando el par
  está rankeado (≥600 gana, ≤400 pierde, entre medio parejo); si no, heurística
  de tipos con los ataques recomendados de cada lado (súper efectivo de un solo
  lado decide, el resto es parejo). No modela escudos ni energía.
- **Moveset por defecto**: el del ranking de PvPoke para la liga activa. Si el
  Pokémon no está rankeado en esa liga, el primer rápido y los dos primeros
  cargados legales del gamemaster. **La edición del moveset queda pendiente**
  hasta que exista una mesa de trabajo que la dibuje.
- **Cambio de liga con equipos cargados**: se conservan los Pokémon; solo
  cambian el ranking del buscador y el moveset por defecto.
- **Rivales**: se limpian con "Nuevo combate". Tu equipo persiste entre
  combates y sesiones (`localStorage`).
- **El mismo Pokémon dos veces**: permitido. Nunca más de tres por lado; con el
  equipo completo el buscador lo avisa y no agrega.
- **Una sola Mega por equipo**, contando los Primales, como en el juego. Si
  un lado ya tiene una, el buscador de ese lado deja de mostrar Megas y el pie
  lo avisa. Vale igual para tu equipo y para el del rival. La marca sale de la
  etiqueta `mega` de PvPoke.
- **Datos faltantes**: un Pokémon sin ataques en el gamemaster se muestra con
  tipos y debilidades y un estado vacío explícito en el bloque de ataques.
- **Recorrido guiado**: cada paso se apoya sobre la pantalla del estado que
  corresponde usando los mismos Pokémon de las mesas (Azumarill, Medicham,
  Melmetal, Altaria, Skarmory). Al terminar se vuelve al estado real.

## Atajos por defecto

| Acción | Tecla |
| --- | --- |
| Agregar rival / aliado | Ctrl A / Ctrl S |
| Poner rival en campo | 1 2 3 |
| Poner aliado en campo | Shift 1 2 3 |
| Nuevo combate | N |
| Cambiar de liga | L |
| Configuración | Ctrl , |
| Quitar el seleccionado | Ctrl Supr (sobre la ficha con foco) |
| Cerrar o cancelar | Esc (fijo) |

"Nuevo combate" y "Cambiar de liga" van sin Ctrl porque Chrome no deja
interceptar Ctrl N ni Ctrl L. Las teclas sueltas no actúan mientras hay un
modal abierto o se está escribiendo. Todo se edita en Configuración; Esc no.
Las combinaciones que se reserva el navegador (Ctrl W, Ctrl T, Ctrl N, Ctrl L,
Ctrl Tab, Alt F4) se rechazan al capturarlas.

## Tests, lint y build

```bash
npm test
npx eslint src
npm run build   # export estático en out/
```

## Fuera de alcance por ahora

Escudos, daño en porcentaje de vida, CMP, contador de energía en vivo,
temporizador de cambio, edición del moveset. Están investigados pero no
decididos: no se implementan sin hablarlo antes.
