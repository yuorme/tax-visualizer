// Independent worksheet for the credits modelled by #92. No engine functions or runtime YAML are used.
// 2025: cached {sk,ns,nu,nb,nl,pe}-428-2025, SK/NU(S2), federal-t1-2025 and T2036-2025.
// 2026: separately typed annual parameters from data/years/2026; claimant rules provisionally follow 2025.
// This is not a full return: seniors, PE's unmodelled young-child amount and childcare are outside this audit.
import assert from "node:assert/strict";
import type { Household, Person } from "../src/engine/types.ts";

export type AuditedProvince = "SK" | "NS" | "NU" | "NB" | "NL" | "PE";
type Bands = [number, number][]; // lower bound and rate, as in the form's columns
interface Form {
  bands: Bands;
  basic: number;
  spouse: number;
  disregard: number;
  dividends: [number, number];
  child: number;
}

const forms: Record<number, Record<AuditedProvince, Form>> = {
  2025: {
    SK: {
      bands: [
        [0, 0.105],
        [53463, 0.125],
        [152750, 0.145],
      ],
      basic: 19491,
      spouse: 19491,
      disregard: 1949,
      dividends: [0.11, 0.02519],
      child: 7704,
    },
    NS: {
      bands: [
        [0, 0.0879],
        [30507, 0.1495],
        [61015, 0.1667],
        [95883, 0.175],
        [154650, 0.21],
      ],
      basic: 11744,
      spouse: 11744,
      disregard: 874,
      dividends: [0.0885, 0.015],
      child: 1200,
    },
    NU: {
      bands: [
        [0, 0.04],
        [54707, 0.07],
        [109413, 0.09],
        [177881, 0.115],
      ],
      basic: 19274,
      spouse: 19274,
      disregard: 0,
      dividends: [0.0551, 0.0261],
      child: 1200,
    },
    NB: {
      bands: [
        [0, 0.094],
        [51306, 0.14],
        [102614, 0.16],
        [190060, 0.195],
      ],
      basic: 13396,
      spouse: 10499,
      disregard: 1051,
      dividends: [0.14, 0.0275],
      child: 0,
    },
    NL: {
      bands: [
        [0, 0.087],
        [44192, 0.145],
        [88382, 0.158],
        [157792, 0.178],
        [220910, 0.198],
        [282214, 0.208],
        [564429, 0.213],
        [1128858, 0.218],
      ],
      basic: 11067,
      spouse: 9043,
      disregard: 905,
      dividends: [0.063, 0.032],
      child: 0,
    },
    PE: {
      bands: [
        [0, 0.095],
        [33328, 0.1347],
        [64656, 0.166],
        [105000, 0.1762],
        [140000, 0.19],
      ],
      basic: 14650,
      spouse: 12443,
      disregard: 1244,
      dividends: [0.105, 0.013],
      child: 0,
    },
  },
  2026: {
    SK: {
      bands: [
        [0, 0.105],
        [54532, 0.125],
        [155805, 0.145],
      ],
      basic: 20381,
      spouse: 20381,
      disregard: 2038,
      dividends: [0.11, 0.02519],
      child: 8358,
    },
    NS: {
      bands: [
        [0, 0.0879],
        [30995, 0.1495],
        [61991, 0.1667],
        [97417, 0.175],
        [157124, 0.21],
      ],
      basic: 11932,
      spouse: 11932,
      disregard: 888,
      dividends: [0.0885, 0.015],
      child: 1200,
    },
    NU: {
      bands: [
        [0, 0.04],
        [55801, 0.07],
        [111602, 0.09],
        [181439, 0.115],
      ],
      basic: 19659,
      spouse: 19659,
      disregard: 0,
      dividends: [0.0551, 0.0261],
      child: 1200,
    },
    NB: {
      bands: [
        [0, 0.094],
        [52333, 0.14],
        [104666, 0.16],
        [193861, 0.195],
      ],
      basic: 13664,
      spouse: 10709,
      disregard: 1072,
      dividends: [0.14, 0.0275],
      child: 0,
    },
    NL: {
      bands: [
        [0, 0.087],
        [44678, 0.145],
        [89354, 0.158],
        [159528, 0.178],
        [223340, 0.198],
        [285319, 0.208],
        [570638, 0.213],
        [1141275, 0.218],
      ],
      basic: 13094,
      spouse: 9142,
      disregard: 915,
      dividends: [0.063, 0.032],
      child: 0,
    },
    PE: {
      bands: [
        [0, 0.095],
        [33928, 0.1347],
        [65820, 0.166],
        [106890, 0.1762],
        [142520, 0.19],
        [200000, 0.2],
      ],
      basic: 15000,
      spouse: 12740,
      disregard: 1274,
      dividends: [0.105, 0.013],
      child: 0,
    },
  },
};

const federal: Record<
  number,
  {
    bands: Bands;
    basic: [number, number, number, number];
    employment: number;
    ympe: number;
    yampe: number;
    eiMaximum: number;
    eiRate: number;
  }
> = {
  2025: {
    bands: [
      [0, 0.145],
      [57375, 0.205],
      [114750, 0.26],
      [177882, 0.29],
      [253414, 0.33],
    ],
    basic: [16129, 14538, 177882, 253414],
    employment: 1471,
    ympe: 71300,
    yampe: 81200,
    eiMaximum: 65700,
    eiRate: 0.0164,
  },
  2026: {
    bands: [
      [0, 0.14],
      [58523, 0.205],
      [117045, 0.26],
      [181440, 0.29],
      [258482, 0.33],
    ],
    basic: [16452, 14829, 181440, 258482],
    employment: 1501,
    ympe: 74600,
    yampe: 85000,
    eiMaximum: 68900,
    eiRate: 0.0163,
  },
};

const positive = (n: number) => Math.max(n, 0);
const total = (ns: number[]) => ns.reduce((a, b) => a + b, 0);
// Sum marginal rate increments at each lower bound; no use of the engine's bracket walker.
const bracketTax = (bands: Bands, income: number) =>
  total(bands.map(([from, rate], i) => positive(income - from) * (rate - (bands[i - 1]?.[1] ?? 0))));

function reduction(year: number, code: AuditedProvince, net: number, family: boolean, children: number) {
  switch (code) {
    case "NB":
      return positive(
        (year === 2025 ? 802 : 818) * (family ? 2 : 1) - 0.03 * positive(net - (year === 2025 ? 21920 : 22358)),
      );
    case "NL": {
      const [basic, spouse, singleThreshold, familyThreshold] =
        year === 2025 ? [997, 557, 23928, 40460] : [842, 563, 24191, 40905];
      return positive(
        basic + (family ? spouse : 0) - 0.16 * positive(net - (family ? familyThreshold : singleThreshold)),
      );
    }
    case "NS":
      return positive(300 + (family ? 300 : 0) + 165 * children - 0.05 * positive(net - 15000));
    case "PE":
      return positive(
        350 + (family ? 350 : 0) + 300 * children - 0.05 * positive(net - (year === 2025 ? 22650 : 23000)),
      );
    default:
      return 0;
  }
}

// T2036 lines 3–5; note 4 supplies the tax at the province's own FTC line.
function foreignCredit(tax: number, foreign: number, net: number, remainingWithholding: number) {
  return Math.min(tax, remainingWithholding, net > 0 ? (tax * foreign) / net : 0);
}

/** All legal minimum-tax elections, retaining individual return lines so a correct total cannot hide an error. */
export function formReturns(year: number, code: AuditedProvince, hh: Household) {
  assert.ok(!hh.childcare, "this claimant worksheet does not model childcare deductions");
  const f = federal[year],
    p = forms[year][code],
    rate = p.bands[0][1],
    fr = f.bands[0][1];
  const people = [...hh.people];
  if (people.length === 1 && hh.adults >= 2) people.push({ ord: 0, cg: 0, ed: 0, nd: 0, fd: 0, ded: 0 });
  const couple = hh.spouse && people.length === 2;
  const single = people.length === 1 && hh.adults === 1;
  const family = couple || (single && hh.kids > 0);
  const bases = people.map((x: Person) => {
    const earnings = positive(x.ord);
    const pensionable = positive(Math.min(earnings, f.ympe) - 3500);
    const cpp = pensionable * 0.0495;
    const enhanced = pensionable * 0.01 + positive(Math.min(earnings, f.yampe) - f.ympe) * 0.04;
    const ei = Math.min(earnings, f.eiMaximum) * f.eiRate;
    const net = positive(
      x.ord +
        (x.oth ?? 0) +
        positive(x.cg) / 2 +
        x.ed * 1.38 +
        x.nd * 1.15 +
        x.fd -
        x.ded -
        (x.rrsp ?? 0) -
        (x.fhsa ?? 0) -
        enhanced,
    );
    const [max, min, from, to] = f.basic;
    const federalBasic = hh.useBpa ? max - (max - min) * Math.min(1, positive(net - from) / (to - from)) : 0;
    return { net, cpp, ei, federalBasic };
  });
  const supporter = bases.length === 2 && bases[1].net > bases[0].net ? 1 : 0;
  const baseReturns = bases.map((b, i) => {
    const x = people[i];
    const dependentNet = couple ? bases[1 - i].net : 0;
    const supports = hh.useBpa && ((couple && i === supporter) || (single && hh.kids > 0));
    const spouseBase = supports ? positive(p.spouse + p.disregard - Math.max(p.disregard, dependentNet)) : 0;
    const federalSpouse = supports ? positive(b.federalBasic - dependentNet) : 0;
    const federalTax = positive(
      bracketTax(f.bands, b.net) -
        (b.federalBasic + federalSpouse + b.cpp + b.ei + Math.min(positive(x.ord), f.employment)) * fr -
        x.ed * 1.38 * 0.150198 -
        x.nd * 1.15 * 0.090301,
    );
    const fFtc = foreignCredit(federalTax, x.fd, b.net, x.fd * hh.whRate);
    const pBpaFull = (hh.useBpa ? p.basic : 0) * rate;
    const pEmpFull = (b.cpp + b.ei) * rate;
    const bracket = bracketTax(p.bands, b.net);
    return { ti: b.net, pBpaFull, pEmpFull, pSpFull: spouseBase * rate, fFtc, bracket };
  });
  const childOwners =
    !couple || p.child === 0
      ? [supporter]
      : Math.abs(bases[0].net - bases[1].net) < 1e-9
        ? [0, 1]
        : [bases[0].net < bases[1].net ? 0 : 1];
  const candidates = childOwners.flatMap(owner => {
    const childBase = p.child * (code === "SK" ? hh.kids : hh.under6);
    const unusedChild =
      couple && (code === "SK" || code === "NU")
        ? positive(
            childBase -
              positive((baseReturns[owner].bracket - baseReturns[owner].pBpaFull - baseReturns[owner].pEmpFull) / rate),
          )
        : 0;
    const beforeReduction = baseReturns.map((b, i) => {
      const kidAmt = i === owner ? childBase : 0;
      const transferBase = i === 1 - owner ? unusedChild : 0;
      const ordinaryTax = positive(b.bracket - b.pBpaFull - b.pSpFull - b.pEmpFull);
      const pKid = Math.min(ordinaryTax, (kidAmt + transferBase) * rate);
      const childTransferApplied = Math.min(positive(ordinaryTax - kidAmt * rate), transferBase * rate);
      const x = people[i];
      const tax = positive(ordinaryTax - pKid - x.ed * 1.38 * p.dividends[0] - x.nd * 1.15 * p.dividends[1]);
      return { ...b, kidAmt, pKid, transferBase, childTransferApplied, tax };
    });
    const claimants = couple && ["NB", "NL", "NS", "PE"].includes(code) ? [0, 1] : [supporter];
    return claimants.map(claimant => {
      const returns = beforeReduction.map(b => ({ ...b, lowFull: 0, lowRed: 0, unused: 0, pFtc: 0, prov: b.tax }));
      const credit = (i: number, tax: number) =>
        foreignCredit(tax, people[i].fd, bases[i].net, people[i].fd * hh.whRate - baseReturns[i].fFtc);
      // NB line 66 / NL line 73 / NS line 63; SK and NU also claim FTC after ordinary credits.
      if (code !== "PE")
        returns.forEach((r, i) => {
          r.pFtc = credit(i, r.tax);
          r.prov = r.tax - r.pFtc;
        });
      returns.forEach((r, i) => {
        if (!couple || i === claimant) {
          const kids = i === claimant ? hh.kids - (single && hh.kids > 0 ? 1 : 0) : 0;
          r.lowFull = reduction(year, code, couple ? total(bases.map(b => b.net)) : r.ti, family, kids);
          r.lowRed = Math.min(r.prov, r.lowFull);
          r.unused = positive(r.lowFull - r.prov);
          r.prov = positive(r.prov - r.lowFull);
        }
      });
      // NB90 = 86 - 67; NL108 = 104 - 85; PE101 = 87 - 65 (BEFORE PE's FTC).
      if (couple && ["NB", "NL", "PE"].includes(code)) {
        const recipient = returns[1 - claimant];
        recipient.lowFull = returns[claimant].unused;
        recipient.lowRed = Math.min(recipient.prov, recipient.lowFull);
        recipient.unused = positive(recipient.lowFull - recipient.prov);
        recipient.prov = positive(recipient.prov - recipient.lowFull);
      }
      // PE line 89 and T2036 note 4 use line 88, after both own and transferred reductions.
      if (code === "PE")
        returns.forEach((r, i) => {
          r.pFtc = credit(i, r.prov);
          r.prov -= r.pFtc;
        });
      return returns;
    });
  });
  const minimum = Math.min(...candidates.map(rs => total(rs.map(r => r.prov))));
  return candidates.filter(rs => Math.abs(total(rs.map(r => r.prov)) - minimum) < 1e-7);
}
