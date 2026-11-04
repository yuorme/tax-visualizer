import type { Federal, Province } from "../data/schema.ts";
import type { RetirementPayroll } from "./payroll.ts";
import type { Person } from "./types.ts";

export class UnsupportedSelfEmploymentError extends Error {
  readonly year: number;

  constructor(year: number) {
    super(`Self-employment income is not supported by the ${year} data`);
    this.name = "UnsupportedSelfEmploymentError";
    this.year = year;
  }
}

const monthsInYear = 12;

/** Explicit zero activates year validation; omission preserves the historical input contract. */
export function validateSelfEmployment(fed: Federal, x: Person) {
  if (x.selfEmployment === undefined) return null;
  const rule = fed.payroll.selfEmployment;
  if (!rule) throw new UnsupportedSelfEmploymentError(fed.year);
  if (typeof x.selfEmployment !== "number" || !Number.isFinite(x.selfEmployment) || x.selfEmployment < 0)
    throw new RangeError("Self-employment requires finite nonnegative annual net business profit");
  return rule.params;
}

/** S8 Parts 4–5 and Quebec U Part C, for ordinary net business profit earned wholly in the compared province.
 *  Annual required employee contributions are supplied, not withholding. No slip underpayment, CPT20 earnings,
 *  losses, disability/death or interprovincial transfers. Self-employment-only optional elections need a future
 *  effective-month contract; employee form-delivery dates must not silently stand in for those elections. */
export function selfEmploymentContributions(
  fed: Federal,
  p: Province | null,
  x: Person,
  employee: { base: number; enh: number; retirement?: RetirementPayroll },
) {
  const q = validateSelfEmployment(fed, x);
  const profit = x.selfEmployment;
  if (!q || profit === undefined) return null;
  const qc = p?.system === "quebec";
  const plan = qc ? fed.payroll.qpp : fed.payroll.cpp;
  if (x.age !== undefined && (!Number.isSafeInteger(x.age) || x.age <= q.contributionStartAge))
    throw new RangeError("Self-employment payroll requires a whole age past the contribution-entry year");
  if (
    x.age !== undefined &&
    (x.birthMonth === undefined || !Number.isInteger(x.birthMonth) || x.birthMonth < 1 || x.birthMonth > monthsInYear)
  )
    throw new RangeError("Self-employment payroll requires birthMonth from 1 to 12");
  const birthMonth = x.birthMonth ?? monthsInYear;
  if (!qc && profit > 0 && x.ord === 0 && x.employeePayroll?.cppElection)
    throw new RangeError(
      "Self-employed-only CPP elections require effective months; employee elections are unsupported",
    );
  const ownMonths = Array.from({ length: monthsInYear }, (_, i) => i + 1).filter(month => {
    const age = x.age;
    return (
      age === undefined ||
      (qc ? age <= q.qppStopAge : age < q.cppStopAge || (age === q.cppStopAge && month <= birthMonth))
    );
  });
  // Verified independently: S8 Part 1 applies mixed earners' CPT30 to both sources. Parts 4/5 prorate
  // annual business profit by months, never employee earnings weights. U Part A.2 requires a separate QPP
  // business election; an RR-50 employee stop does not stop business contributions. U retains annual ceilings.
  const mixedCpp = !qc && x.ord > 0 && employee.retirement;
  const months = mixedCpp ? mixedCpp.contributoryMonths : ownMonths;
  const fraction = months.length / monthsInYear;
  const pensionableEarnings = profit * fraction;
  const employeeEarnings = employee.retirement?.pensionableEarnings ?? Math.max(0, x.ord);
  const ceilingFraction = qc ? 1 : fraction;
  const exemption = plan.exempt * ceilingFraction;
  const ympe = plan.ympe * ceilingFraction;
  const yampe = plan.yampe * ceilingFraction;
  const firstEmployee = employee.base / plan.base;
  const first = Math.max(0, Math.min(employeeEarnings + pensionableEarnings, ympe) - exemption - firstEmployee);
  const employeeSecond = Math.max(0, Math.min(employeeEarnings, yampe) - ympe);
  const second = Math.max(0, Math.min(employeeEarnings + pensionableEarnings, yampe) - ympe - employeeSecond);
  const base = first * plan.base * q.contributionShares;
  const enhanced = (first * plan.enh1 + second * plan.enh2) * q.contributionShares;
  const baseCredit = base * q.baseCreditShare;
  const employerBaseDeduction = base - baseCredit;
  const qpipEarnings =
    qc && x.ord + profit >= q.qpip.minimumIncome
      ? Math.min(profit, Math.max(0, fed.payroll.qpip.maxInsurable - Math.max(0, x.ord)))
      : 0;
  const qpip = qpipEarnings * q.qpip.rate;
  const qpipDeduction = qpip * q.qpip.deductionShare;
  // R's $2,000 test covers combined income. With positive business profit below that threshold,
  // employee QPIP withholding is refunded too (TP-1 guide line 97). Preserve the legacy zero-profit path.
  const employeeQpipRefund =
    qc && profit > 0 && x.ord + profit < q.qpip.minimumIncome ? Math.max(0, x.ord) * fed.payroll.qpip.rate : 0;
  return {
    base,
    enhanced,
    baseCredit,
    employerBaseDeduction,
    qpip,
    qpipDeduction,
    employeeQpipRefund,
    qpipCredit: qpip - qpipDeduction,
    pensionDeduction: employerBaseDeduction + enhanced,
    healthServicesDeduction: employerBaseDeduction + enhanced + qpipDeduction,
    contributoryMonths: months,
    pensionableEarnings,
  };
}
