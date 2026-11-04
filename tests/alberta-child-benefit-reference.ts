// Independent arithmetic; no engine or YAML imports. Evidence: verification/106-alberta-child-benefit.md.
// ACFB amounts: Alberta's published 2025–26/2026–27 table. Rates/minimum: Income Tax Act s.30.2.
export type AlbertaYear = 2025 | 2026;
export const published = {
  2025: { base: [1499, 2248, 2997, 3746], work: [767, 1465, 1883, 2021], baseStart: 27565, workStart: 46191 },
  2026: { base: [1529, 2293, 3057, 3821], work: [782, 1494, 1920, 2061], baseStart: 28116, workStart: 47115 },
};

export function albertaAnnual(year: AlbertaYear, net: number, earned: number, kids: number, inherited = false) {
  if (kids === 0) return 0;
  const p = published[year],
    i = Math.min(kids, 4) - 1;
  // Basis points keep the statute's exact decimal schedules separate from the production representation.
  const basePoints = (inherited ? [800, 1200, 1600, 2000] : [805, 1207, 1609, 2011])[i];
  const workPoints = inherited ? 1500 : [340, 649, 834, 895][i];
  const baseLoss = (Math.max(0, net - p.baseStart) * basePoints) / 10000;
  const workLoss = (Math.max(0, net - p.workStart) * workPoints) / 10000;
  const earnedAmount = earned <= 2760 ? 0 : ((earned - 2760) * 15) / 100;
  const total = Math.max(0, p.base[i] - baseLoss) + Math.max(0, Math.min(p.work[i], earnedAmount) - workLoss);
  return !inherited && total > 0 && total < 10 ? 10 : total;
}

export interface AlbertaPerson {
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

// T1 income inclusion and CPP F5 deduction, independently evaluated for the locked scenario universe.
// Same published federal constants used in the NWT audit; see verification/116-nwt-child-benefit.md.
export function albertaIncome(year: AlbertaYear, people: AlbertaPerson[], spouse: boolean) {
  const [ympe, yampe] = year === 2025 ? [71300, 81200] : [74600, 85000];
  let net = 0,
    earned = 0;
  for (const p of people.slice(0, spouse ? 2 : 1)) {
    const employment = p.ord ?? 0;
    earned += employment;
    const enhanced =
      Math.max(0, Math.min(employment, ympe) - 3500) / 100 + Math.max(0, Math.min(employment, yampe) - ympe) / 25;
    net += Math.max(
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
    );
  }
  return { net, earned };
}
