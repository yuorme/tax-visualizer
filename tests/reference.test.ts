// Reference tests: results checked against figures published outside this project. Unlike the golden test, these
// don't come from our own code, so they catch errors the golden fixtures would have locked in.
import assert from "node:assert/strict";
import test from "node:test";
import { loadYear } from "../src/data/load.ts";
import { blank, compute, type Household } from "../src/engine/index.ts";

const y = loadYear(2026);
const prov = (c: string) => y.provinces.find(p => p.code === c)!;
const single = (ord: number, extra: Partial<Household> = {}): Household => ({
  people: [blank(ord)], active: 0, spouse: true, adults: 1, kids: 0, under6: 0, useBpa: true, whRate: 0.15,
  useCredits: true, homeValue: 0, rent: 0, monthlySpending: 0, ...extra,
});
const pct = (v: number) => Math.round(v * 10000) / 100;

// Top combined (federal + provincial) marginal rates on ordinary income for 2026, as published in the
// provincial rate tables (e.g. TaxTips.ca, EY tax calculators). Quebec includes the 16.5% abatement.
// The NWT and Nunavut figures add their 2% payroll tax on employment income, which the calculator counts
// and the published income tax tables don't (47.05% and 44.5% before it).
const TOP_ORDINARY: Record<string, number> = {
  BC: 53.5, YT: 48, AB: 48, NT: 49.05, SK: 47.5, MB: 50.4, NU: 46.5, ON: 53.53, QC: 53.31, NB: 52.5, PE: 53, NS: 54, NL: 54.8,
};

test("2026 top marginal rates on ordinary income match published tables", () => {
  for (const [c, expected] of Object.entries(TOP_ORDINARY))
    assert.equal(pct(compute(y, prov(c), single(2_000_000)).margBy.ord), expected, c);
});

test("2026 Ontario top marginal rates on dividends match published tables", () => {
  const r = compute(y, prov("ON"), single(2_000_000));
  assert.equal(pct(r.margBy.ed), 39.34);
  assert.equal(pct(r.margBy.nd), 47.74);
});

test("Ontario single renter at $25,000: refundable credits match a hand calculation", () => {
  // CGEB 445 + min(234, 2% × (25,000 − 11,564)) = 679; CWB max 1,665 (phase-out starts above $27,392);
  // OSTC 378; OEPTC: rent 14,400 × 20% = 2,880 → energy 290 + property min(2,880, 288 + 73) = 651
  const r = compute(y, prov("ON"), single(25_000, { rent: 1200 }));
  assert.deepEqual(r.credits.map(([n, v]) => [n, Math.round(v)]), [
    ["Canada Groceries and Essentials Benefit", 679], ["Canada Workers Benefit", 1665],
    ["Ontario sales tax credit", 378], ["Ontario energy and property tax credit", 651],
  ]);
});
