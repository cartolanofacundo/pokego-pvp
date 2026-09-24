"use client";

import Link from "next/link";

export type Section = "inicio" | "combate" | "rankeador";

const ITEMS: { key: Section; label: string; href: string }[] = [
  { key: "inicio", label: "Inicio", href: "/" },
  { key: "combate", label: "Combate", href: "/combate/" },
  { key: "rankeador", label: "Rankeador", href: "/rankeador/" },
];

/** Menú de secciones del encabezado. La sección actual queda marcada y no es un link. */
export function NavLinks({ current }: { current: Section }) {
  return (
    <nav aria-label="Secciones" style={{ display: "flex", alignItems: "center", gap: 4 }}>
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
