import { useEffect, useMemo, useState } from 'react';
import {
  buildSimulatedRows,
  simulateGroupStandings,
} from '../../lib/simulateStandings';
import type {
  GroupStanding,
  MatchView,
  ThirdPlaceRanking,
} from '../../lib/types';
import GroupMatchList from './GroupMatchList';
import GroupSelector, { THIRDS_KEY } from './GroupSelector';
import GroupStandingsTable, {
  GroupStandingsOverviewCard,
} from './GroupStandingsTable';
import ThirdPlaceTable from './ThirdPlaceTable';

interface Props {
  groups: GroupStanding[];
  matches: MatchView[];
  thirdPlace: ThirdPlaceRanking;
  initialGroup: string | null;
}

export default function GroupsView({
  groups,
  matches,
  thirdPlace,
  initialGroup,
}: Props) {
  const groupLetters = groups.map((g) => g.group);
  const [selected, setSelected] = useState<string | null>(initialGroup);
  const [simulating, setSimulating] = useState(false);

  const selectedGroup = groups.find((g) => g.group === selected) ?? null;

  const groupMatches = useMemo(() => {
    if (!selected) return [];
    return matches
      .filter((m) => m.group === selected)
      .sort(
        (a, b) =>
          new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime(),
      );
  }, [matches, selected]);

  const hasPredictionsForSim = useMemo(() => {
    if (!selected) return false;
    return matches.some(
      (m) => m.group === selected && m.prediction != null,
    );
  }, [matches, selected]);

  const simulatedRows = useMemo(() => {
    if (!selectedGroup || !simulating) return null;
    const sim = simulateGroupStandings(selectedGroup, matches);
    return buildSimulatedRows(selectedGroup, sim);
  }, [selectedGroup, simulating, matches]);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (selected) {
      url.searchParams.set('grupo', selected);
    } else {
      url.searchParams.delete('grupo');
    }
    window.history.replaceState({}, '', url.toString());
  }, [selected]);

  function handleSelect(group: string | null) {
    setSelected(group);
    setSimulating(false);
  }

  const anyPlayed = groups.some((g) => g.standings.some((s) => s.mp > 0));

  return (
    <div className="space-y-6">
      <div>
        {selected === THIRDS_KEY ? (
          <>
            <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-[34px]">
              Mejores terceros
            </h1>
            <p className="mt-1.5 text-sm text-w3-text-secondary sm:text-[15px]">
              Ranking de los terceros de cada grupo. Clasifican los 8 mejores.
            </p>
          </>
        ) : selected ? (
          <>
            <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-[34px]">
              Grupo {selected}
            </h1>
            <p className="mt-1.5 text-sm text-w3-text-secondary sm:text-[15px]">
              Tabla y partidos del grupo
            </p>
          </>
        ) : (
          <>
            <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-[34px]">
              Tabla de grupos
            </h1>
            <p className="mt-1.5 text-sm text-w3-text-secondary sm:text-[15px]">
              Posiciones calculadas con los resultados de los partidos
            </p>
          </>
        )}
      </div>

      <GroupSelector
        groups={groupLetters}
        selected={selected}
        onSelect={handleSelect}
      />

      {!anyPlayed && !selected && (
        <p className="rounded-w3-card border border-w3-border bg-w3-surface p-4 text-sm text-w3-text-secondary">
          Todavía no se jugaron partidos. Las posiciones se van a ir actualizando
          a medida que carguen los resultados.
        </p>
      )}

      {groups.length === 0 ? (
        <p className="rounded-w3-card border border-w3-border bg-w3-surface p-6 text-center text-w3-text-secondary">
          Todavía no hay grupos cargados. Sincronizá desde el panel de Admin.
        </p>
      ) : selected === THIRDS_KEY ? (
        <ThirdPlaceTable ranking={thirdPlace} />
      ) : selectedGroup ? (
        <div className="flex flex-col gap-5 lg:flex-row">
          <div className="w-full shrink-0 lg:w-[440px]">
            <GroupStandingsTable
              standings={selectedGroup.standings}
              simulated={simulatedRows ?? undefined}
              simulating={simulating}
              onSimulate={() => setSimulating(true)}
              onResetSim={() => setSimulating(false)}
              canSimulate={hasPredictionsForSim}
            />
          </div>
          <div className="min-w-0 flex-1">
            <GroupMatchList matches={groupMatches} />
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {groups.map((g) => (
            <button
              key={g.group}
              type="button"
              onClick={() => handleSelect(g.group)}
              className="group block h-full cursor-pointer text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-w3-primary focus-visible:ring-offset-2 focus-visible:ring-offset-w3-page-bg"
            >
              <GroupStandingsOverviewCard
                group={g.group}
                standings={g.standings}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
