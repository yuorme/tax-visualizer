// Independent arithmetic: no engine or YAML imports.
// NWT Finance fact sheet p. 2 (2024/sources/federal-nwt-benefit.txt); continuity in T4114-25 and T4114-26.
// Net-income constants: T1 taxable gains/dividend gross-ups; CPP limits in 2025/sources/seniors-oas-q4.txt
// and 138-senior-credit-rules/sources/t4127-2026.txt (F5). See verification/116-nwt-child-benefit.md.
export interface NwtPerson {
  ord?: number;
  oth?: number;
  cg?: number;
  ed?: number;
  nd?: number;
  fd?: number;
  ded?: number;
  rrsp?: number;
  fhsa?: number;
}

export function nwtFamilyNet(year: 2025 | 2026, people: NwtPerson[], spouse: boolean): number {
  const [ympe, yampe] = year === 2025 ? [71300, 81200] : [74600, 85000];
  return people.slice(0, spouse ? 2 : 1).reduce((sum, p) => {
    const employment = p.ord ?? 0;
    const enhanced =
      Math.max(0, Math.min(employment, ympe) - 3500) / 100 + Math.max(0, Math.min(employment, yampe) - ympe) / 25;
    return (
      sum +
      Math.max(
        0,
        employment +
          (p.oth ?? 0) +
          Math.max(0, p.cg ?? 0) / 2 +
          (p.ed ?? 0) * 1.38 +
          (p.nd ?? 0) * 1.15 +
          (p.fd ?? 0) -
          (p.ded ?? 0) -
          (p.rrsp ?? 0) -
          (p.fhsa ?? 0) -
          enhanced,
      )
    );
  }, 0);
}

export function nwtAnnual(net: number, kids: number, under6: number): number {
  // Marginal additions sum to the published cumulative table. Each age group restarts at its first child.
  const group = (count: number, additions: number[]) =>
    Array.from({ length: count }, (_, i) => additions[Math.min(i, 4)]).reduce((a, b) => a + b, 0);
  const maximum = group(under6, [815, 652, 530, 448, 367]) + group(kids - under6, [652, 522, 423, 359, 293]);
  if (net <= 30000) return maximum;
  if (net >= 80000) return 0;
  return maximum - ((net - 30000) * maximum) / 50000;
}

// Negative control and migration audit only: the inherited, incorrect interpretation of rounded CRA amounts.
export function nwtInherited(net: number, kids: number, under6: number, exactAnnual = false): number {
  if (!kids) return 0;
  const n = Math.min(kids, 4),
    extra = Math.max(0, kids - 4);
  const young = exactAnnual
    ? [0, 815, 1467, 1997, 2445][n] + extra * 367
    : [0, 814.92, 1467, 1996.92, 2445][n] + extra * 366.96;
  const older = exactAnnual
    ? [0, 652, 1174, 1597, 1956][n] + extra * 293
    : [0, 651.96, 1173.96, 1596.96, 1956][n] + extra * 292.92;
  return (older + ((young - older) * under6) / kids) * Math.max(0, Math.min(1, (80000 - net) / 50000));
}

export const nwtDifference = (net: number, kids: number, under6: number) =>
  nwtAnnual(net, kids, under6) - nwtInherited(net, kids, under6);
