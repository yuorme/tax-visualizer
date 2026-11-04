// Independent MB428 / MB428-A worksheet. Imports only input TYPES, never engine functions or YAML.
// MB constants: cached Act s. 4.6(16.1)–(16.2), 2025 MB428/MB428-A/guide; 2026 TD1MB(-WS) and T4127.
// Federal 2025 T1 / 2026 T4127; T2036 lines 3–5 for FTC. See verification/145-manitoba-family-benefit.md.
import assert from "node:assert/strict";
import type { Household, Person } from "../src/engine/types.ts";

const pos = (n: number) => Math.max(0, n);
const sum = (ns: number[]) => ns.reduce((a, b) => a + b, 0);
const federal = {
  2025: {
    thresholds: [57375, 114750, 177882, 253414],
    first: 0.145,
    bpa: [16129, 14538],
    employment: 1471,
    ympe: 71300,
    yampe: 81200,
    eiMax: 65700,
    eiRate: 0.0164,
  },
  2026: {
    thresholds: [58523, 117045, 181440, 258482],
    first: 0.14,
    bpa: [16452, 14829],
    employment: 1501,
    ympe: 74600,
    yampe: 85000,
    eiMax: 68900,
    eiRate: 0.0163,
  },
};

export type ManitobaYear = keyof typeof federal;

/** Childcare deductions are supplied by the specimen, independently of the production childcare calculator. */
export function mbForms(
  year: ManitobaYear,
  hh: Household,
  options: {
    omitted?: boolean;
    childcareClaims?: number[];
    wrongOrder?: boolean;
    lowerClaimant?: boolean;
    childClaimant?: number;
  } = {},
) {
  const f = federal[year];
  const people: Person[] = [...hh.people];
  if (people.length === 1 && hh.adults >= 2) people.push({ ord: 0, oth: 0, cg: 0, ed: 0, nd: 0, fd: 0, ded: 0 });
  assert.ok(!hh.childcare || options.childcareClaims, "supply independently checked childcare claims");
  const bases = people.map((x, i) => {
    const earnings = pos(x.ord);
    const pensionable = pos(Math.min(earnings, f.ympe) - 3500);
    const cpp = pensionable * 0.0495;
    const enhanced = pensionable * 0.01 + pos(Math.min(earnings, f.yampe) - f.ympe) * 0.04;
    const ei = Math.min(earnings, f.eiMax) * f.eiRate;
    const net = pos(
      x.ord +
        (x.oth ?? 0) +
        pos(x.cg) / 2 +
        1.38 * x.ed +
        1.15 * x.nd +
        x.fd -
        x.ded -
        (x.rrsp ?? 0) -
        (x.fhsa ?? 0) -
        enhanced -
        (options.childcareClaims?.[i] ?? 0),
    );
    return { net, cpp, ei };
  });
  const couple = people.length === 2 && hh.spouse;
  const single = people.length === 1 && hh.adults === 1;
  const ages = hh.childcare?.children?.map(c => c.age);
  const minors = ages ? ages.filter(a => a < 18).length : hh.kids;
  // Year-end 18 represents eligibility earlier in the year, per MB428-A's birth-year band; age alone
  // is not statutory entitlement. Ordinary eligible-parent assumptions are recorded in the verification doc.
  const familyAges = hh.childAges ?? ages;
  const eligibleChildren = familyAges ? familyAges.filter(a => a <= 18).length : hh.kids;
  const supporter = bases.length === 2 && bases[1].net > bases[0].net ? 1 : 0;
  const tied = people.length === 2 && Math.abs(bases[0].net - bases[1].net) < 1e-9;
  const owners =
    options.childClaimant !== undefined
      ? [options.childClaimant]
      : options.lowerClaimant && couple
        ? [1 - supporter]
        : tied
          ? [0, 1]
          : [supporter];
  const returns = owners.map(childOwner =>
    bases.map(({ net, cpp, ei }, i) => {
      const x = people[i];
      const supports = hh.useBpa && ((couple && i === supporter) || (single && minors > 0));
      const dependentNet = couple ? bases[1 - i].net : 0;
      // MB428 Part A, line 8, independently expressed as marginal rate increments.
      const line8 = net * 0.108 + pos(net - 47000) * 0.0195 + pos(net - 100000) * 0.0465;
      const line9 = hh.useBpa ? 15780 * (1 - Math.min(1, pos(net - 200000) / 200000)) : 0;
      const dependent = supports ? pos(9134 - dependentNet) : 0; // line 13 or 16, never both
      const line28 = cpp + ei;
      // MB428-A lines 1–3, 9, 10–12. No senior or disability claims in these specimens.
      const childCount = i === childOwner ? Math.max(0, eligibleChildren - (single && dependent > 0 ? 1 : 0)) : 0;
      const line10A = 2065 + (dependent > 0 ? 2065 : 0) + childCount * 2752;
      const line12A = hh.useBpa && !options.omitted ? pos(line10A - 0.09 * net) : 0;
      const line57 = (line9 + dependent + line28 + line12A) * 0.108;
      const line62 = x.ed * 1.38 * 0.08 + x.nd * 1.15 * 0.007835;
      const line65 = pos(line8 - line57 - line62);
      // All remaining supported Part C items before line 73 are zero; no MB low-income reduction exists here.
      const fedBpa = hh.useBpa
        ? f.bpa[0] -
          (f.bpa[0] - f.bpa[1]) * Math.min(1, pos(net - f.thresholds[2]) / (f.thresholds[3] - f.thresholds[2]))
        : 0;
      const fedSpouse = supports ? pos(fedBpa - dependentNet) : 0;
      const rates = [f.first, 0.205, 0.26, 0.29, 0.33];
      const fedBracket =
        net * f.first + sum(f.thresholds.map((from, j) => pos(net - from) * (rates[j + 1] - rates[j])));
      const federalBasicTax = pos(
        fedBracket -
          (fedBpa + fedSpouse + cpp + ei + Math.min(pos(x.ord), f.employment)) * f.first -
          x.ed * 1.38 * 0.150198 -
          x.nd * 1.15 * 0.090301,
      );
      const share = net > 0 ? x.fd / net : 0;
      const withholding = x.fd * hh.whRate;
      const fFtc = Math.min(withholding, federalBasicTax, federalBasicTax * share);
      const beforeFamily = pos(line8 - (line9 + dependent + line28) * 0.108);
      const familyApplied = Math.min(beforeFamily, line12A * 0.108);
      const pDtc = Math.min(pos(beforeFamily - familyApplied), line62);
      const wrongBeforeFtc = pos(beforeFamily - line62);
      const ftcBase = options.wrongOrder ? wrongBeforeFtc : line65;
      const line73 = Math.min(withholding - fFtc, ftcBase * share, ftcBase);
      const line82 = options.wrongOrder ? pos(wrongBeforeFtc - line73 - line12A * 0.108) : line65 - line73;
      return { net, childCount, line12A, familyApplied, line8, line57, pDtc, pFtc: line73, fFtc, prov: line82 };
    }),
  );
  // Interpretation on spousal ties: compare the completed returns, after dividends and FTC.
  // Federal tax is independent of this election, so comparing provincial totals suffices in this worksheet.
  return returns.reduce((a, b) => (sum(b.map(r => r.prov)) < sum(a.map(r => r.prov)) - 1e-9 ? b : a));
}
