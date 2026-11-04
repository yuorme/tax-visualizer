import type { Federal, Province } from "../data/schema.ts";
import type { Person } from "./types.ts";

/** Schedule F lines 10–36 for the supported income types: remove employment and dividend gross-ups from
 *  total income. Net rental income is already after expenses; capital losses cannot offset other income.
 *  Untyped other deductions cannot identify Schedule F's allowed claims. RRSP/FHSA and federal childcare
 *  claims are not on its deduction list. See docs/verification/91-qc-health-fund.md for every form line.
 *  Schedule F 43/43.1 use Schedule R 26 and U 101 + 103 + 115, not the employment deductions
 *  at U 23/113/123. In particular, payrollOf(...).enh must not reduce this base.
 *  #14 can add net business income here and pass its specifically allowed Schedule R/U deductions below. */
export function healthServicesIncome(fed: Federal, x: Person): number {
  return (x.oth ?? 0) + Math.max(0, x.cg) * fed.investment.capitalGainsInclusion + x.ed + x.nd + x.fd;
}

/** Per-person Schedule F, separate from income tax. `deductions` means only the enumerated lines 41–62,
 *  never all net-income deductions. The caller must classify new income/exclusions before passing it here. */
export function healthServicesFund(p: Province, income: number, deductions = 0) {
  const rule = p.healthServicesFund;
  if (!rule) return { income: 0, contribution: 0 };
  const q = rule.params;
  const base = Math.max(0, income - deductions);
  const contribution =
    base <= q.upperThreshold
      ? Math.min(q.firstCap, q.rate * Math.max(0, base - q.threshold))
      : Math.min(q.max, q.firstCap + q.rate * (base - q.upperThreshold));
  return { income: base, contribution };
}
