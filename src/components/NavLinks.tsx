"use client";

import Link from "next/link";

export type Section = "inicio" | "combate" | "rankeador";

const ITEMS: { key: Section; label: string; href: string }[] = [
  { key: "inicio", label: "Inicio", href: "/" },
  { key: "combate", label: "Combate", href: "/combate/" },
  { key: "rankeador", label: "Rankeador", href: "/rankeador/" },
];

/**
 * Menú de secciones del encabezado. La sección actual queda marcada y no es
 * un link. En mobile (900px o menos) las tres pestañas no entran al lado de
 * la marca sin partirla en dos líneas, así que se ocultan (`.nav-link-list`)
 * y en su lugar se ve un menú desplegable (`.nav-menu-mobile`), con las
 * mismas opciones.
 */
export function NavLinks({ current }: { current: Section }) {
  return (
    <nav aria-label="Secciones" style={{ display: "flex", alignItems: "center" }}>
      <span className="nav-link-list">
        {ITEMS.map((it) =>
          it.key === current ? (
            <span key={it.key} className="nav-link nav-link--current" aria-current="page">
              {it.label}
            </span>
          ) : (
            <Link key={it.key} href={it.href} className="nav-link">
              {it.label}
            </Link>
          )
        )}
      </span>

      <details className="nav-menu-mobile">
        <summary aria-label="Abrir menú de secciones">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M3 5.5h14M3 10h14M3 14.5h14" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" />
          </svg>
        </summary>
        <div className="nav-menu-mobile__list">
          {ITEMS.map((it) =>
            it.key === current ? (
              <span key={it.key} className="nav-menu-mobile__item nav-menu-mobile__item--current" aria-current="page">
                {it.label}
              </span>
            ) : (
              <Link key={it.key} href={it.href} className="nav-menu-mobile__item">
                {it.label}
              </Link>
            )
          )}
        </div>
      </details>
    </nav>
  );
}

/** Marca del encabezado con el menú, igual en todas las secciones. */
export function Brand({ current }: { current: Section }) {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 20 }}>
      <span className="display" style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.03em" }}>
        PokéGO PVP
      </span>
      <NavLinks current={current} />
    </span>
  );
}
