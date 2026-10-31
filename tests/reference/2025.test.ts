// Reference tests: results checked against figures published outside this project. Unlike the golden test, these
// don't come from our own code, so they catch errors the golden fixtures would have locked in.
// One file per year; the year comes from the file name (tests/reference/<year>.test.ts).
import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { loadYear } from "../../src/data/load.ts";
import { blank, compute, type Household } from "../../src/engine/index.ts";

const year = Number(path.basename(import.meta.filename, ".test.ts"));
const y = loadYear(year);
const prov = (c: string) => {
  const p = y.provinces.find(p => p.code === c);
  if (!p) throw new Error(`no province ${c}`);
  return p;
};
const single = (ord: number, extra: Partial<Household> = {}): Household => ({
  people: [blank(ord)],
  active: 0,
  spouse: true,
  adults: 1,
  kids: 0,
  under6: 0,
  useBpa: true,
  whRate: 0.15,
  useCredits: true,
  homeValue: 0,
  rent: 0,
  monthlySpending: 0,
  ...extra,
});
const pct = (v: number) => Math.round(v * 10000) / 100;
const credits = (r: ReturnType<typeof compute>) => r.credits.map(([n, v]) => [n, Math.round(v)]);

// Top combined (federal + provincial) marginal rates for 2025 on income above the top bracket, from TaxTips.ca's
// "2024 & 2025 tax rates" tables for each province and territory
// (https://www.taxtips.ca/priortaxrates/tax-rates-2024-2025/<code>.htm). Quebec includes the 16.5% abatement and
// Ontario its surtax. Rates on dividends and capital gains are per dollar received (not grossed up or taxable).
// The NWT and Nunavut figures add their 2% payroll tax on employment income, which the calculator counts and the
// published income tax tables don't (47.05% and 44.5% before it).
// Columns: ordinary income, capital gains, eligible dividends, non-eligible dividends.
const TOP: Record<string, [ord: number, cg: number, ed: number, nd: number]> = {
  BC: [53.5, 26.75, 36.54, 48.89],
  YT: [48, 24, 28.93, 44.04],
  AB: [48, 24, 34.31, 42.31],
  NT: [49.05, 23.53, 28.33, 36.82],
  SK: [47.5, 23.75, 29.64, 41.34],
  MB: [50.4, 25.2, 37.78, 46.67],
  NU: [46.5, 22.25, 33.08, 37.79],
  ON: [53.53, 26.76, 39.34, 47.74],
  QC: [53.31, 26.65, 40.11, 48.7],
  NB: [52.5, 26.25, 32.4, 46.83],
  PE: [52, 26, 36.54, 47.92],
  NS: [54, 27, 41.58, 49.99],
  NL: [54.8, 27.4, 46.2, 48.96],
};

test(`${year} top marginal rates on ordinary income match published tables`, () => {
  // Quebec's exact rate is 53.305%, which the published table rounds up; allow half a hundredth for that
  for (const [c, [ord]] of Object.entries(TOP)) {
    const m = compute(y, prov(c), single(2_000_000)).margBy.ord * 100;
    assert.ok(Math.abs(m - ord) <= 0.0051, `${c}: ${m} vs ${ord}`);
  }
});

test(`${year} top marginal rates on capital gains and dividends match published tables`, () => {
  for (const [c, [, cg, ed, nd]] of Object.entries(TOP)) {
    const r = compute(y, prov(c), single(2_000_000));
    assert.equal(pct(r.margBy.cg), cg, `${c} capital gains`);
    assert.equal(pct(r.margBy.ed), ed, `${c} eligible dividends`);
    assert.equal(pct(r.margBy.nd), nd, `${c} non-eligible dividends`);
  }
});

test("Manitoba's basic personal amount phase-out raises the marginal rate between $253,414 and $400,000", () => {
  // TaxTips.ca: 51.25% on other income, 25.63% on capital gains, 38.96% and 47.65% on dividends in that range
  const r = compute(y, prov("MB"), single(300_000));
  assert.equal(pct(r.margBy.ord), 51.25);
  assert.equal(pct(r.margBy.cg), 25.63);
  assert.equal(pct(r.margBy.ed), 38.96);
  assert.equal(pct(r.margBy.nd), 47.65);
});

test("the federal lowest rate is 14.5% for 2025 (CRA's 2025 rate table: 15% before July 1, 14% after)", () => {
  assert.equal(y.federal.brackets[0][1], 0.145);
  assert.equal(y.federal.brackets[0][0], 57_375);
});

test("Ontario single renter at $25,000: refundable credits match CRA's published formulas", () => {
  // GST/HST credit sheet: 349 + the lesser of 184 and 2% × (25,000 − 11,337) = 533 (RC4210's maximum for a single person)
  // CWB: Schedule 6 maximum 1,633 (the phase-out starts at 26,855)
  // OSTC 371 (RC4210)
  // OEPTC calculation sheet: occupancy cost 14,400 × 20% = 2,880; energy min(2,880, 285) = 285;
  // property min(10% × 2,880 = 288, 927) + 71 = 359; no reduction below 28,506
  const r = compute(y, prov("ON"), single(25_000, { rent: 1200 }));
  assert.deepEqual(credits(r), [
    ["GST/HST credit", 533],
    ["Canada Workers Benefit", 1633],
    ["Ontario sales tax credit", 371],
    ["Ontario energy and property tax credit", 644],
  ]);
});

test("PEI sales tax credit follows RC4210 (2025-26): $110 + supplement up to $55, less 2% over $50,000", () => {
  const credit = (income: number, extra: Partial<Household> = {}) =>
    compute(y, prov("PE"), single(income, extra)).credits.find(([n]) => n === "PEI sales tax credit")?.[1];
  // The credit uses family net income, which is employment income less the deductible enhanced CPP (1% of earnings
  // above the $3,500 exemption)
  const net = (income: number) => income - 0.01 * (income - 3500);
  const near = (a: number | undefined, b: number) =>
    assert.ok(a !== undefined && Math.abs(a - b) < 0.005, `${a} vs ${b}`);
  // 110 + 0.5% × (net − 30,000)
  near(credit(40_000), 110 + 0.005 * (net(40_000) - 30_000));
  // supplement capped at 55 from 41,000 of net income: 165 until 50,000
  near(credit(45_000), 165);
  // 165 − 2% × (net − 50,000)
  near(credit(55_000), 165 - 0.02 * (net(55_000) - 50_000));
  // reduced to nothing by 58,250 (165 / 0.02 = 8,250 over the threshold); no minimum amount
  assert.equal(credit(60_000) ?? 0, 0);
});

test("Quebec single at $12,620 gets the maximum work premium and Canada Workers Benefit (Finances Québec, Schedule 6)", () => {
  // General work premium maximum for a person living alone 1,185.52 (reduction threshold 12,620);
  // Quebec's Canada Workers Benefit maximum for a single person 3,812.06 (Schedule 6, Quebec version)
  const r = compute(y, prov("QC"), single(12_620));
  const byName = Object.fromEntries(r.credits);
  assert.ok(Math.abs(byName["Work premium"] - 1185.52) < 0.01, `work premium ${byName["Work premium"]}`);
  assert.ok(Math.abs(byName["Canada Workers Benefit"] - 3812.06) < 0.01, `CWB ${byName["Canada Workers Benefit"]}`);
});

test("a family with one child under 6 at low income gets the published Canada child benefit maximum", () => {
  // T4114 (July 2025 to June 2026): $7,997 for a child under 6. Alberta's family benefit adds its own amounts, so use
  // Yukon, whose benefit is $936.96 ($78.08 a month) per child below $35,000.
  const r = compute(y, prov("YT"), single(30_000, { kids: 1, under6: 1 }));
  assert.ok(Math.abs(r.childBen - (7997 + 936.96)) < 0.01, `child benefits ${r.childBen}`);
});

test("Quebec two-parent family under the thresholds gets the published maximums", () => {
  // T4114: $6,748 Canada child benefit for a child aged 6 to 17 (income below $37,487); Retraite Québec, 2025
  // benefit amounts: family allowance $3,006 per child plus $124 for school supplies (income below $59,369)
  const r = compute(y, prov("QC"), single(30_000, { kids: 1, under6: 0, adults: 2 }));
  assert.ok(Math.abs(r.childBen - (6748 + 3006 + 124)) < 0.01, `child benefits ${r.childBen}`);
});
