import type { GroupStanding, MatchView, StandingRow } from './types';

type RowAcc = StandingRow & { teamId: string };

function sortStandings(rows: StandingRow[]): StandingRow[] {
  return [...rows].sort(
    (x, y) =>
      y.pts - x.pts ||
      y.gd - x.gd ||
      y.gf - x.gf ||
      x.team.name.localeCompare(y.team.name),
  );
}

function applyResult(
  rows: Map<string, RowAcc>,
  homeId: string,
  awayId: string,
  hs: number,
  as: number,
) {
  const h = rows.get(homeId);
  const a = rows.get(awayId);
  if (!h || !a) return;

  h.mp++;
  a.mp++;
  h.gf += hs;
  h.ga += as;
  a.gf += as;
  a.ga += hs;

  if (hs > as) {
    h.w++;
    h.pts += 3;
    a.l++;
  } else if (hs < as) {
    a.w++;
    a.pts += 3;
    h.l++;
  } else {
    h.d++;
    a.d++;
    h.pts++;
    a.pts++;
  }
}

/** Calcula tabla simulada: resultados reales + predicciones en partidos pendientes. */
export function simulateGroupStandings(
  group: GroupStanding,
  matches: MatchView[],
): StandingRow[] {
  const rows = new Map<string, RowAcc>();
  for (const s of group.standings) {
    rows.set(s.team.id, {
      teamId: s.team.id,
      team: s.team,
      mp: 0,
      w: 0,
      d: 0,
      l: 0,
      gf: 0,
      ga: 0,
      gd: 0,
      pts: 0,
    });
  }

  const groupMatches = matches.filter((m) => m.group === group.group);

  for (const m of groupMatches) {
    if (m.status === 'FINISHED' && m.homeScore != null && m.awayScore != null) {
      applyResult(rows, m.homeTeam.id, m.awayTeam.id, m.homeScore, m.awayScore);
    } else if (
      m.status === 'SCHEDULED' &&
      m.prediction != null
    ) {
      applyResult(
        rows,
        m.homeTeam.id,
        m.awayTeam.id,
        m.prediction.homeScore,
        m.prediction.awayScore,
      );
    }
  }

  const result = [...rows.values()].map(({ teamId: _id, ...row }) => {
    row.gd = row.gf - row.ga;
    return row;
  });

  return sortStandings(result);
}

export interface SimulatedRow extends StandingRow {
  simPos: number;
  realPos: number;
  realPts: number;
  delta: number;
}

/** Combina tabla simulada con posiciones reales para mostrar Δ. */
export function buildSimulatedRows(
  real: GroupStanding,
  simulated: StandingRow[],
): SimulatedRow[] {
  const realSorted = sortStandings(real.standings);
  const realPosMap = new Map(
    realSorted.map((r, i) => [r.team.id, { pos: i + 1, pts: r.pts }]),
  );

  const simSorted = sortStandings(simulated);

  return simSorted.map((row, i) => {
    const realInfo = realPosMap.get(row.team.id) ?? { pos: i + 1, pts: 0 };
    return {
      ...row,
      simPos: i + 1,
      realPos: realInfo.pos,
      realPts: realInfo.pts,
      delta: realInfo.pos - (i + 1),
    };
  });
}
