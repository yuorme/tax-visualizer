// The Portfolio view of investment income: arithmetic that turns a portfolio into the amounts the engine already takes.
// Nothing here computes tax. Each person keeps their manual amounts and their portfolio side by side, and the view
// picks which one reaches the engine, so switching views never discards what was typed in the other.
import type { Person } from "../engine/types.ts";
import { PORTFOLIO_DEFAULTS } from "./defaults.ts";

export type InvestView = "manual" | "portfolio";

/** One person's portfolio. The mix and yield are percentages as typed; the mix is scaled when it doesn't total 100. */
export interface Portfolio {
  view: InvestView;
  value: number;
  canadian: number;
  foreign: number;
  bonds: number;
  yieldPct: number;
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

export const defaultPortfolio = (): Portfolio => ({
  view: "manual",
  value: 0,
  canadian: PORTFOLIO_DEFAULTS.canadian,
  foreign: PORTFOLIO_DEFAULTS.foreign,
  bonds: PORTFOLIO_DEFAULTS.bonds,
  yieldPct: PORTFOLIO_DEFAULTS.yieldPct,
});

const inRange = (value: unknown, max: number): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= max;

/** A saved portfolio, keeping only known fields and valid values. null: this person uses the manual view untouched. */
export function normalizePortfolio(value: unknown): Portfolio | null {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return null;
  const saved = value as Partial<Record<keyof Portfolio, unknown>>;
  const result = defaultPortfolio();
  if (saved.view === "portfolio") result.view = "portfolio";
  if (inRange(saved.value, MAX_PORTFOLIO_VALUE)) result.value = saved.value;
  for (const key of ["canadian", "foreign", "bonds", "yieldPct"] as const)
    if (inRange(saved[key], MAX_PERCENT)) result[key] = saved[key];
  return JSON.stringify(result) === JSON.stringify(defaultPortfolio()) ? null : result;
}

/** One entry per person at most, without trailing untouched people, so an unused portfolio adds nothing to a link. */
export function normalizePortfolios(value: unknown, people: number): (Portfolio | null)[] {
  if (!Array.isArray(value)) return [];
  const list = Array.from(value.slice(0, people), entry => normalizePortfolio(entry));
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
 * one input shared by both views. Bond interest joins whatever is typed under other income, such as rent, and so takes
 * exactly the path other income does.
 */
export function enginePerson(person: Person, portfolio: Portfolio | null): Person {
  if (portfolio?.view !== "portfolio") return person;
  const { ed, fd, interest } = portfolioAmounts(portfolio);
  return { ...person, ed, nd: 0, fd, oth: (person.oth ?? 0) + interest };
}

/** A typed percentage, bounded to 0–100. A comma is a decimal point; anything unreadable is 0. */
export function parsePercent(text: string): number {
  const value = Number(text.replace(",", ".").replace(/[^\d.]/g, ""));
  return Number.isFinite(value) ? Math.min(value, MAX_PERCENT) : 0;
}
