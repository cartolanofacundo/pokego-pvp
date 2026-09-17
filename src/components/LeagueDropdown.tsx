import { LEAGUES, type LeagueKey } from "@/lib/data";

/** Desplegable de liga, discreto: se toca ~1 vez por sesión, no necesita protagonismo. */
export function LeagueDropdown({
  value,
  onChange,
}: {
  value: LeagueKey;
  onChange: (league: LeagueKey) => void;
}) {
  return (
    <label className="flex flex-col gap-0.5 text-[8px] text-neutral-400">
      Liga
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as LeagueKey)}
        className="text-[9px] px-2 py-1.5 rounded border-2 border-black bg-neutral-800 text-neutral-100"
      >
        {LEAGUES.map((l) => (
          <option key={l.key} value={l.key}>
            {l.label} (CP {l.cp})
          </option>
        ))}
      </select>
    </label>
  );
}
