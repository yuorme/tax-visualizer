import type { Province, YearData } from "../data/schema.ts";

export type IncomeKey = "ord" | "cg" | "ed" | "nd" | "fd";
export const INCOME_KEYS: IncomeKey[] = ["ord", "cg", "ed", "nd", "fd"];

/** One person's income for the year. ord = employment and other fully taxed income; cg = net capital gains (can be
 *  negative); ed / nd = eligible / non-eligible dividends; fd = foreign dividends; ded = deductions (RRSP etc.). */
export interface Person { ord: number; cg: number; ed: number; nd: number; fd: number; ded: number }

export interface Household {
  people: Person[];          // one or two people with income
  active: number;            // whose next dollar the marginal rates measure
  spouse: boolean;           // the two people are spouses or common-law partners
  adults: number;            // adults living in the household (a second adult with no income is a spouse with none)
  kids: number;
  under6: number;            // how many of the children are under 6
  useBpa: boolean;           // apply basic personal amounts and other personal credits
  whRate: number;            // foreign tax withheld on foreign dividends
  useCredits: boolean;       // count refundable credits
  homeValue: number;
  rent: number;              // monthly
  monthlySpending: number;   // taxable spending, after any frugality adjustment
  propertyRates?: Partial<Record<string, number>>;   // user overrides of the municipal rate, by province code
}

export type Credit = [name: string, amount: number];

export interface Ctx { kids?: number; u6?: number; kidsAll?: number; famNet?: number; claims?: boolean; fam?: boolean }
export interface Extra { f: number; p: number }    // extra credits in tax dollars (spouse / dependant / living alone)

export type { Province, YearData };
export const blank = (ord: number): Person => ({ ord, cg: 0, ed: 0, nd: 0, fd: 0, ded: 0 });
export const cashOf = (x: Person) => x.ord + x.cg + x.ed + x.nd + x.fd;
