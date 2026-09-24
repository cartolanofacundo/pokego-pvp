"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";
import { Viewport } from "@/components/Viewport";
import { Brand } from "@/components/NavLinks";
import { loadJSON } from "@/lib/storage";

// Resumen de lo guardado, leído una sola vez del localStorage del navegador.
function readSummary() {
  const box = loadJSON<{ entries?: unknown[] }>("pokego-pvp:box:v1", { entries: [] });
  const battle = loadJSON<{ team?: (string | null)[] }>("pokego-pvp:v3", { team: [] });
  return `${box.entries?.length ?? 0}|${(battle.team ?? []).filter(Boolean).length}`;
}
const subscribe = () => () => {};

const SECTIONS = [
  {
    key: "1",
    href: "/combate/",
    title: "Combate",
    text: "La segunda pantalla para pelear: tu equipo y el del rival, qué ataque te pega fuerte, cuánto tarda cada cargado y a quién mandar.",
  },
  {
    key: "2",
    href: "/rankeador/",
    title: "Rankeador",
    text: "El rango de IV de cada Pokémon en cada liga, con sus evoluciones y lo que cuesta llegar. Tu pokédex con los que tienen rango 100 o mejor.",
  },
];

export default function Home() {
  const router = useRouter();
  const summary = useSyncExternalStore(subscribe, readSummary, () => "0|0");
  const [boxCount, teamCount] = summary.split("|").map(Number);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.altKey || e.metaKey) return;
      const s = SECTIONS.find((x) => x.key === e.key);
      if (s) router.push(s.href);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  const details = [
    teamCount ? `${teamCount} de 3 en tu equipo` : "Todavía sin equipo cargado",
    boxCount ? `${boxCount} Pokémon en tu caja` : "Tu caja está vacía",
  ];

  return (
    <Viewport>
      <main
        style={{
          position: "relative", width: "100%", height: "var(--h)", overflow: "hidden",
          background: "radial-gradient(900px 600px at 30% 20%, rgba(92,152,236,0.12), rgba(92,152,236,0) 70%), radial-gradient(900px 600px at 75% 85%, rgba(255,92,92,0.10), rgba(255,92,92,0) 70%), #080A0D",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", height: 60, padding: "0 48px" }}>
          <Brand current="inicio" />
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "calc(100% - 60px)", gap: 48, paddingBottom: 60 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
            <span className="label" style={{ fontSize: 11, color: "#A8B0BB" }}>ELEGÍ UNA SECCIÓN</span>
            <h1 className="display" style={{ margin: 0, fontSize: 64, fontWeight: 800, letterSpacing: "-0.04em" }}>PokéGO PVP</h1>
          </div>

          <div style={{ display: "flex", gap: 32 }}>
            {SECTIONS.map((s, i) => (
              <Link key={s.href} href={s.href} className="home-card">
                <span className="panel__edge" style={{ left: 22 }} />
                <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span className="display" style={{ fontSize: 34, fontWeight: 800, letterSpacing: "-0.03em" }}>{s.title}</span>
                  <span className="kbd" style={{ height: 30, padding: "0 12px", fontSize: 14 }}>{s.key}</span>
                </span>
                <span style={{ fontSize: 17, lineHeight: 1.55, color: "#B4BCC6" }}>{s.text}</span>
                <span className="label" style={{ marginTop: "auto", fontSize: 11, color: "#A8B0BB" }}>{details[i]}</span>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </Viewport>
  );
}
