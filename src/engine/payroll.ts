import type { Federal, Province } from "../data/schema.ts";
import type { Person } from "./types.ts";

export interface Payroll {
  base: number;
  enh: number;
  ei: number;
  qpip: number;
  terr: number;
}

/** Employee CPP/QPP (base and enhanced), EI, QPIP and territorial payroll tax on employment income. Other income
 *  (x.oth) pays none of them: CPP/QPP, EI and QPIP are charged on employment earnings, and the NWT and Nunavut
 *  payroll tax on employment remuneration. */
export function payrollOf(fed: Federal, p: Province | null, x: Person): Payroll {
  const qc = p?.system === "quebec";
  const e = Math.max(0, x.ord),
    plan = qc ? fed.payroll.qpp : fed.payroll.cpp;
  const pens = e > plan.exempt ? Math.min(e, plan.ympe) - plan.exempt : 0;
  const base = pens * plan.base;
  const enh = pens * plan.enh1 + Math.max(0, Math.min(e, plan.yampe) - plan.ympe) * plan.enh2;
  const ei = Math.min(e, fed.payroll.ei.maxInsurable) * (qc ? fed.payroll.ei.quebecRate : fed.payroll.ei.rate);
  const qpip = qc ? Math.min(e, fed.payroll.qpip.maxInsurable) * fed.payroll.qpip.rate : 0;
  const terr = e * (p?.payroll?.employeeTax || 0);
  return { base, enh, ei, qpip, terr };
}

/** Provincial health premium (Ontario): bands are listed highest first as [above, base, rate, cap]. */
export function healthPremium(p: Province, ti: number): number {
  for (const [from, base, rate, cap] of p.payroll?.healthPremium ?? [])
    if (ti > from) return Math.min(cap, base + (ti - from) * rate);
  return 0;
}

/** The pieces of net income: each kind of income as it's counted (the taxable share of net capital gains,
 *  dividends grossed up), and the deductions taken off. */
export interface NetIncomeParts {
  ord: number; // employment income
  oth: number; // interest, rental and other income, counted in full
  cg: number; // taxable capital gains; a net loss counts as 0
  ed: number; // grossed-up eligible dividends
  nd: number; // grossed-up non-eligible dividends
  fd: number;
  ded: number;
  enh: number; // enhanced CPP/QPP contributions
}

/** Net income before it's floored at zero, piece by piece (the enhanced rates are the same in both plans). A net
 *  capital loss adds nothing and can't offset other income. */
export function netIncomeParts(fed: Federal, x: Person): NetIncomeParts {
  const inv = fed.investment;
  return {
    ord: x.ord,
    oth: x.oth,
    cg: Math.max(0, x.cg) * inv.capitalGainsInclusion,
    ed: x.ed * inv.grossUp.eligible,
    nd: x.nd * inv.grossUp.nonEligible,
    fd: x.fd,
    ded: x.ded || 0,
    enh: payrollOf(fed, null, x).enh,
  };
}

/** Net income: total income less deductions and enhanced CPP/QPP contributions. */
export function netOf(fed: Federal, x: Person): number {
  const n = netIncomeParts(fed, x);
  return Math.max(0, n.ord + n.oth + n.cg + n.ed + n.nd + n.fd - n.ded - n.enh);
}

/** RRSP deduction room: a share of earned income up to the year's dollar limit, to the nearest dollar. Current
 *  employment income stands in for last year's earned income. Other income is left out: interest, pensions and
 *  RRSP or RRIF withdrawals aren't earned income (net rental income is, but it isn't entered separately). */
export function rrspRoom(fed: Federal, x: Person): number {
  return Math.min(fed.rrsp.limit, Math.round(x.ord * fed.rrsp.rate));
}
