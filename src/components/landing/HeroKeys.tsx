"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** 1 y 2 llevan a Combate y Rankeador, salvo que el foco esté en un campo. */
export function HeroKeys() {
  const router = useRouter();
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.ctrlKey || e.altKey || e.metaKey) return;
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable)) return;
      if (e.key === "1") router.push("/combate/");
      else if (e.key === "2") router.push("/rankeador/");
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);
  return null;
}
