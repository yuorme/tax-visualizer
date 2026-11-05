import type { Federal, Province } from "../data/schema.ts";
import { deductionsOf, payrollDetailsOf } from "./payroll.ts";
import { publicPensionReceipts } from "./public-pensions.ts";
import { type Person, retirementCashOf } from "./types.ts";

export class UnsupportedGisAllowanceError extends Error {
  readonly year: number;
  constructor(year: number) {
    super(`GIS and Allowance are not supported by the ${year} data`);
    this.name = "UnsupportedGisAllowanceError";
    this.year = year;
  }
}

export type GisCategory = "single" | "spouse-oas" | "spouse-neither" | "spouse-allowance";
const cents = (n: number) => Math.round(n * 100) / 100;
const sumMoney = (ns: number[]) => ns.reduce((s, n) => s + Math.round(n * 100), 0) / 100;
// Suppress only binary roundoff at an exact band boundary, never a genuine one-cent crossing.
const floorBand = (n: number) => Math.floor(n + Number.EPSILON * Math.max(1, Math.abs(n)) * 8);

export function validateGisAllowance(fed: Federal, people: Person[]) {
  if (people.some(x => x.gis !== undefined || x.allowance !== undefined) && !fed.gisAllowance)
    throw new UnsupportedGisAllowanceError(fed.year);
  for (const x of people) {
    for (const key of ["gis", "allowance"] as const)
      if (x[key] !== undefined && typeof x[key] !== "boolean") throw new RangeError(`${key} must be a boolean opt-in`);
    if (!x.gis && !x.allowance) continue;
    if (
      x.age === undefined ||
      !Number.isSafeInteger(x.age) ||
      x.age < 0 ||
      x.birthMonth === undefined ||
      !Number.isInteger(x.birthMonth) ||
      x.birthMonth < 1 ||
      x.birthMonth > 12
    )
      throw new RangeError("GIS and Allowance require a whole year-end age and birthMonth from 1 to 12");
  }
}

/** ISP3026 blocks 1–9, current income standing in for the two historical income years.
 * Payroll is deducted BEFORE applying each adult's combined employment/business exemption. OAS and
 * supplements are excluded; taxable dividends/gains, CPP/QPP and private retirement receipts are included.
 * The caller supplies the proxy year's childcare claim, not a deduction inferred from the benefit itself. */
export function gisIncomeOf(fed: Federal, p: Province, x: Person, childcare = 0, excessDividendCredit = 0) {
  const q = fed.gisAllowance?.params;
  if (!q) throw new UnsupportedGisAllowanceError(fed.year);
  const { pay, selfEmployment: self } = payrollDetailsOf(fed, p, x);
  const working = Math.max(0, x.ord + (x.selfEmployment ?? 0) - pay.base - pay.enh - pay.ei);
  const earningsExemption =
    Math.min(working, q.earningsExemption) +
    Math.min(q.partialExemptionRange, Math.max(0, working - q.earningsExemption)) * q.partialExemptionRate;
  const other =
    (x.oth ?? 0) +
    (x.cppQpp ?? 0) +
    retirementCashOf(x) +
    x.fd +
    Math.max(0, x.cg) * fed.investment.capitalGainsInclusion +
    x.ed * fed.investment.grossUp.eligible +
    x.nd * fed.investment.grossUp.nonEligible;
  const dividendAdjustment = excessDividendCredit * q.excessDividendCreditMultiplier;
  const deductions = deductionsOf(x) + childcare + (self?.qpipDeduction ?? 0) + dividendAdjustment;
  // Keep losses/deductions until spouses' incomes have been combined; floor the tested total, not each adult.
  return {
    working,
    earningsExemption,
    other,
    deductions,
    dividendAdjustment,
    income: working - earningsExemption + other - deductions,
  };
}

/** Exact published monthly income bands, including s.22(6)'s protection of the couple's combined payment.
 * The OAS equivalent always uses the 65–74 rate, even when the pensioner is 75+. */
export function gisMonthly(fed: Federal, quarter: number, income: number, category: GisCategory) {
  const q = fed.gisAllowance?.params;
  const oas = fed.publicPensions?.params.quarterlyMonthly[quarter]?.[0];
  if (!q || oas === undefined || !q.quarterly[quarter]) throw new RangeError("GIS requires a supported quarter");
  const r = q.quarterly[quarter];
  const tested = Math.max(0, income);
  const reduce = (n: number, step: number) => Math.max(0, floorBand(n / step)) * q.monthlyReduction;
  const single = category === "single";
  const top = (maximum: number) =>
    Math.max(
      0,
      maximum -
        reduce(
          tested - (single ? q.singleTopUpThreshold : q.coupleTopUpThreshold),
          single ? q.singleTopUpStep : q.coupleTopUpStep,
        ),
    );
  const singleBase = cents(r.singleMaximum - r.singleTopUp);
  const coupleBase = cents(r.coupleMaximum - r.coupleTopUp);
  const neitherOffset = Math.ceil(oas / q.pensionRounding) * q.pensionRounding * 12;
  const neither = Math.max(0, singleBase - reduce(tested - neitherOffset, q.coupleIncomeStep)) + top(r.singleTopUp);
  let gis: number;
  let allowance = 0;
  let protection = 0;
  if (single) gis = Math.max(0, singleBase - reduce(tested, q.singleIncomeStep)) + top(r.singleTopUp);
  else if (category === "spouse-oas")
    gis = Math.max(0, coupleBase - reduce(tested, q.coupleIncomeStep)) + top(r.coupleTopUp);
  else if (category === "spouse-neither") gis = neither;
  else {
    const pensionSteps = Math.ceil(oas / q.allowancePensionRounding);
    const residual = reduce(tested - pensionSteps * q.coupleIncomeStep, q.coupleIncomeStep);
    gis = Math.max(0, coupleBase - residual) + top(r.coupleTopUp);
    allowance = gis + Math.max(0, oas - floorBand(tested / q.coupleIncomeStep) * q.allowanceReduction);
    // Part II entitlement replaces/increases the older spouse's GIS as Part III tapers out.
    protection = Math.max(0, neither - gis - allowance);
    gis += protection;
  }
  return { gis: cents(gis), allowance: cents(allowance), protection: cents(protection) };
}

export function gisAllowanceOf(
  fed: Federal,
  p: Province,
  people: Person[],
  couple: boolean,
  claims: number[],
  excessDividendCredits: number[] = [],
) {
  validateGisAllowance(fed, people);
  if (!people.some(x => x.gis || x.allowance)) return undefined;
  const q = fed.gisAllowance?.params;
  if (!q) throw new UnsupportedGisAllowanceError(fed.year);
  const incomes = people.map((x, i) => gisIncomeOf(fed, p, x, claims[i], excessDividendCredits[i]));
  const oas = people.map(x => publicPensionReceipts(fed, x).monthly);
  const adults = people.map(() => ({
    gis: 0,
    allowance: 0,
    monthly: [] as {
      category: GisCategory | null;
      income: number;
      gis: number;
      allowance: number;
      protection: number;
    }[],
  }));
  const reached = (x: Person, age: number, month: number) =>
    x.age !== undefined && (x.age > age || (x.age === age && month >= (x.birthMonth ?? 0) + q.effectiveMonthOffset));
  for (let month = 1; month <= 12; month++) {
    const rows = people.map((_, i) => ({
      category: null as GisCategory | null,
      income: Math.max(0, couple ? incomes.reduce((s, x) => s + x.income, 0) : incomes[i].income),
      gis: 0,
      allowance: 0,
      protection: 0,
    }));
    for (const [i, x] of people.entries()) {
      if (!x.gis || !oas[i][month - 1]) continue;
      const partner = couple ? people[1 - i] : undefined;
      const allowanceEligible =
        partner?.allowance &&
        reached(partner, q.allowanceMinimumAge, month) &&
        !reached(partner, q.allowanceEndAge, month);
      const category: GisCategory = !partner
        ? "single"
        : oas[1 - i][month - 1]
          ? "spouse-oas"
          : allowanceEligible
            ? "spouse-allowance"
            : "spouse-neither";
      const amounts = gisMonthly(fed, Math.floor((month - 1) / 3), rows[i].income, category);
      rows[i] = { ...rows[i], ...amounts, allowance: 0, category };
      if (partner && allowanceEligible && amounts.gis > 0) rows[1 - i].allowance = amounts.allowance;
    }
    rows.forEach((row, i) => {
      adults[i].monthly.push(row);
    });
  }
  adults.forEach(x => {
    x.gis = sumMoney(x.monthly.map(m => m.gis));
    x.allowance = sumMoney(x.monthly.map(m => m.allowance));
  });
  return {
    incomes,
    adults,
    total: sumMoney(adults.flatMap(x => [x.gis, x.allowance])),
    incomeYearAssumption: "current-year-proxy" as const,
  };
}
