import type { Federal, Province } from "../data/schema.ts";
import type { EmployeeContributionElection, PayrollMonth, Person } from "./types.ts";

type RetirementRule = NonNullable<Federal["payroll"]["employeeRetirement"]>["cpp" | "qpp"];

export class UnsupportedRetirementPayrollError extends Error {
  readonly year: number;

  constructor(year: number) {
    super(`Retirement-age employee payroll is not supported by the ${year} data`);
    this.name = "UnsupportedRetirementPayrollError";
    this.year = year;
  }
}

export interface RetirementPayroll {
  program: RetirementRule["program"];
  contributoryMonths: number[];
  pensionableEarnings: number;
  election: "none" | "ineligible-stop" | "stopped" | "restarted" | "ineligible-restart";
  withheldBase: number;
  withheldEnhanced: number;
  overpayment: number; // withheld less annual required contributions; excluded from the year's net payroll burden
}

export interface Payroll {
  base: number;
  enh: number;
  ei: number;
  qpip: number;
  terr: number;
}

/** Null identifies the untouched legacy path. UI callers can inspect year data before enabling these inputs. */
export function employeeRetirementPayrollOf(fed: Federal, p: Province | null, x: Person) {
  return x.age !== undefined || x.birthMonth !== undefined || x.employeePayroll !== undefined
    ? retirementContributions(fed, x, p?.system === "quebec", Math.max(0, x.ord))
    : null;
}

const monthsInYear = 12;
const monthIndex = (d: PayrollMonth) => d.year * monthsInYear + d.month - 1;

function validMonth(d: PayrollMonth) {
  if (!d || !Number.isSafeInteger(d.year) || !Number.isInteger(d.month) || d.month < 1 || d.month > monthsInYear)
    throw new RangeError("Employee payroll dates require a calendar year and a month from 1 to 12");
}

/** Stop/restart dates are delivery months, not effective months. Ineligible elections have no legal effect;
 *  an invalid restart leaves a valid stop in force. A prior-year stop is checked at its original delivery date. */
function employeeElection(
  year: number,
  age: number,
  birthMonth: number,
  pensionSince: PayrollMonth | undefined,
  election: EmployeeContributionElection | undefined,
  rule: RetirementRule,
) {
  if (!election) return { status: "none" as const };
  const stop = election.stop;
  const ageAtStop = age - (year - stop.year) - (stop.month < birthMonth ? 1 : 0);
  const params = rule.params;
  const eligibleAge =
    rule.program === "cpp-employee-retirement"
      ? ageAtStop < params.mandatoryStopAge
      : age - (year - stop.year) <= params.mandatoryStopAge;
  if (
    !pensionSince ||
    monthIndex(pensionSince) > monthIndex(stop) ||
    stop.year < (params.electionsFromYear ?? -Infinity) ||
    ageAtStop < params.electionFromAge ||
    !eligibleAge
  )
    return { status: "ineligible-stop" as const };
  const from = monthIndex(stop) + params.electionEffectiveMonthOffset;
  if (!election.restart) return { from, status: "stopped" as const };
  if (election.restart.year - stop.year < params.restartAfterCalendarYears)
    return { from, status: "ineligible-restart" as const };
  return {
    from,
    to: monthIndex(election.restart) + params.electionEffectiveMonthOffset,
    status: "restarted" as const,
  };
}

/** Annual employee liability, after excess deductions are returned. CPP uses Schedule 8's prorated thresholds;
 *  QPP uses Schedule U's full annual exemption and ceilings for optional employee elections. Withholding is
 *  separately estimated from monthly pay-period exemptions and each plan's contribution maximum. */
function retirementContributions(fed: Federal, x: Person, qc: boolean, earnings: number) {
  const rules = fed.payroll.employeeRetirement;
  if (!rules) throw new UnsupportedRetirementPayrollError(fed.year);
  if (!Number.isSafeInteger(x.age) || x.age === undefined || x.age < 0)
    throw new RangeError("Retirement payroll requires a whole, nonnegative year-end age");
  if (!Number.isInteger(x.birthMonth) || x.birthMonth === undefined || x.birthMonth < 1 || x.birthMonth > monthsInYear)
    throw new RangeError("Retirement payroll requires birthMonth from 1 to 12");
  const { age, birthMonth } = x;
  const rule = qc ? rules.qpp : rules.cpp;
  if (x.age <= rule.params.contributionStartAge)
    throw new RangeError("Retirement payroll does not support childhood or the year contributions first start");
  const input = x.employeePayroll;
  if (input?.retirementPensionSince) validMonth(input.retirementPensionSince);
  for (const election of [input?.cppElection, input?.qppElection]) {
    if (!election) continue;
    validMonth(election.stop);
    if (election.restart) validMonth(election.restart);
  }
  const weights = input?.monthlyEarningsWeights ?? Array<number>(monthsInYear).fill(1);
  const weightSum = weights.reduce((a, b) => a + b, 0);
  if (
    weights.length !== monthsInYear ||
    weights.some(w => !Number.isFinite(w) || w < 0) ||
    !Number.isFinite(weightSum) ||
    weightSum <= 0 ||
    !Number.isFinite(earnings)
  )
    throw new RangeError("Employee earnings need 12 finite nonnegative monthly weights with a positive total");
  const election = employeeElection(
    fed.year,
    x.age,
    x.birthMonth,
    input?.retirementPensionSince,
    qc ? input?.qppElection : input?.cppElection,
    rule,
  );
  const months = Array.from({ length: monthsInYear }, (_, i) => i + 1).filter(month => {
    const withinAge =
      rule.program === "cpp-employee-retirement"
        ? age < rule.params.mandatoryStopAge || (age === rule.params.mandatoryStopAge && month <= birthMonth)
        : age <= rule.params.mandatoryStopAge;
    const date = monthIndex({ year: fed.year, month });
    return withinAge && (election.from === undefined || date < election.from || (election.to ?? Infinity) <= date);
  });
  const plan = qc ? fed.payroll.qpp : fed.payroll.cpp;
  const fraction = months.length / monthsInYear;
  // Sum weights before multiplying to keep full-year and uniform cases numerically identical to legacy payroll.
  const pensionable = earnings * (months.reduce((sum, month) => sum + weights[month - 1], 0) / weightSum);
  const ceilingFraction = rule.program === "cpp-employee-retirement" ? fraction : 1;
  const exempt = plan.exempt * ceilingFraction;
  const ympe = plan.ympe * ceilingFraction;
  const yampe = plan.yampe * ceilingFraction;
  const first = Math.max(0, Math.min(pensionable, ympe) - exempt);
  const second = Math.max(0, Math.min(pensionable, yampe) - ympe);
  const base = first * plan.base;
  const enh = first * plan.enh1 + second * plan.enh2;
  const withheldFirst = Math.min(
    (plan.ympe - plan.exempt) * ceilingFraction,
    months.reduce(
      (sum, month) => sum + Math.max(0, (earnings * weights[month - 1]) / weightSum - plan.exempt / monthsInYear),
      0,
    ),
  );
  const withheldBase = withheldFirst * plan.base;
  const withheldEnhanced = withheldFirst * plan.enh1 + second * plan.enh2;
  const retirement: RetirementPayroll = {
    program: rule.program,
    contributoryMonths: months,
    pensionableEarnings: pensionable,
    election: election.status,
    withheldBase,
    withheldEnhanced,
    overpayment: Math.max(0, withheldBase + withheldEnhanced - base - enh),
  };
  return { base, enh, retirement };
}

/** Employee CPP/QPP (base and enhanced), EI, QPIP and territorial payroll tax on employment income. Other income
 *  (x.oth) pays none of them: CPP/QPP, EI and QPIP are charged on employment earnings, and the NWT and Nunavut
 *  payroll tax on employment remuneration. */
export function payrollOf(fed: Federal, p: Province | null, x: Person): Payroll {
  const qc = p?.system === "quebec";
  const e = Math.max(0, x.ord),
    plan = qc ? fed.payroll.qpp : fed.payroll.cpp;
  const pens = e > plan.exempt ? Math.min(e, plan.ympe) - plan.exempt : 0;
  const contributions = employeeRetirementPayrollOf(fed, p, x) ?? {
    base: pens * plan.base,
    enh: pens * plan.enh1 + Math.max(0, Math.min(e, plan.yampe) - plan.ympe) * plan.enh2,
  };
  const ei = Math.min(e, fed.payroll.ei.maxInsurable) * (qc ? fed.payroll.ei.quebecRate : fed.payroll.ei.rate);
  const qpip = qc ? Math.min(e, fed.payroll.qpip.maxInsurable) * fed.payroll.qpip.rate : 0;
  const terr = e * (p?.payroll?.employeeTax || 0);
  return { base: contributions.base, enh: contributions.enh, ei, qpip, terr };
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
  oth?: number; // interest, rental and other income, counted in full
  cg: number; // taxable capital gains; a net loss counts as 0
  ed: number; // grossed-up eligible dividends
  nd: number; // grossed-up non-eligible dividends
  fd: number;
  ded: number;
  enh: number; // enhanced CPP/QPP contributions
}

/** Annual deductions claimed. Legacy generic deductions exclude separately itemized claims. */
export function deductionsOf(x: Person): number {
  return (x.ded || 0) + (x.rrsp || 0) + (x.fhsa || 0);
}

/** Net income before it's floored at zero, using the province's pension plan. A net capital loss adds nothing
 *  and can't offset other income. A null province explicitly selects CPP. */
export function netIncomeParts(fed: Federal, p: Province | null, x: Person, childcareDeduction = 0): NetIncomeParts {
  const inv = fed.investment;
  return {
    ord: x.ord,
    ...(x.oth ? { oth: x.oth } : {}),
    cg: Math.max(0, x.cg) * inv.capitalGainsInclusion,
    ed: x.ed * inv.grossUp.eligible,
    nd: x.nd * inv.grossUp.nonEligible,
    fd: x.fd,
    ded: deductionsOf(x) + childcareDeduction,
    enh: payrollOf(fed, p, x).enh,
  };
}

/** Net income: total income less deductions and enhanced CPP/QPP contributions. */
export function netOf(fed: Federal, p: Province | null, x: Person, childcareDeduction = 0): number {
  const n = netIncomeParts(fed, p, x, childcareDeduction);
  return Math.max(0, n.ord + (n.oth ?? 0) + n.cg + n.ed + n.nd + n.fd - n.ded - n.enh);
}

/** RRSP deduction room: a share of earned income up to the year's dollar limit, to the nearest dollar. Current
 *  employment income stands in for last year's earned income. Other income is left out: interest, pensions and
 *  RRSP or RRIF withdrawals aren't earned income (net rental income is, but it isn't entered separately). */
export function rrspRoom(fed: Federal, x: Person): number {
  return Math.min(fed.rrsp.limit, Math.round(x.ord * fed.rrsp.rate));
}
