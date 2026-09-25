# PokéGO PVP

Segunda pantalla para PVP de Pokémon GO. Se usa en una computadora al lado del
celular mientras se pelea: cargás tu equipo una vez, vas cargando los rivales
sobre la marcha, y la pantalla te muestra qué ataque te pega fuerte, cuánto
tarda cada cargado y a quién conviene mandar. Sin API ni base de datos: todo
es estático.

Herramienta de uso individual, pensada para la compu: **Combate** y
**Rankeador** son un lienzo fijo de **1920×1080**, sin responsivo ni soporte
móvil, con el teclado primero y el ratón como plan B.

Tres rutas: **Inicio** (`/`, landing pública indexable con SEO y GEO —
ver "Landing e Inicio" más abajo), **Combate** (`/combate/`, la segunda
pantalla de arriba) y **Rankeador** (`/rankeador/`, rango de IV y pokédex, ver
más abajo). A diferencia de Combate y Rankeador, `/` sí es responsiva: es la
única pantalla pensada para abrirse desde el celular.

## Uso

```bash
npm install
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000) a pantalla completa (F11).

## Datos y sprites

Fuentes públicas, cacheadas en el repo. No se consultan en runtime.

```bash
npm run build-data          # PvPoke gamemaster + rankings -> src/data/*.json
npm run build-ranker-data   # PvPoke + game master de Niantic -> src/data/ranker/*.json
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

## Rankeador

Rango de IV para PvP de cada Pokémon cargado, en cada liga, como él mismo y
como cada evolución y cada Mega. Replica el Rank Checker de Stadium Gaming y
le suma el puesto de la especie en PvPoke y una pokédex propia.

- **Rango de IV**: para cada una de las 4096 combinaciones se busca el nivel
  más alto que no pasa el tope de CP, se calcula el producto de estadísticas a
  ese nivel y se ordena de mayor a menor; **los empates comparten el mismo
  rango** (a diferencia de Stadium Gaming, que desempata por suma de IV — así
  lo pidió el diseño). Los multiplicadores de CP salen del game master de
  Niantic en float32, truncados a 15 cifras: con otra precisión cambian los
  empates y el rango se corre.
- **Puesto en PvPoke**: al lado de cada rango, con el mismo peso visual (nunca
  en verde: el verde sigue significando solo "rango 100 o mejor"). El rango de
  IV dice qué tan bueno es tu ejemplar dentro de su especie; el puesto en
  PvPoke, qué tan buena es la especie en esa liga — los dos se leen juntos en
  la celda del detalle, en la lista de cargados y en Mi pokédex. Para un
  Oscuro, el puesto sale de la especie `<id>_shadow` de PvPoke (una entidad
  aparte, que puede no existir).
- **Costos con íconos** (polvo, caramelos, caramelos XL, energía Mega) en vez
  de texto; el detalle completo va en `title`/`aria-label`. El multiplicador
  de variante se aplica una sola vez al total de la subida, no por medio
  nivel (aplicarlo por paso da un número distinto y menor).
- **Ligas**: Little, Great, Ultra y Master, y Mega Great, Mega Ultra y Mega
  Master. El rango de IV depende solo del tope de CP, así que una liga Mega
  comparte rango con su liga base; lo que cambia es el puesto de PvPoke y que
  las Megas solo cuentan en las ligas Mega. Little usa la Little Cup real de
  PvPoke: solo entran especies sin evolucionar que todavía pueden evolucionar
  (ni Shuckle, ni Smeargle, ni Megas), sea o no que PvPoke haya publicado un
  ranking para esa especie.
- **Cuatro tipos de celda** en el detalle: con rango (verde si ≤ 100); "No
  entra" (la forma no puede jugar esa liga, p. ej. algo evolucionado en
  Little); "No llega" (ni con el nivel máximo el PC alcanza el tope de esa
  liga); "Te pasaste" (el nivel donde rendiría es menor al nivel actual: los
  niveles no se bajan). La celda MEJOR de toda la grilla se marca aparte; en
  empate de rango entre ligas distintas gana la de mayor tope de CP.
- **Variantes**: Normal, Oscuro y Purificado, más Suertudo como toggle aparte
  (un Oscuro no puede ser Suertudo). Ninguna cambia el rango de IV — la tabla
  de 4096 combinaciones es la misma —, pero sí el costo: Oscuro ×1,2, Purificado
  ×0,9 y Suertudo con el polvo a la mitad (constante real del juego, no
  publicada en el game master). Evolucionar un Purificado usa el
  `candyCostPurified` propio del game master.
- **Carga y edición**: se elige la especie (nombre o número de pokédex, `/` va
  al buscador) y se tipean IV y CP de corrido: `101313549` se ve como
  `10,13,13–549`. Enter agrega (o guarda, si se está editando) y Esc borra (o
  cancela). Ctrl ↓/↑ pasa a la especie siguiente/anterior en orden de pokédex.
  Como un "1" puede ser un IV o el comienzo de 10-15, se prueban todas las
  lecturas y el CP decide: queda la que da ese CP en algún nivel de la especie
  elegida. Si queda más de una se ofrecen las dos. La tecla `E` sobre un
  cargado (o su botón Editar) reabre el mismo campo con los valores
  precargados; si se pasa de Oscuro a Purificado se ve una vista previa del
  rango que tendría (+2 a cada IV, tope 15).
- **Cargados de esta línea**: toda la familia evolutiva (no solo la especie
  exacta), con el mejor rango de cada uno y su puesto en PvPoke.
- **Nivel actual**: sale del CP. Si ya está por encima del nivel que rendiría
  en una liga, esa celda es "Te pasaste" y no entra en Mi pokédex.
- **Ajustes**: nivel máximo (40, 41, 50 o 51; 41 y 51 son con mejor amigo),
  IV mínimo (piso de intercambio, incursión, etc.) y mostrar u ocultar el
  costo del tercer ataque.
- **Mi pokédex**: filtro de liga con contador de cuántos sirven en cada una
  (← → para moverse). "Rango 100 o mejor" muestra la tabla ordenada por
  puesto en PvPoke, en versión ancha o densa (breakpoint 1680 px, detectado
  con `matchMedia`). "Toda la caja" es una grilla de 5 columnas en orden de
  pokédex con filtro por nombre/número.
- **Borrar los que no sirven**: desde "Toda la caja", con confirmación en una
  banda (nunca un modal) que ofrece dos alcances — "en ninguna liga" (el
  seguro: solo borra lo que no sirve en absolutamente ninguna liga activada)
  o "en la liga elegida" (avisa si alguno de esos sirve en otra liga) — y
  Deshacer por 10 s (Ctrl Z incluido).
- **Guardado**: todo vive en el `localStorage` de esta computadora, versión
  `v2` de la caja (`variant`/`lucky` por cargado). Una caja `v1` vieja migra
  sola la primera vez que se abre el Rankeador. Exportar baja un JSON;
  importar un JSON exportado reemplaza la caja entera, después de confirmar
  en una banda ámbar (con la opción de exportar la actual primero).

## Landing e Inicio

`/` es a la vez la landing pública (lo que indexan los buscadores) y la
pantalla de Inicio de quien ya usa la app: el HTML que manda el servidor es
siempre la versión completa para un visitante nuevo (hero, cómo funciona el
combate, cómo se calcula el rango de IV con un ejemplo real, las siete ligas,
ocho preguntas frecuentes y las fuentes de datos); si hay datos guardados en
este navegador, al hidratar se reemplaza solo la línea de pie de cada tarjeta
de entrada por un resumen ("Tu equipo: Azumarill · Ultra League" / "Tu caja:
38 Pokémon, 14 sirven en Great · último cargado Mudkip 1/14/12 · #4 Great"),
sin mover nada más para no saltar el layout. En mobile (Google indexa la
versión móvil) las tarjetas pierden el CTA y la tecla, y arriba aparece un
aviso ámbar de "las herramientas se abren en la compu" con Copiar enlace y
Compartir (`navigator.share`, oculto si el navegador no lo tiene).

La tabla de ejemplo del Mudkip 1/14/12 se calcula en el build con el mismo
motor del Rankeador (`src/app/page.tsx`), así que sus números son siempre
reales y se actualizan solos si cambian los datos.

**SEO/GEO**: `src/lib/site.ts` centraliza `APP_NAME` y `SITE_URL`; cada ruta
pública (`/`, `/combate/`, `/rankeador/`) tiene su propio `<title>`,
`meta description` y `<link rel="canonical">` absoluto, sumados a
`sitemap.ts`, `robots.ts`, `opengraph-image.tsx` (generada en el build) y
`public/llms.txt`. `/` además lleva JSON-LD (`WebSite` + `WebApplication` +
`FAQPage`, con las mismas ocho preguntas que se ven en la página). Las
fuentes (Bricolage Grotesque, IBM Plex Mono, IBM Plex Sans) se autoalojan con
`next/font/google`; la fecha "actualizado" que se ve en el hero, en Fuentes y
en `dateModified` sale de `src/data/ranker/meta.json`, no es una constante a
mano.

**Diferencias con el diseño, a propósito**:
- Las tres vistas del Rankeador (Cargar, Mi pokédex, Toda la caja) viven bajo
  una sola ruta `/rankeador/` con pestañas por estado, no en tres rutas
  separadas como pedía el diseño. Como la caja vive en `localStorage`, el HTML
  que ve un buscador es siempre el estado vacío de "Cargar" — no hace falta
  `noindex` en las otras dos porque no existen como URL.
- Los nombres oficiales en español de las ligas (Liga Súper Bola, etc.) no se
  agregaron a la tabla de Ligas: el diseño pedía verificarlos en el juego
  antes de publicarlos y no se hizo todavía.
- Las capturas de Combate y del Rankeador (`public/images/landing/*.webp`)
  son las del mockup del diseñador, no de la app real — su propio
  `ORIGEN.md` pide reemplazarlas por capturas reales más adelante. Por lo
  mismo, la imagen OG no lleva captura (el generador de imágenes del build no
  lee WebP): es el degradé del hero con el H1 encima.
- Cinco de las ocho respuestas de las preguntas frecuentes las escribí yo
  (el diseño solo traía el texto de tres): mismo tono, sin verificar contra
  ninguna fuente más que el propio cálculo del Rankeador.
- El resumen guardado de la tarjeta de Inicio es de una sola línea de texto,
  sin los sprites en miniatura que mostraba el mockup con datos.

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
