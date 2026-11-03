import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { loadYear } from "../src/data/load.ts";
import { scaleHousehold } from "../src/engine/history.ts";
import { blank, compute, type Household } from "../src/engine/index.ts";

const y = loadYear(2026);
const household = (): Household => ({
  people: [{ ...blank(0), oth: 100000 }],
  active: 0,
  spouse: true,
  adults: 1,
  kids: 0,
  under6: 0,
  useBpa: true,
  useCredits: true,
  whRate: 0,
  homeValue: 500000,
  rent: 0,
  monthlySpending: 0,
});
const province = (code: string) => {
  const p = y.provinces.find(p => p.code === code);
  assert.ok(p);
  return p;
};
const fixture: {
  cases: {
    id: string;
    province: string;
    bills: Record<string, number>;
    rates?: Record<string, number>;
    homeValue?: number;
    income?: number;
    property: number;
    credit?: number;
  }[];
} = JSON.parse(fs.readFileSync(new URL("./golden/features/property-tax-bill.json", import.meta.url), "utf8"));

// Hand-calculated expected values; see docs/verification/11-property-tax-bill.md. No capture path.
for (const c of fixture.cases)
  test(`property bill golden: ${c.id}`, () => {
    const hh = household();
    hh.propertyTaxBills = c.bills;
    hh.propertyRates = c.rates;
    hh.homeValue = c.homeValue ?? hh.homeValue;
    hh.people[0].oth = c.income ?? hh.people[0].oth;
    const p = province(c.province);
    const result = compute(y, p, hh);
    assert.equal(result.property, c.property);
    if (c.credit !== undefined) {
      const name = p.credits?.find(
        c => c.program === "mb-affordability-credits" || c.program === "ontario-energy-property-tax-credit",
      )?.name;
      assert.ok(name);
      assert.equal(result.credits.find(([n]) => n === name)?.[1] ?? 0, c.credit);
    }
    const estimated = compute(y, p, { ...hh, propertyTaxBills: undefined });
    const delta = c.property - estimated.property;
    assert.ok(Math.abs(result.gross - estimated.gross - delta) < 1e-8);
    assert.ok(Math.abs(result.total - estimated.total - delta + result.refund - estimated.refund) < 1e-8);
  });

test("invalid bills fall back to the existing estimate without altering rate overrides", () => {
  for (const bill of [-1, Infinity, NaN]) {
    const hh = { ...household(), propertyTaxBills: { ON: bill }, propertyRates: { ON: 0.01 } };
    assert.equal(compute(y, province("ON"), hh).property, 5000);
  }
});

test("an omitted bill preserves every result; a foreign province's bill is inert", () => {
  for (const p of y.provinces) {
    const hh = household();
    assert.deepEqual(compute(y, p, { ...hh, propertyTaxBills: {} }), compute(y, p, hh));
    if (p.code !== "ON") assert.deepEqual(compute(y, p, { ...hh, propertyTaxBills: { ON: 4200 } }), compute(y, p, hh));
  }
});

test("real-dollar history scales the actual annual bill, preserving zero, omission and input", () => {
  const hh = { ...household(), propertyTaxBills: { ON: 4200, MB: 0 } };
  const scaled = scaleHousehold(hh, 0.8);
  assert.deepEqual(scaled.propertyTaxBills, { ON: 3360, MB: 0 });
  assert.deepEqual(hh.propertyTaxBills, { ON: 4200, MB: 0 });
  assert.equal(scaleHousehold(household(), 0.8).propertyTaxBills, undefined);
  assert.equal(compute(y, province("ON"), scaled).property, 3360);
  assert.equal(compute(y, province("MB"), scaled).property, 0);
});
