import { LEAGUES, type LeagueKey } from "@/lib/data";

export function LeagueSelector({
  value,
  onChange,
}: {
  value: LeagueKey;
  onChange: (league: LeagueKey) => void;
}) {
  return (
    <div className="flex gap-1.5 justify-center flex-wrap">
      {LEAGUES.map((l) => (
        <button
          key={l.key}
          onClick={() => onChange(l.key)}
          className={`text-[9px] px-2.5 py-2 rounded border-2 border-black transition-colors ${
            value === l.key
              ? "bg-yellow-300 text-black"
              : "bg-neutral-800 text-neutral-200 hover:bg-neutral-700"
          }`}
        >
          {l.label}
          <div className="text-[7px] opacity-70">CP {l.cp}</div>
        </button>
      ))}
    </div>
  );
}
