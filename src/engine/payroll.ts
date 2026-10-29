import type { Federal, Province } from "../data/schema.ts";
import type { Person } from "./types.ts";

export interface Payroll { base: number; enh: number; ei: number; qpip: number; terr: number }

/** Employee CPP/QPP (base and enhanced), EI, QPIP and territorial payroll tax on employment income. */
export function payrollOf(fed: Federal, p: Province | null, x: Person): Payroll {
  const qc = p?.system === "quebec";
  const e = Math.max(0, x.ord), plan = qc ? fed.payroll.qpp : fed.payroll.cpp;
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
  for (const [from, base, rate, cap] of p.payroll?.healthPremium ?? []) if (ti > from) return Math.min(cap, base + (ti - from) * rate);
  return 0;
}

/** Net income: total income less deductions and enhanced CPP/QPP contributions (the enhanced rates are the same in
 *  both plans). A net capital loss adds nothing and can't offset other income. */
export function netOf(fed: Federal, x: Person): number {
  const inv = fed.investment;
  return Math.max(0, x.ord + Math.max(0, x.cg) * inv.capitalGainsInclusion + x.ed * inv.grossUp.eligible
    + x.nd * inv.grossUp.nonEligible + x.fd - (x.ded || 0) - payrollOf(fed, null, x).enh);
}
