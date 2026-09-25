import type { Metadata } from "next";
import Link from "next/link";
import { Brand } from "@/components/NavLinks";
import { withBasePath } from "@/lib/basePath";
import { APP_NAME, DATA_UPDATED, SITE_DESCRIPTION, SITE_URL, formatDateEs } from "@/lib/site";
import { CAP_LEAGUES, RANKER_LEAGUES, type RankerLeagueKey } from "@/lib/ranker/data";
import { analyzeEntry, type BoxEntry, type Cell } from "@/lib/ranker/analysis";
import type { RankSettings } from "@/lib/ranker/ivrank";
import { formatLevel } from "@/lib/ranker/cp";
import { fmt } from "@/lib/ranker/format";
import { HeroKeys } from "@/components/landing/HeroKeys";
import { ShareButtons } from "@/components/landing/ShareButtons";
import { CombateFooter, RankeadorFooter } from "@/components/landing/CardFooters";

const title = `Stats de PvP en vivo y ranking de IV para Pokémon GO · ${APP_NAME}`;
const updatedEs = formatDateEs(DATA_UPDATED);

export const metadata: Metadata = {
  title: { absolute: title },
  description: SITE_DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/` },
  openGraph: { title, description: SITE_DESCRIPTION, url: `${SITE_URL}/`, locale: "es_AR" },
};

// ---------- Ejemplo real del rankeador (calculado en el build, no a mano) ----------
// El mismo Mudkip 1/14/12 que verificamos contra el diseño: para cada tope de
// liga, la forma (él mismo, su evolución o su Mega) que logra mejor rango.
const MUDKIP_EXAMPLE: BoxEntry = {
  id: "landing-example",
  speciesId: "mudkip",
  atk: 1,
  def: 14,
  sta: 12,
  cp: 429,
  level: 15,
  variant: "normal",
  lucky: false,
  addedAt: 0,
};
const EXAMPLE_SETTINGS: RankSettings = { maxLevel: 50, minIv: 0 };

// La forma a mostrar por columna: no "la de mejor rango" (un rango crudo no
// se compara entre especies distintas, así que eso a veces repetía la Mega en
// dos columnas), sino la que ilustra que conviene evolucionar distinto según
// la liga, igual que en el ejemplo verificado con el diseñador.
const EXAMPLE_FORM: Record<string, string> = { little: "mudkip", great: "swampert", ultra: "swampert_mega", master: "swampert" };

function landingExample() {
  const results = analyzeEntry(MUDKIP_EXAMPLE, EXAMPLE_SETTINGS);
  return CAP_LEAGUES.map((league, i) => {
    const r = results.find((res) => res.target.species.id === EXAMPLE_FORM[league.key])!;
    const cell: Cell = r.cells[i];
    return { league, speciesName: r.target.species.name, cell };
  });
}
const EXAMPLE_ROWS = landingExample();

const LEAGUE_NOTE: Record<RankerLeagueKey, string> = {
  little: "Solo Pokémon que todavía no evolucionaron.",
  great: "La liga más jugada. Premia IV con poco ataque.",
  ultra: "Entran casi todas las evoluciones finales.",
  master: "Gana el que tiene más stats: los IV altos mandan.",
  megagreat: "Como Great League, con una Mega por equipo.",
  megaultra: "Como Ultra League, con una Mega por equipo.",
  megamaster: "Como Master League, con una Mega por equipo.",
};

const FAQ: { q: string; a: string }[] = [
  {
    q: `¿${APP_NAME} es gratis?`,
    a: "Sí. No tiene planes pagos ni pide cuenta. Lo que cargás (tu equipo y tu caja) queda guardado en tu navegador, en tu compu.",
  },
  {
    q: "¿Se puede usar desde el celular?",
    a: "La página se lee bien en el celu, pero el combate en vivo y el rankeador están pensados para la compu: la idea es jugar en el teléfono y mirar las stats en una pantalla grande, al costado.",
  },
  {
    q: "¿Qué significa que un Pokémon sea rango 1?",
    a: `Que de las 4.096 combinaciones de IV posibles para esa especie, la suya es la que logra el mayor producto de stats sin pasarse del tope de PC de la liga. En ${APP_NAME} marcamos en verde del 1 al 100.`,
  },
  {
    q: "¿Por qué en Great League conviene poco ataque?",
    a: "Porque el tope de PC frena antes a los que tienen mucho ataque: llegan al límite en un nivel más bajo y se quedan con menos defensa y PS. Un IV de ataque bajo sube más niveles antes de tocar el tope y termina con más stats totales, aunque pegue un poco menos. Por eso el rango 1 de Great League casi siempre tiene 0 o 1 de ataque.",
  },
  {
    q: "¿Por qué importa el puesto en PvPoke?",
    a: "Porque el rango de IV solo compara a tu Pokémon contra los demás de su misma especie: no dice si esa especie sirve en la liga. Un rango 4 de una especie que está #400 en PvPoke difícilmente te gane combates; un rango 200 de una especie top 10 puede rendir mejor. Por eso los dos números se leen juntos.",
  },
  {
    q: "¿Es lo mismo el rango que el porcentaje?",
    a: "No. El rango es la posición entre las 4.096 combinaciones (1 es la mejor, 4.096 la peor); el porcentaje compara el producto de stats de esa combinación contra el del rango 1 de esa misma especie y liga. Cerca de la punta las diferencias son mínimas, así que un rango 50 puede tener 99 % igual: por eso ordenamos por rango y no por porcentaje.",
  },
  {
    q: "¿De dónde salen los datos?",
    a: "Los puestos por liga y los movimientos salen de PvPoke; los stats base, los tipos y los sprites, de PokeAPI; los multiplicadores de PC por nivel y los costos de subida, de la Game Master de Pokémon GO. Los tres se actualizan cuando cambia el meta o sale un Pokémon nuevo.",
  },
  {
    q: `¿${APP_NAME} se conecta con Pokémon GO?`,
    a: "No. No pide tu cuenta ni se conecta al juego de ninguna forma: escribís a mano los IV, el PC y tu equipo, y todo queda guardado solo en tu navegador.",
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#web`,
      url: `${SITE_URL}/`,
      name: APP_NAME,
      inLanguage: "es-AR",
    },
    {
      "@type": "WebApplication",
      "@id": `${SITE_URL}/#app`,
      name: APP_NAME,
      url: `${SITE_URL}/`,
      description: "Stats de combate PvP de Pokémon GO en tiempo real y ranking de IV por liga.",
      applicationCategory: "GameApplication",
      operatingSystem: "Navegador de escritorio (Windows, macOS, Linux)",
      inLanguage: "es-AR",
      isAccessibleForFree: true,
      offers: { "@type": "Offer", price: "0", priceCurrency: "ARS" },
      featureList: [
        "Multiplicadores de daño en vivo",
        "Turnos hasta el ataque cargado",
        "Ranking de IV por liga para cada evolución y Mega",
        "Costo en polvo y caramelos para llegar al nivel",
      ],
      dateModified: DATA_UPDATED || undefined,
    },
    {
      "@type": "FAQPage",
      mainEntity: FAQ.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
  ],
};

export default function Home() {
  const shareUrl = `${SITE_URL}/`;

  return (
    <div className="land-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <HeroKeys />

      <header className="land-header">
        <Brand current="inicio" />
        <span className="land-header__ctas">
          <Link href="/combate/" className="btn" style={{ background: "rgba(255,255,255,0.12)" }}>
            Ir al combate
          </Link>
          <Link href="/rankeador/" className="btn btn--primary">
            Ir al rankeador
          </Link>
        </span>
      </header>

      <main>
        <section aria-labelledby="h1" className="land-hero">
          <div className="land-hero__inner">
            <span className="land-hero__eyebrow">Pokémon GO · PvP · en español</span>
            <h1 id="h1" className="land-hero__h1">
              Stats de PvP en vivo y ranking de IV para Pokémon GO
            </h1>
            <p className="land-hero__lead">
              {APP_NAME} es una herramienta gratis para la compu: mientras combatís en el celular te muestra qué te pega y qué le pegás, y te dice qué
              Pokémon de tu caja sirven para cada liga.
            </p>

            <div className="land-mobile-banner">
              <span className="land-mobile-banner__title">
                <span className="land-mobile-banner__dot" aria-hidden="true" />
                Las herramientas se abren en la compu
              </span>
              <p>Jugás en el celu y mirás las stats en la pantalla grande. Mandate el enlace y abrilo allá.</p>
              <ShareButtons url={shareUrl} />
            </div>

            <div className="land-cards">
              <Link href="/combate/" className="land-card">
                <span className="land-card__top">
                  <span className="land-card__id">
                    <span className="land-card__num">1</span>
                    <span className="land-card__label">Combate</span>
                  </span>
                  <span style={{ display: "flex", gap: 14 }}>
                    <span className="land-card__stat" style={{ color: "var(--red-text)" }}>×1,6</span>
                    <span className="land-card__stat" style={{ color: "var(--ink-3)" }}>×1</span>
                    <span className="land-card__stat" style={{ color: "var(--green-text)" }}>×0,63</span>
                  </span>
                </span>
                <h2>Stats en vivo del combate</h2>
                <p>Cargás tu equipo y el del rival con el teclado. Ves qué ataque te pega fuerte, qué le hacés vos, cuántos turnos faltan para el cargado y a quién conviene cambiar.</p>
                <span className="land-card__cta-row">
                  <span className="btn btn--primary">
                    Ir al combate
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M3 7h8M7.5 3.5L11 7l-3.5 3.5" stroke="#0B0D11" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </span>
                  <span className="land-card__hint">o tocá <span className="kbd kbd--sm">1</span></span>
                </span>
                <span className="land-card__foot"><CombateFooter /></span>
              </Link>

              <Link href="/rankeador/" className="land-card">
                <span className="land-card__top">
                  <span className="land-card__id">
                    <span className="land-card__num">2</span>
                    <span className="land-card__label">Rankeador</span>
                  </span>
                  <span style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                    <span className="land-card__stat" style={{ color: "var(--green-text)" }}>#4</span>
                    <span className="rk-cost" style={{ color: "var(--green-text)" }}>GREAT</span>
                    <span className="rk-cost" style={{ marginLeft: 6 }}>PVPOKE</span>
                    <span className="land-card__stat">#78</span>
                  </span>
                </span>
                <h2>Ranking de IV por liga</h2>
                <p>Escribís IV y PC como aparecen en el juego. Te dice el rango en Little, Great, Ultra y Master para cada evolución y Mega, y cuánto polvo y caramelos cuesta llegar.</p>
                <span className="land-card__cta-row">
                  <span className="btn btn--primary">
                    Ir al rankeador
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M3 7h8M7.5 3.5L11 7l-3.5 3.5" stroke="#0B0D11" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </span>
                  <span className="land-card__hint">o tocá <span className="kbd kbd--sm">2</span></span>
                </span>
                <span className="land-card__foot"><RankeadorFooter /></span>
              </Link>
            </div>

            <span className="land-hero__badges">
              GRATIS · SIN CUENTA · EN ESPAÑOL · DATOS DE PVPOKE Y POKEAPI{updatedEs ? ` · ACTUALIZADO ${updatedEs}` : ""}
            </span>
          </div>
        </section>

        <div className="land-sections">
          <section aria-labelledby="combate" className="land-section">
            <div className="land-section__head">
              <span className="land-section__eyebrow">Combate</span>
              <h2 id="combate">Cómo funciona el combate en vivo</h2>
            </div>
            <p>Arriba, el rival y sus ataques. Abajo, vos. Cada ataque trae su multiplicador contra el que tiene enfrente, la energía que suma o gasta y los turnos que tarda. Todo grande, para leerlo de reojo sin soltar el celu.</p>
            <figure className="land-figure">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={withBasePath("/images/landing/combate.webp")}
                alt={`Pantalla de combate de ${APP_NAME}: un rival con un ataque marcado en rojo por ser muy efectivo, el equipo propio abajo con sus ataques y la banca al costado.`}
                width={1440}
                height={810}
                loading="lazy"
              />
            </figure>
            <div className="land-steps">
              <div className="land-step">
                <span className="land-step__n">PASO 1</span>
                <h3>Cargá los dos equipos</h3>
                <p>Ctrl A agrega un rival y Ctrl S uno tuyo. Escribís las primeras letras y listo: no hace falta el mouse.</p>
              </div>
              <div className="land-step">
                <span className="land-step__n">PASO 2</span>
                <h3>Leé los multiplicadores</h3>
                <p>Cada ataque muestra cuánto pega: ×1,6 es súper efectivo, ×0,63 poco efectivo, ×0,39 doble resistencia. Verde es a tu favor, rojo en contra.</p>
              </div>
              <div className="land-step">
                <span className="land-step__n">PASO 3</span>
                <h3>Cambiá a tiempo</h3>
                <p>La banca dice quién le gana al rival que está en campo. Si el que tenés afuera pierde, lo ves antes de que caiga el cargado.</p>
              </div>
            </div>
          </section>

          <section aria-labelledby="ranking" className="land-section">
            <div className="land-section__head">
              <span className="land-section__eyebrow">Rankeador</span>
              <h2 id="ranking">Cómo se calcula el ranking de IV</h2>
            </div>
            <div className="land-ranking">
              <div className="land-ranking__text">
                <p><b>El rango de IV ordena las 4.096 combinaciones posibles de ataque, defensa y PS de una especie</b>, de la que más stats totales logra dentro del tope de PC de la liga (rango 1) a la que menos logra (rango 4.096).</p>
                <p>Por eso el &ldquo;hundo&rdquo; 15/15/15 casi nunca sirve en Great League: llega al tope de 1.500 PC antes, en un nivel más bajo, y termina con menos defensa y PS que un 0/15/15 que sube más.</p>
                <div className="land-formula">
                  <span className="land-formula__label">Producto de stats</span>
                  <code>
                    Ataque × Defensa × PS
                    <br />
                    <span style={{ color: "var(--ink-4)" }}>al nivel más alto que no pasa el tope de PC</span>
                  </code>
                </div>
                <p>En {APP_NAME}, verde es rango 100 o mejor. Del 101 para abajo va en gris: no es un error, es un Pokémon que conviene guardar para otra liga o transferir.</p>
                <p><b>Al lado de cada rango va el puesto de la especie en PvPoke</b>, porque un buen IV no alcanza: un rango 4 de una especie que nadie juega en esa liga no te va a ganar combates.</p>
              </div>
              <div className="land-example">
                <div className="land-example__head">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={withBasePath("/sprites/pixel/mudkip.png")} alt="" width={88} height={88} />
                  <div>
                    <div className="land-example__title">Un Mudkip 1 / 14 / 12</div>
                    <div className="land-example__meta">429 PC · NIVEL 15 · EJEMPLO REAL</div>
                  </div>
                </div>
                <table className="land-table">
                  <caption>El mejor rango de este Mudkip en cada liga según en qué lo evolucionás, y el puesto de esa forma en PvPoke.</caption>
                  <thead>
                    <tr>
                      <th scope="col"><span>Liga</span></th>
                      <th scope="col"><span>Forma</span></th>
                      <th scope="col"><span>Rango IV</span></th>
                      <th scope="col"><span>PvPoke</span></th>
                      <th scope="col" className="land-col-pc" style={{ textAlign: "right" }}><span>Rinde en</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {EXAMPLE_ROWS.map((r) => (
                      <tr key={r.league.key}>
                        <th scope="row">{r.league.short}</th>
                        <td style={{ color: "var(--ink-3)" }}>{r.speciesName}</td>
                        <td><span className="land-table__rank">#{r.cell.row!.rank}</span></td>
                        <td>
                          <span className={`land-table__pv ${r.cell.pvpoke ? "" : "land-table__pv--none"}`}>
                            {r.cell.pvpoke ? `#${fmt(r.cell.pvpoke)}` : "—"}
                          </span>
                        </td>
                        <td className="land-col-pc" style={{ textAlign: "right", fontSize: 14.5, color: "var(--ink-3)" }}>
                          {fmt(r.cell.row!.cp)} PC · nv {formatLevel(r.cell.row!.level)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <figure className="land-figure">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={withBasePath("/images/landing/rankeador.webp")}
                alt={`Rankeador de ${APP_NAME}: un Mudkip 1/14/12 con una fila por forma (Mudkip, Marshtomp, Swampert, Mega Swampert) y una columna por liga; cada celda muestra el rango IV (en verde si es 100 o mejor) y el puesto en PvPoke de esa forma en esa liga.`}
                width={1440}
                height={810}
                loading="lazy"
              />
            </figure>
          </section>

          <section aria-labelledby="ligas" className="land-section">
            <div className="land-section__head">
              <span className="land-section__eyebrow">Ligas</span>
              <h2 id="ligas">Ligas que cubre</h2>
            </div>
            <table className="land-table land-leagues">
              <thead>
                <tr>
                  <th scope="col"><span>Liga</span></th>
                  <th scope="col"><span>Tope de PC</span></th>
                  <th scope="col"><span>Qué tener en cuenta</span></th>
                </tr>
              </thead>
              <tbody>
                {RANKER_LEAGUES.map((l) => (
                  <tr key={l.key}>
                    <th scope="row">{l.label}</th>
                    <td className="land-cap">{Number.isFinite(l.cap) ? fmt(l.cap) : "Sin tope"}</td>
                    <td className="land-note">{LEAGUE_NOTE[l.key]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section aria-labelledby="faq" className="land-section">
            <div className="land-section__head">
              <span className="land-section__eyebrow">Dudas</span>
              <h2 id="faq">Preguntas frecuentes</h2>
            </div>
            <div className="land-faq">
              {FAQ.map((f, i) => (
                <details key={f.q} open={i < 3}>
                  <summary>
                    <h3>{f.q}</h3>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M3.5 5.5L7 9l3.5-3.5" stroke="#C2C9D2" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </summary>
                  <p>{f.a}</p>
                </details>
              ))}
            </div>
          </section>

          <section aria-labelledby="fuentes" className="land-section">
            <div className="land-section__head">
              <span className="land-section__eyebrow">Datos</span>
              <h2 id="fuentes">Fuentes y actualización</h2>
            </div>
            <p>Los datos se actualizan cuando cambia el meta o sale un Pokémon nuevo. La fecha de cada fuente está a la vista para que sepas si el número es de esta temporada.</p>
            <div className="land-sources">
              <div className="land-source">
                <span className="land-source__name"><a href="https://pvpoke.com/" target="_blank" rel="noopener noreferrer">PvPoke</a></span>
                <span className="land-source__desc">Puestos por liga y movimientos</span>
                {updatedEs && <span className="land-source__date">ACTUALIZADO {updatedEs}</span>}
              </div>
              <div className="land-source">
                <span className="land-source__name"><a href="https://pokeapi.co/" target="_blank" rel="noopener noreferrer">PokeAPI</a></span>
                <span className="land-source__desc">Stats base, tipos y sprites</span>
                {updatedEs && <span className="land-source__date">ACTUALIZADO {updatedEs}</span>}
              </div>
              <div className="land-source">
                <span className="land-source__name">Game Master</span>
                <span className="land-source__desc">Multiplicadores de PC por nivel y costos</span>
                {updatedEs && <span className="land-source__date">VERSIÓN DEL {updatedEs}</span>}
              </div>
            </div>
          </section>
        </div>

        <footer className="land-footer">
          <div className="land-footer__row">
            <span className="land-footer__brand">{APP_NAME}</span>
            <nav aria-label="Pie">
              <Link href="/combate/">Combate</Link>
              <Link href="/rankeador/">Rankeador</Link>
              <a href="#faq">Preguntas</a>
              <a href="#fuentes">Fuentes</a>
            </nav>
          </div>
          <p>
            {APP_NAME} es un proyecto de fans y no está afiliado, patrocinado ni aprobado por Niantic, Nintendo, Game Freak ni The Pokémon Company. Pokémon y
            Pokémon GO son marcas de sus respectivos dueños. Sprites de PokeAPI; rankings de PvPoke.
          </p>
        </footer>
      </main>
    </div>
  );
}
