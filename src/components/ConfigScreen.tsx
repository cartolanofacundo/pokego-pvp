import { ACTIONS, type ActionId, type Combo } from "@/lib/shortcuts";
import { Kbd } from "./Kbd";
import { BackIcon, PencilIcon, ResetIcon } from "./Icons";

/**
 * Configuración de atajos (Config.dc.html traducida a 1920, esquinas
 * cortadas). La fila entera es el botón. Esc figura como FIJO y no se edita.
 */
export function ConfigScreen({
  shortcuts,
  onEdit,
  onRestoreDefaults,
  onBack,
}: {
  shortcuts: Record<ActionId, Combo | null>;
  onEdit: (id: ActionId) => void;
  onRestoreDefaults: () => void;
  onBack: () => void;
}) {
  const groups: Array<{ title: string; ids: ActionId[] }> = [
    { title: "EN COMBATE", ids: ["rival1", "rival2", "rival3", "ally1", "ally2", "ally3"] },
    { title: "EQUIPOS", ids: ["addRival", "addAlly", "removeSelected", "newBattle"] },
    { title: "GENERAL", ids: ["cycleLeague", "openConfig", "close"] },
  ];

  const row = (id: ActionId) => {
    const def = ACTIONS.find((a) => a.id === id)!;
    if (def.fixed) {
      return (
        <div key={id} className="cfg-row cfg-row--fixed">
          <span className="cfg-row__label">{def.label}</span>
          <Kbd combo={shortcuts[id]} />
          <span className="mono" style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.14em", color: "#6B7480" }}>FIJO</span>
        </div>
      );
    }
    return (
      <button key={id} type="button" className="cfg-row" onClick={() => onEdit(id)} aria-label={`${def.label}: ${shortcuts[id] ? "" : "sin atajo, "}editar`}>
        <span className="cfg-row__label">{def.label}</span>
        <Kbd combo={shortcuts[id]} />
        <PencilIcon />
      </button>
    );
  };

  return (
    <div
      style={{
        position: "relative", width: 1920, height: 1080, display: "flex", flexDirection: "column",
        background: "radial-gradient(760px 520px at 78% 8%, rgba(160,174,186,0.06), rgba(160,174,186,0) 62%), #080A0D",
        color: "#F2F3F5", overflow: "hidden",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 68, padding: "0 48px", flexShrink: 0 }}>
        <button type="button" className="btn" style={{ padding: "0 16px 0 12px", gap: 10, fontSize: 15, background: "rgba(255,255,255,0.055)" }} onClick={onBack}>
          <BackIcon />
          <span>Combate</span>
        </button>
        <button type="button" className="btn btn--ghost" onClick={onRestoreDefaults}>
          <ResetIcon />
          <span>Restaurar valores por defecto</span>
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "8px 48px 40px", flexGrow: 1, minHeight: 0 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, width: 1120 }}>
          <span className="display" style={{ fontSize: 44, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.05 }}>Configuración</span>
          <span className="label" style={{ fontSize: 11, color: "#8B94A0" }}>ATAJOS DE TECLADO</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 48, width: 1120, marginTop: 36 }}>
          <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
            <span className="label label--rail" style={{ color: "#7C8694", marginBottom: 12 }}>{groups[0].title}</span>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{groups[0].ids.map(row)}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
            <span className="label label--rail" style={{ color: "#7C8694", marginBottom: 12 }}>{groups[1].title}</span>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{groups[1].ids.map(row)}</div>
            <span className="label label--rail" style={{ color: "#7C8694", margin: "28px 0 12px" }}>{groups[2].title}</span>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{groups[2].ids.map(row)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
