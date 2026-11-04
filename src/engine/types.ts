import type { FuelRate, Province, YearData } from "../data/schema.ts";
import type { ChildcareInput } from "./childcare.ts";

export type IncomeKey = "ord" | "oth" | "cg" | "ed" | "nd" | "fd";
export const INCOME_KEYS: IncomeKey[] = ["ord", "oth", "cg", "ed", "nd", "fd"];
/** The income types compute() reports in margBy: every type but other income, whose marginal rate is in its
 *  breakdown, because the golden snapshot (tests/golden/snapshot.mjs) locks every number in margBy. */
export type MarginalKey = Exclude<IncomeKey, "oth">;
export const MARGINAL_KEYS: MarginalKey[] = ["ord", "cg", "ed", "nd", "fd"];

/** Calendar month when a pension starts or an employee delivers a completed election to their employer. */
export interface PayrollMonth {
  year: number;
  month: number; // 1 = January, 12 = December
}

/** Latest stop election, optionally followed by its revocation in a later calendar year. Keep each plan separate.
 *  Earlier completed stop/restart cycles have no effect on this year's calculation and should be omitted. */
export interface EmployeeContributionElection {
  stop: PayrollMonth;
  restart?: PayrollMonth;
}

/** Employee-only timing. #14 must supply its own self-employment election and contribution calculation. */
export interface EmployeePayrollInput {
  retirementPensionSince?: PayrollMonth; // receiving either CPP or QPP continuously since this month; not pension income
  cppElection?: EmployeeContributionElection;
  qppElection?: EmployeeContributionElection;
  /** Twelve nonnegative relative weights, January first. ord is the actual annual total, allocated in this ratio.
   *  Omitted means equal monthly pay. A marginal employment dollar uses the same weights. One continuing employer,
   *  monthly pay, no disability/death or pension cancellation; not a payroll-slip/pay-period rounding calculator. */
  monthlyEarningsWeights?: number[];
}

/** One person's income for the year. ord = employment income, which pays CPP/QPP, EI and QPIP, gets the Canada
 *  employment amount and counts as working income for the benefits that phase in with work; oth = interest, rental
 *  and other income taxed in full, which does none of that but counts in net income like everything else; cg = net
 *  capital gains (can be negative); ed / nd = eligible / non-eligible dividends; fd = foreign dividends;
 *  ded = other deductions, excluding separately entered RRSP/FHSA claims. */
export interface Person {
  ord: number;
  selfEmployment?: number; // annual net business profit after expenses, before personal payroll deductions; >= 0
  oth?: number; // omitted in legacy inputs
  cg: number;
  ed: number;
  nd: number;
  fd: number;
  ded: number; // other annual deductions; legacy generic claims stay here
  rrsp?: number; // annual deduction claimed, not contributions or room
  fhsa?: number; // annual deduction claimed, including eligible deferred claims
  age?: number; // whole age on December 31 of the selected tax year; optional preserves legacy payroll
  birthMonth?: number; // required with age; 1–12. Birthday-month elections attest delivery after the birthday
  employeePayroll?: EmployeePayrollInput; // requires age + birthMonth; retirement payroll coverage selected by year data
}

export interface Household {
  people: Person[]; // one or two people with income
  active: number; // whose next dollar the marginal rates measure
  spouse: boolean; // the two people are spouses or common-law partners
  adults: number; // adults living in the household (a second adult with no income is a spouse with none)
  kids: number;
  under6: number; // how many of the children are under 6
  childAges?: number[]; // validated whole, nonnegative year-end ages, independent of paid childcare and CCB counts
  useBpa: boolean; // apply basic personal amounts and other personal credits
  whRate: number; // foreign tax withheld on foreign dividends
  useCredits: boolean; // count refundable credits
  homeValue: number;
  rent: number; // monthly
  monthlySpending: number; // taxable spending, after any frugality adjustment
  propertyRates?: Partial<Record<string, number>>; // user overrides of the municipal rate, by province code
  propertyTaxBills?: Partial<Record<string, number>>; // annual owner bills; zero is explicit, omission uses value × rate
  childcare?: ChildcareInput;
  driving?: Driving; // none: no fuel tax
}

/** The household's driving: total distance a year across its vehicles and their average fuel efficiency. */
export interface Driving {
  km: number;
  lPer100km: number; // litres per 100 km, weighted by how much each vehicle is driven
}

export type Credit = [name: string, amount: number];

export interface Ctx {
  familyBenefitChildren?: number; // MB428-A line 9: allocated once, excluding a line 3 eligible dependant
  childAmountBase?: number; // initial child claim, independent of Ontario's higher-net-income child reduction
  childTransferBase?: number; // unused SK(S2)/NU(S2) child base received from the spouse
  lowIncomeReduction?: number; // resolved family reduction, in tax dollars (including any transfer)
  childcareDeduction?: number; // calculated federal claim; not a user-entered generic deduction
  kids?: number;
  u6?: number;
  kidsAll?: number;
  famNet?: number;
  claims?: boolean;
  fam?: boolean;
}
export interface Extra {
  f: number;
  p: number;
} // extra credits in tax dollars (spouse / dependant / living alone)

export type { FuelRate, Province, YearData };
export const blank = (ord: number): Person => ({ ord, oth: 0, cg: 0, ed: 0, nd: 0, fd: 0, ded: 0 });
export const cashOf = (x: Person) => x.ord + (x.selfEmployment ?? 0) + (x.oth ?? 0) + x.cg + x.ed + x.nd + x.fd;
/** Profit before personal CPP/QPP/QPIP deductions is working income; investment/other income is not. */
export const workingIncomeOf = (x: Person) => x.ord + (x.selfEmployment ?? 0);
