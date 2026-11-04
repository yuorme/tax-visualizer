// The Portfolio view is arithmetic over the engine's existing inputs: these tests pin the conversion, the way each
// amount reaches the engine, and how damaged saved values fail.
import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { loadYear } from "../src/data/load.ts";
import { blank, compute, type Household, type Person } from "../src/engine/index.ts";
import { PORTFOLIO_DEFAULTS } from "../src/ui/defaults.ts";
import { tooltips } from "../src/ui/notes.ts";
import {
  defaultPortfolio,
  enginePerson,
  mixIsWhole,
  normalizePortfolio,
  normalizePortfolios,
  type Portfolio,
  parsePercent,
  portfolioAmounts,
} from "../src/ui/portfolio.ts";

const portfolio = (change: Partial<Portfolio> = {}): Portfolio => ({
  ...defaultPortfolio(),
  view: "portfolio",
  value: 500000,
  canadian: 30,
  foreign: 30,
  bonds: 40,
  yieldPct: 3,
  ...change,
});
const year = loadYear(2026);
const ontario = year.provinces.find(p => p.code === "ON");
const household = (person: Person): Household => ({
  people: [person],
  active: 0,
  spouse: false,
  adults: 1,
  kids: 0,
  under6: 0,
  useBpa: true,
  whRate: 0.15,
  useCredits: true,
  homeValue: 0,
  rent: 0,
  monthlySpending: 2000,
});
const run = (person: Person) => {
  if (!ontario) throw new Error("Ontario is missing");
  return compute(year, ontario, household(person));
};

test("each asset class becomes its engine amount: value × share × yield", () => {
  assert.deepEqual(portfolioAmounts(portfolio()), { ed: 4500, fd: 4500, interest: 6000 });
  assert.deepEqual(portfolioAmounts(portfolio({ canadian: 100, foreign: 0, bonds: 0 })), {
    ed: 15000,
    fd: 0,
    interest: 0,
  });
  assert.deepEqual(portfolioAmounts(portfolio({ value: 0 })), { ed: 0, fd: 0, interest: 0 });
  assert.deepEqual(portfolioAmounts(portfolio({ yieldPct: 0 })), { ed: 0, fd: 0, interest: 0 });
});

test("a mix that doesn't total 100 is scaled, and an empty mix produces nothing", () => {
  const twice = portfolio({ canadian: 60, foreign: 60, bonds: 80 });
  assert.equal(mixIsWhole(twice), false);
  assert.deepEqual(portfolioAmounts(twice), portfolioAmounts(portfolio()));
  assert.equal(mixIsWhole(portfolio({ canadian: 33.3, foreign: 33.3, bonds: 33.4 })), true);
  assert.deepEqual(portfolioAmounts(portfolio({ canadian: 0, foreign: 0, bonds: 0 })), { ed: 0, fd: 0, interest: 0 });
});

test("the manual view hands the engine the person as entered", () => {
  const person = { ...blank(75000), ed: 1000, nd: 2000, fd: 3000, oth: 4000 };
  assert.equal(enginePerson(person, null), person);
  assert.equal(enginePerson(person, portfolio({ view: "manual" })), person);
});

test("the portfolio view replaces manual dividends, keeps gains and adds bond interest to other income", () => {
  const person = { ...blank(75000), oth: 1200, cg: -500, ed: 1000, nd: 2000, fd: 3000, ded: 700, rrsp: 800, fhsa: 900 };
  assert.deepEqual(enginePerson(person, portfolio()), {
    ...person,
    oth: 7200,
    ed: 4500,
    nd: 0,
    fd: 4500,
  });
  // Reading it must not disturb the manual amounts, or switching back would lose them.
  assert.deepEqual(person, {
    ...blank(75000),
    oth: 1200,
    cg: -500,
    ed: 1000,
    nd: 2000,
    fd: 3000,
    ded: 700,
    rrsp: 800,
    fhsa: 900,
  });
});

test("a portfolio gives the engine's exact result for the same amounts typed by hand", () => {
  const typed = run({ ...blank(75000), oth: 6000, ed: 4500, fd: 4500 });
  assert.deepEqual(run(enginePerson(blank(75000), portfolio())), typed);
});

test("bond interest gets none of the employment-only treatment", () => {
  // Below the CPP and EI ceilings, so income treated as employment would visibly raise contributions.
  const base = run(blank(40000));
  const bonds = enginePerson(blank(40000), portfolio({ canadian: 0, foreign: 0, bonds: 100, value: 100000 }));
  assert.equal(bonds.ord, 40000);
  assert.equal(bonds.oth, 3000);
  const result = run(bonds);
  assert.deepEqual(result.me.pay, base.me.pay);
  assert.equal(result.me.fEmp, base.me.fEmp);
  // It is still taxable income: same net income as other income typed by hand, and more federal tax than without it.
  assert.deepEqual(result, run({ ...blank(40000), oth: 3000 }));
  assert.ok(result.fed > base.fed);
  assert.notDeepEqual(result.me.pay, run(blank(43000)).me.pay, "treated as wages, CPP and EI would rise");
});

test("damaged saved portfolios fall back field by field, and only a known view leaves manual", () => {
  for (const value of [null, undefined, 7, "x", [], true]) assert.equal(normalizePortfolio(value), null);
  assert.equal(normalizePortfolio({ view: "both" }), null);
  assert.equal(normalizePortfolio({ view: "manual" }), null);
  assert.deepEqual(
    normalizePortfolio({
      view: "portfolio",
      value: -1,
      canadian: 101,
      foreign: "40",
      bonds: null,
      yieldPct: Number.POSITIVE_INFINITY,
    }),
    { ...defaultPortfolio(), view: "portfolio" },
  );
  assert.deepEqual(normalizePortfolio({ view: "portfolio", value: Number.NaN, extra: 1 }), {
    ...defaultPortfolio(),
    view: "portfolio",
  });
  assert.equal(normalizePortfolio({ view: "portfolio", value: 1e12 })?.value, 0);
  const typedInManual = { ...defaultPortfolio(), value: 250000 };
  assert.deepEqual(normalizePortfolio(typedInManual), typedInManual, "a draft stays in the manual view");
});

test("the portfolio list has one entry per person at most and drops trailing untouched entries", () => {
  const entry = portfolio();
  for (const value of [undefined, null, {}, 3, "x"]) assert.deepEqual(normalizePortfolios(value, 2), []);
  assert.deepEqual(normalizePortfolios([null, null], 2), []);
  assert.deepEqual(normalizePortfolios([entry, null], 2), [entry]);
  assert.deepEqual(normalizePortfolios([null, entry], 2), [null, entry]);
  assert.deepEqual(normalizePortfolios([entry, entry, entry], 1), [entry]);
  // biome-ignore lint/suspicious/noSparseArray: editing the partner first leaves a hole at the first person
  assert.deepEqual(normalizePortfolios([, entry], 2), [null, entry]);
});

test("typed percentages are bounded and unreadable text is 0", () => {
  assert.equal(parsePercent("2.5"), 2.5);
  assert.equal(parsePercent("2,5"), 2.5);
  assert.equal(parsePercent(" 40 % "), 40);
  assert.equal(parsePercent("250"), 100);
  assert.equal(parsePercent("-5"), 5);
  assert.equal(parsePercent(""), 0);
  assert.equal(parsePercent("1.2.3"), 0);
  assert.equal(parsePercent("abc"), 0);
});

test("starting assumptions are whole, flagged as estimates and sourced, and the tooltips quote them", () => {
  const { estimated, canadian, foreign, bonds, yieldPct, source } = PORTFOLIO_DEFAULTS;
  assert.equal(estimated, true);
  assert.equal(canadian + foreign + bonds, 100);
  assert.match(source.url, /^https:\/\//);
  const page = fs.readFileSync(new URL("../src/ui/index.html", import.meta.url), "utf8");
  assert.ok(page.includes(`href="${source.url}"`), "the page's source link matches the constant");
  assert.ok(page.includes(source.label), "the page's source label matches the constant");
  const tips = tooltips(year);
  assert.match(tips.portfolioMix, new RegExp(`${canadian}% Canadian stocks, ${foreign}% U.S. and international`));
  assert.match(tips.portfolioMix, /eligible dividends/);
  assert.match(tips.portfolioMix, /foreign dividends/);
  assert.match(tips.portfolioMix, /added to any amount under Other income/);
  assert.match(tips.portfolioYield, new RegExp(`${yieldPct}%`));
  assert.match(tips.portfolioYield, /no gains are assumed/);
  for (const tip of [tips.portfolioMix, tips.portfolioYield]) assert.ok(tip.includes(PORTFOLIO_DEFAULTS.basis));
  assert.match(tips.portfolioView, /Non-eligible dividends are entered in Manual only/);
  assert.match(tips.portfolioView, /won't match your slips/);
});
