import { LayoutGrid, Medal } from 'lucide-react';

export const THIRDS_KEY = 'terceros';

interface Props {
  groups: string[];
  selected: string | null;
  onSelect: (group: string | null) => void;
}

export default function GroupSelector({ groups, selected, onSelect }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => onSelect(null)}
        className={`inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-w3-sm border px-3 py-2 text-sm font-semibold transition-colors sm:px-3.5 ${
          selected === null
            ? 'border-w3-primary bg-w3-primary text-w3-black'
            : 'border-w3-border bg-w3-surface text-w3-text-secondary hover:text-w3-white'
        }`}
      >
        <LayoutGrid className="h-3.5 w-3.5" />
        <span className="whitespace-nowrap">Todos los grupos</span>
      </button>

      <button
        type="button"
        onClick={() => onSelect(THIRDS_KEY)}
        className={`inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-w3-sm border px-3 py-2 text-sm font-semibold transition-colors sm:px-3.5 ${
          selected === THIRDS_KEY
            ? 'border-w3-primary bg-w3-primary text-w3-black'
            : 'border-w3-border bg-w3-surface text-w3-text-secondary hover:text-w3-white'
        }`}
      >
        <Medal className="h-3.5 w-3.5" />
        <span className="whitespace-nowrap">Terceros</span>
      </button>

      <div className="hidden h-6 w-px shrink-0 bg-w3-border sm:block" />

      {groups.map((g) => (
        <button
          key={g}
          type="button"
          onClick={() => onSelect(g)}
          className={`inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-w3-sm border px-3 py-2 text-sm font-bold transition-colors sm:px-3.5 ${
            selected === g
              ? 'border-w3-primary bg-w3-primary text-w3-black'
              : 'border-w3-border bg-w3-surface text-w3-text-secondary hover:text-w3-white'
          }`}
        >
          {selected === g && (
            <span className="text-sm font-semibold">Grupo</span>
          )}
          {g}
        </button>
      ))}
    </div>
  );
}
