// Reference tests: results checked against figures published outside this project. Unlike the golden test, these
// don't come from our own code, so they catch errors the golden fixtures would have locked in.
// One file per year; the year comes from the file name (tests/reference/<year>.test.ts).
import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { loadYear } from "../../src/data/load.ts";
import type { FuelRate } from "../../src/data/schema.ts";
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
function need<T>(v: T | null | undefined): T {
  assert.ok(v != null);
  return v;
}

// Top combined (federal + provincial) marginal rates on ordinary income for 2026, as published in the
// provincial rate tables (e.g. TaxTips.ca, EY tax calculators). Quebec includes the 16.5% abatement.
// The NWT and Nunavut figures add their 2% payroll tax on employment income, which the calculator counts
// and the published income tax tables don't (47.05% and 44.5% before it).
const TOP_ORDINARY: Record<string, number> = {
  BC: 53.5,
  YT: 48,
  AB: 48,
  NT: 49.05,
  SK: 47.5,
  MB: 50.4,
  NU: 46.5,
  ON: 53.53,
  QC: 53.31,
  NB: 52.5,
  PE: 53,
  NS: 54,
  NL: 54.8,
};

test(`${year} top marginal rates on ordinary income match published tables`, () => {
  for (const [c, expected] of Object.entries(TOP_ORDINARY))
    assert.equal(pct(compute(y, prov(c), single(2_000_000)).margBy.ord), expected, c);
});

test(`${year} Ontario top marginal rates on dividends match published tables`, () => {
  const r = compute(y, prov("ON"), single(2_000_000));
  assert.equal(pct(r.margBy.ed), 39.34);
  assert.equal(pct(r.margBy.nd), 47.74);
});

test("Ontario single renter at $25,000: refundable credits match a hand calculation", () => {
  // CGEB 445 + min(234, 2% × (25,000 − 11,564)) = 679; CWB max 1,665 (phase-out starts above $27,392);
  // OSTC 378; OEPTC: rent 14,400 × 20% = 2,880 → energy 290 + property min(2,880, 288 + 73) = 651
  const r = compute(y, prov("ON"), single(25_000, { rent: 1200 }));
  assert.deepEqual(
    r.credits.map(([n, v]) => [n, Math.round(v)]),
    [
      ["Canada Groceries and Essentials Benefit", 679],
      ["Canada Workers Benefit", 1665],
      ["Ontario sales tax credit", 378],
      ["Ontario energy and property tax credit", 651],
    ],
  );
});

// ---------- Fuel tax on gasoline ----------
// Per-litre rates, in cents, as published. Unless noted, from Natural Resources Canada's Fuel Consumption Levies in
// Canada table (rates as of September 2, 2026; docs/verification/2026/sources/nrcan-fuel-consumption-levies.txt).
// [date, cents]: the rate in force from that date. Later changes come from the government's own notice.
const GASOLINE: Record<string, { provincial: [string, number][]; regional?: [string, number] }> = {
  NL: {
    provincial: [
      ["2026-01-01", 7.5],
      ["2026-12-01", 0],
    ],
  }, // NL release, October 26, 2026: 0¢ from December 1
  PE: {
    provincial: [
      ["2026-01-01", 8.47],
      ["2026-09-26", 0],
    ],
  }, // IRAC notice, September 25, 2026
  NS: { provincial: [["2026-01-01", 15.5]] },
  NB: { provincial: [["2026-01-01", 10.87]] },
  QC: { provincial: [["2026-01-01", 19.2]], regional: ["ARTM", 3] }, // ARTM budget 2026: $0.03 a litre
  ON: { provincial: [["2026-01-01", 9.0]] },
  MB: { provincial: [["2026-01-01", 12.5]] },
  SK: { provincial: [["2026-01-01", 15.0]] },
  // Alberta historical fuel tax rates: $0.130 from March 1, 2025 to September 30, 2026; $0.000 from October 1, 2026
  AB: {
    provincial: [
      ["2026-01-01", 13],
      ["2026-10-01", 0],
    ],
  },
  // NRCan: 27.00¢ in the Vancouver area; B.C. Ministry of Finance: of which 18.50¢ goes to TransLink
  BC: { provincial: [["2026-01-01", 27.0 - 18.5]], regional: ["TransLink", 18.5] },
  YT: { provincial: [["2026-01-01", 6.2]] },
  NT: { provincial: [["2026-01-01", 10.7]] },
  NU: { provincial: [["2026-01-01", 6.4]] },
};
/** A rate as [date, cents] pairs: one pair for a rate that held all year. */
const pairs = (r: FuelRate): [string, number][] =>
  typeof r === "number" ? [[`${year}-01-01`, r * 100]] : r.map(x => [x.from, x.rate * 100]);
function near(got: [string, number][], want: [string, number][], what: string) {
  assert.deepEqual(
    got.map(([d]) => d),
    want.map(([d]) => d),
    `${what}: dates`,
  );
  for (const [i, [, c]] of got.entries())
    assert.ok(Math.abs(c - want[i][1]) < 1e-9, `${what}: ${c}¢ vs ${want[i][1]}¢`);
}

test(`${year} gasoline tax per litre matches each published rate, including mid-year changes`, () => {
  // Department of Finance: 10¢, then 0¢ from April 20, 2026 (extended on September 2 to January 31, 2027)
  near(
    pairs(need(y.federal.fuelTax).gasoline),
    [
      ["2026-01-01", 10],
      ["2026-04-20", 0],
    ],
    "federal",
  );
  assert.deepEqual(Object.keys(GASOLINE).sort(), y.provinces.map(p => p.code).sort());
  for (const [code, want] of Object.entries(GASOLINE)) {
    const t = need(prov(code).fuelTax);
    near(pairs(t.gasoline), want.provincial, code);
    assert.equal(t.regional?.name, want.regional?.[0], `${code} regional tax`);
    if (want.regional) near(pairs(need(t.regional).gasoline), [["2026-01-01", want.regional[1]]], `${code} regional`);
  }
});

test("Ontario, 10,000 km at 10 L/100 km: fuel tax matches a hand calculation", () => {
  // 1,000 litres × (federal 10¢ for 109 of 365 days + Ontario 9¢) = $29.86 + $90 = $119.86
  const r = compute(y, prov("ON"), single(50_000, { driving: { km: 10_000, lPer100km: 10 } }));
  assert.ok(Math.abs(need(r.fuel).total - ((1000 * 0.1 * 109) / 365 + 90)) < 1e-9);
});

// Canadian Vehicle Survey: Annual 2009 (Statistics Canada 53-223-X), vehicles up to 4.5 tonnes: vehicle-kilometres in
// millions (Table 4-1) and vehicles in scope (Table 3-1). The average per vehicle, to the nearest 100 km, is each
// province's starting distance. Both tables are in docs/verification/2026/sources/statcan-cvs-2009.txt. Statistics
// Canada doesn't print the quotient. NRCan's 2009 summary report did, but its web pages and PDF now return an error, so
// it isn't used.
const CVS_2009: Record<string, [number, number]> = {
  NL: [4_367.6, 290_098],
  PE: [1_229.9, 81_499],
  NS: [9_370.2, 537_694],
  NB: [7_765.2, 481_760],
  QC: [68_133.1, 4_593_169],
  ON: [116_076.7, 7_166_834],
  MB: [10_027.3, 670_133],
  SK: [11_007.3, 717_639],
  AB: [41_672.1, 2_581_262],
  BC: [33_310.1, 2_583_861],
  YT: [353.8, 26_713],
  NT: [236.6, 21_424],
  NU: [26.3, 3_858],
};
const perVehicle = ([km, n]: [number, number]) => (km * 1e6) / n;

test(`${year} starting distances are the 2009 Canadian Vehicle Survey averages per light vehicle`, () => {
  for (const [code, fig] of Object.entries(CVS_2009)) {
    const d = need(prov(code).driving);
    assert.equal(d.distance, Math.round(perVehicle(fig) / 100) * 100, code);
    assert.equal(d.estimated, true, `${code} distance is marked estimated`);
  }
});

test(`${year} starting fuel efficiency is NRCan's 2023 on-road average for gasoline cars and light trucks`, () => {
  // Energy Use Data Handbook, 2023: cars 7.7 and light trucks 10.0 L/100 km on the road (motor gasoline); stock 9,871
  // and 11,506 thousand; average distance 13,261 and 15,180 km. Weighted by distance driven: 9.02, rounded to 9.0.
  const cars = 9_871e3 * 13_261,
    trucks = 11_506e3 * 15_180;
  const d = need(y.federal.driving);
  assert.equal(d.efficiency, Math.round(((cars * 7.7 + trucks * 10.0) / (cars + trucks)) * 10) / 10);
  assert.equal(d.estimated, true);
});
