import Link from "next/link";
import { Brand, type Section } from "@/components/NavLinks";
import { ShareButtons } from "@/components/landing/ShareButtons";
import { SITE_URL } from "@/lib/site";

/**
 * Combate y Rankeador son un lienzo de escritorio (mínimo 1280 de ancho), y
 * las dos rutas son indexables, así que alguien puede llegar desde el
 * buscador con el teléfono. Por debajo de 900px de ancho (`.tool-mobile` /
 * `.tool-desktop` en globals.css) se muestra esto en lugar de la herramienta:
 * la misma tarjeta ámbar de la landing mobile, con el enlace de esta sección
 * ya cargado en Copiar enlace y Compartir. El H1 y el metadata de la página
 * no cambian, son los mismos para SEO en cualquier ancho.
 */
export function ToolMobileNotice({ section, path }: { section: Section; path: string }) {
  const shareUrl = `${SITE_URL}${path}`;
  return (
    <div className="tool-mobile">
      <header className="land-header">
        <Brand current={section} />
      </header>
      <div className="tool-mobile__body">
        <div className="land-mobile-banner" style={{ display: "flex" }}>
          <span className="land-mobile-banner__title">
            <span className="land-mobile-banner__dot" aria-hidden="true" />
            Las herramientas se abren en la compu
          </span>
          <p>Jugás en el celu y mirás las stats en la pantalla grande. Mandate el enlace y abrilo allá.</p>
          <ShareButtons url={shareUrl} />
        </div>
        <Link href="/" className="tool-mobile__back">← Volver a Inicio</Link>
      </div>
    </div>
  );
}
