import { weaknesses, resistances } from "@/lib/types";
import { TypeChip } from "./TypeChip";

export function WeaknessPanel({ types }: { types: readonly (string | null | undefined)[] }) {
  const weak = weaknesses(types);
  const resist = resistances(types);

  return (
    <div className="gb-box p-1.5 text-[8px] flex flex-col gap-1 min-w-[110px]">
      <div>
        <div className="font-bold text-red-700 mb-0.5">Débil a</div>
        <div className="flex flex-wrap gap-0.5">
          {weak.length === 0 && <span className="text-neutral-500">—</span>}
          {weak.map((w) => (
            <TypeChip key={w.type} type={w.type} size="sm" />
          ))}
        </div>
      </div>
      <div>
        <div className="font-bold text-green-700 mb-0.5">Resiste</div>
        <div className="flex flex-wrap gap-0.5">
          {resist.length === 0 && <span className="text-neutral-500">—</span>}
          {resist.map((r) => (
            <TypeChip key={r.type} type={r.type} size="sm" />
          ))}
        </div>
      </div>
    </div>
  );
}
