// The Portfolio view of investment income: arithmetic that turns a portfolio into the amounts the engine already takes.
// Nothing here computes tax. Each person keeps their manual amounts and their portfolio side by side, and the view
// picks which one reaches the engine, so switching views never discards what was typed in the other.
import type { PortfolioAssumptions, YearData } from "../data/schema.ts";
import type { Person } from "../engine/types.ts";

export type InvestView = "manual" | "portfolio";

/** One person's portfolio. The mix and yield are percentages as typed; the mix is scaled when it doesn't total 100. */
export interface Portfolio {
  view: InvestView;
  value: number;
  canadian: number;
  foreign: number;
  bonds: number;
  yieldPct: number;
  /** Other income while in this view; null uses the manual amount. Kept apart so taking interest out here, to avoid
   *  counting it twice, leaves the manual amount as typed. */
  other: number | null;
}

/** The engine amounts a portfolio produces in a year, in whole dollars. */
export interface PortfolioAmounts {
  ed: number; // Canadian stocks: eligible dividends
  fd: number; // U.S. and international stocks: foreign dividends
  interest: number; // bonds: other income
}

/** Matches the cap on the page's other investment amounts. */
export const MAX_PORTFOLIO_VALUE = 99999999;
const MAX_PERCENT = 100;

/** The starting assumptions: the newest year's, never the selected year's, so changing year can't change them. */
export function portfolioAssumptions(years: YearData[]): PortfolioAssumptions {
  const newest = [...years].sort((a, b) => b.year - a.year);
  const found = newest.map(y => y.federal.investment.portfolioDefaults).find(Boolean);
  if (!found) throw new Error("No year has portfolio assumptions");
  return found;
}

const percent = (share: number) => +(share * 100).toFixed(6);

export const defaultPortfolio = (a: PortfolioAssumptions): Portfolio => ({
  view: "manual",
  value: 0,
  canadian: percent(a.canadian),
  foreign: percent(a.foreign),
  bonds: percent(a.bonds),
  yieldPct: percent(a.yield),
  other: null,
});

const inRange = (value: unknown, max: number): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= max;

/** A saved portfolio, keeping only known fields and valid values. null: this person uses the manual view untouched. */
export function normalizePortfolio(value: unknown, assumptions: PortfolioAssumptions): Portfolio | null {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return null;
  const saved = value as Partial<Record<keyof Portfolio, unknown>>;
  const result = defaultPortfolio(assumptions);
  if (saved.view === "portfolio") result.view = "portfolio";
  if (inRange(saved.value, MAX_PORTFOLIO_VALUE)) result.value = saved.value;
  if (inRange(saved.other, MAX_PORTFOLIO_VALUE)) result.other = saved.other;
  for (const key of ["canadian", "foreign", "bonds", "yieldPct"] as const)
    if (inRange(saved[key], MAX_PERCENT)) result[key] = saved[key];
  return JSON.stringify(result) === JSON.stringify(defaultPortfolio(assumptions)) ? null : result;
}

/** One entry per person at most, without trailing untouched people, so an unused portfolio adds nothing to a link. */
export function normalizePortfolios(
  value: unknown,
  people: number,
  assumptions: PortfolioAssumptions,
): (Portfolio | null)[] {
  if (!Array.isArray(value)) return [];
  const list = Array.from(value.slice(0, people), entry => normalizePortfolio(entry, assumptions));
  while (list.length && list[list.length - 1] === null) list.pop();
  return list;
}

export const mixTotal = (p: Portfolio) => p.canadian + p.foreign + p.bonds;
export const mixIsWhole = (p: Portfolio) => Math.abs(mixTotal(p) - 100) < 1e-6;

/** Value × each share of the mix × the yield. An empty mix has no shares to scale, so it produces nothing. */
export function portfolioAmounts(p: Portfolio): PortfolioAmounts {
  const total = mixTotal(p);
  const part = (share: number) => (total > 0 ? Math.round(p.value * (share / total) * (p.yieldPct / 100)) : 0);
  return { ed: part(p.canadian), fd: part(p.foreign), interest: part(p.bonds) };
}

/**
 * The person the engine sees. Manual view: the person as entered. Portfolio view: the portfolio's amounts replace the
 * manual dividends. Non-eligible dividends only exist in the manual view, so they count as zero here. Capital gains are
 * one input shared by both views. Bond interest joins this view's other income, such as rent, and so takes exactly the
 * path other income does.
 */
export function enginePerson(person: Person, portfolio: Portfolio | null): Person {
  if (portfolio?.view !== "portfolio") return person;
  const { ed, fd, interest } = portfolioAmounts(portfolio);
  return { ...person, ed, nd: 0, fd, oth: (portfolio.other ?? person.oth ?? 0) + interest };
}

/** A typed percentage from 0 to 100, with a decimal point or comma and an optional % sign. A cleared box is 0; anything
 *  else is null, so the caller keeps the last good value instead of guessing at what was meant. */
export function parsePercent(text: string): number | null {
  if (text.trim() === "") return 0;
  const match = /^\s*(\d+(?:[.,]\d*)?|[.,]\d+)\s*%?\s*$/.exec(text);
  if (!match) return null;
  const value = Number(match[1].replace(",", "."));
  return value <= MAX_PERCENT ? value : null;
}

/** A typed dollar amount: digits, with an optional $ sign and thousands commas. As parsePercent, a cleared box is 0 and
 *  anything else is null. Commas aren't checked for position, so "500,00" is readable while deleting a digit. */
export function parseAmount(text: string): number | null {
  if (!/^\s*\$?[\d,\s]*$/.test(text)) return null;
  const value = Number(text.replace(/[$,\s]/g, ""));
  return value <= MAX_PORTFOLIO_VALUE ? value : null;
}
