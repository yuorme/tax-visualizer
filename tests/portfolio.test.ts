// The Portfolio view is arithmetic over the engine's existing inputs: these tests pin the conversion, the way each
// amount reaches the engine, and how damaged saved values fail.
import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { listYears, loadYear } from "../src/data/load.ts";
import { portfolioDefaults } from "../src/data/schema.ts";
import { blank, compute, type Household, type Person } from "../src/engine/index.ts";
import { portfolioTooltips, tooltips } from "../src/ui/notes.ts";
import {
  defaultPortfolio,
  enginePerson,
  mixIsWhole,
  normalizePortfolio,
  normalizePortfolios,
  type Portfolio,
  parseAmount,
  parsePercent,
  portfolioAmounts,
  portfolioAssumptions,
} from "../src/ui/portfolio.ts";

const portfolio = (change: Partial<Portfolio> = {}): Portfolio => ({
  ...defaultPortfolio(assumptions),
  view: "portfolio",
  value: 500000,
  canadian: 30,
  foreign: 30,
  bonds: 40,
  yieldPct: 3,
  ...change,
});
const year = loadYear(2026);
const assumptions = portfolioAssumptions([year]);
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
  for (const value of [null, undefined, 7, "x", [], true]) assert.equal(normalizePortfolio(value, assumptions), null);
  assert.equal(normalizePortfolio({ view: "both" }, assumptions), null);
  assert.equal(normalizePortfolio({ view: "manual" }, assumptions), null);
  assert.deepEqual(
    normalizePortfolio(
      {
        view: "portfolio",
        value: -1,
        canadian: 101,
        foreign: "40",
        bonds: null,
        yieldPct: Number.POSITIVE_INFINITY,
        other: -1,
      },
      assumptions,
    ),
    { ...defaultPortfolio(assumptions), view: "portfolio" },
  );
  assert.deepEqual(normalizePortfolio({ view: "portfolio", value: Number.NaN, extra: 1 }, assumptions), {
    ...defaultPortfolio(assumptions),
    view: "portfolio",
  });
  assert.equal(normalizePortfolio({ view: "portfolio", value: 1e12 }, assumptions)?.value, 0);
  const typedInManual = { ...defaultPortfolio(assumptions), value: 250000 };
  assert.deepEqual(normalizePortfolio(typedInManual, assumptions), typedInManual, "a draft stays in the manual view");
});

test("the portfolio list has one entry per person at most and drops trailing untouched entries", () => {
  const entry = portfolio();
  for (const value of [undefined, null, {}, 3, "x"]) assert.deepEqual(normalizePortfolios(value, 2, assumptions), []);
  assert.deepEqual(normalizePortfolios([null, null], 2, assumptions), []);
  assert.deepEqual(normalizePortfolios([entry, null], 2, assumptions), [entry]);
  assert.deepEqual(normalizePortfolios([null, entry], 2, assumptions), [null, entry]);
  assert.deepEqual(normalizePortfolios([entry, entry, entry], 1, assumptions), [entry]);
  // biome-ignore lint/suspicious/noSparseArray: editing the partner first leaves a hole at the first person
  assert.deepEqual(normalizePortfolios([, entry], 2, assumptions), [null, entry]);
});

test("a typed percentage must be readable as a whole, with only a decimal comma and % sign allowed", () => {
  for (const [text, value] of [
    ["2.5", 2.5],
    ["2,5", 2.5],
    ["2.", 2],
    [".5", 0.5],
    ["40%", 40],
    [" 40 % ", 40],
    ["4,5 %", 4.5],
    ["100", 100],
    ["0", 0],
    ["", 0],
    ["   ", 0],
  ] as const)
    assert.equal(parsePercent(text), value, `"${text}"`);
  for (const text of [
    "-5",
    "+5",
    "1e2",
    "2abc3",
    "abc",
    "1.2.3",
    "1,2,3",
    "%",
    ".",
    "5 5",
    "100.01",
    "250",
    "0x10",
    "Infinity",
  ])
    assert.equal(parsePercent(text), null, `"${text}"`);
});

test("a typed amount must be digits, with only a $ sign and thousands commas allowed", () => {
  for (const [text, value] of [
    ["500000", 500000],
    ["500,000", 500000],
    ["$500,000", 500000],
    ["500,00", 50000],
    ["", 0],
    ["99999999", 99999999],
  ] as const)
    assert.equal(parseAmount(text), value, `"${text}"`);
  for (const text of ["-5", "1e2", "2abc3", "abc", "1.5", "100000000"])
    assert.equal(parseAmount(text), null, `"${text}"`);
});

test("the Portfolio view's own other income replaces the manual amount there, and leaves it as typed", () => {
  const person = { ...blank(75000), oth: 5000 };
  const bonds = portfolio({ canadian: 0, foreign: 0, bonds: 100, value: 100000, yieldPct: 5 });
  assert.equal(enginePerson(person, bonds).oth, 10000, "unchanged, the manual amount carries over");
  assert.equal(enginePerson(person, { ...bonds, other: 0 }).oth, 5000, "zero is an amount, not a missing one");
  assert.equal(enginePerson(person, { ...bonds, other: 1200 }).oth, 6200);
  assert.equal(person.oth, 5000);
  assert.equal(enginePerson(person, { ...bonds, view: "manual", other: 0 }), person);
});

test("starting assumptions come from the newest year that has them, never the selected year", () => {
  const all = listYears().map(loadYear);
  assert.deepEqual(portfolioAssumptions(all), assumptions);
  assert.deepEqual(portfolioAssumptions([...all].reverse()), assumptions);
  assert.throws(() => portfolioAssumptions([]), /No year has portfolio assumptions/);
  // A new year added without them, as the data comment allows, keeps them.
  const next = { ...year, year: 2099, federal: { ...year.federal, investment: { ...year.federal.investment } } };
  delete next.federal.investment.portfolioDefaults;
  assert.deepEqual(portfolioAssumptions([...all, next]), assumptions);
});

test("starting assumptions are whole, flagged as estimates and sourced, and the tooltips quote them", () => {
  assert.deepEqual(
    { ...defaultPortfolio(assumptions) },
    { view: "manual", value: 0, canadian: 20, foreign: 40, bonds: 40, yieldPct: 2.2, other: null },
  );
  assert.equal(assumptions.estimated, true);
  assert.equal(portfolioDefaults.safeParse({ ...assumptions, estimated: false }).success, false);
  assert.equal(portfolioDefaults.safeParse({ ...assumptions, bonds: 0.5 }).success, false, "the mix must total 100%");
  assert.equal(portfolioDefaults.safeParse({ ...assumptions, source: undefined }).success, false);
  const page = fs.readFileSync(new URL("../src/ui/index.html", import.meta.url), "utf8");
  assert.ok(page.includes(`href="${assumptions.source.url}"`), "the page's source link matches the data");
  assert.ok(page.includes(assumptions.source.label), "the page's source label matches the data");
  const cached = fs.readFileSync(
    new URL("../docs/verification/2026/sources/vanguard-vbal.txt", import.meta.url),
    "utf8",
  );
  for (const figure of ["2.22%", "18.08%", "27.98%", "11.05%", "4.70%", "22.89%", "7.84%", "7.43%"])
    assert.ok(cached.includes(figure), `${figure} is in the cached source`);
  const tips = portfolioTooltips(assumptions);
  assert.match(tips.portfolioMix, /20% Canadian stocks, 40% U.S. and international stocks and 40% bonds/);
  assert.match(tips.portfolioMix, /eligible dividends/);
  assert.match(tips.portfolioMix, /foreign dividends/);
  assert.match(tips.portfolioMix, /added to any amount under Other income/);
  assert.match(tips.portfolioYield, /2\.2%/);
  assert.match(tips.portfolioYield, /no gains are assumed/);
  for (const tip of [tips.portfolioMix, tips.portfolioYield]) assert.ok(tip.includes(assumptions.basis));
  assert.match(tips.portfolioView, /Non-eligible dividends are entered in Manual only/);
  assert.match(tips.portfolioView, /won't match your slips/);
  assert.match(tooltips(year).otherIncome, /also leave out interest from that portfolio/);
});
