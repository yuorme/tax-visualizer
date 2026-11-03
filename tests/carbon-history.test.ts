import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { loadYear } from "../src/data/load.ts";
import { carbonCostsOf, carbonRebatesOf } from "../src/engine/index.ts";

const fixture = JSON.parse(fs.readFileSync(new URL("./golden/features/carbon-history.json", import.meta.url), "utf8"));
const province = (year: number, code: string) => {
  const p = loadYear(year).provinces.find(p => p.code === code);
  assert.ok(p, `${year} ${code}`);
  return p;
};
const near = (actual: number, expected: number, id: string) =>
  assert.ok(Math.abs(actual - expected) < 1e-8, `${id}: ${actual} vs ${expected}`);

for (const [year, values] of Object.entries(fixture.familyFour)) {
  test(`carbon history ${year}: published cash payments for a couple and two children`, () => {
    for (const [code, expected] of Object.entries(values as Record<string, number>)) {
      const credits = carbonRebatesOf(province(+year, code), 0, true, 2);
      near(
        credits.reduce((sum, [, amount]) => sum + amount, 0),
        expected,
        `${year} ${code}`,
      );
    }
  });
}

test("carbon history 2025: BC payment-specific phaseout and single-parent substitution", () => {
  for (const { couple, kids, income, expected } of fixture.bc2025IncomeTests) {
    const credits = carbonRebatesOf(province(2025, "BC"), income, couple, kids);
    near(
      credits.reduce((sum, [, amount]) => sum + amount, 0),
      expected,
      `${couple}/${kids}/${income}`,
    );
  }
});

test("carbon history: sourced regional payment cutoffs, calendar timing and PE's isolated increment", () => {
  for (const { year, code, couple, kids, income, expected } of fixture.regionalPayments) {
    const credits = carbonRebatesOf(province(year, code), income, couple, kids);
    near(
      credits.reduce((sum, [, amount]) => sum + amount, 0),
      expected,
      `${year}/${code}/${couple}/${kids}/${income}`,
    );
  }
});

test("carbon history: provincial transitions and territorial heating offsets use their own dates", () => {
  for (const { year, code, gasoline, heating } of fixture.historicalCosts) {
    const cost = carbonCostsOf(year, province(year, code), { km: 10000, lPer100km: 10 });
    assert.ok(cost);
    near(cost.gasoline, gasoline, `${year}/${code} gasoline`);
    assert.equal(cost.heating, heating, `${year}/${code} heating`);
  }
});

test("carbon history 2025: gasoline ends April 1 while heating follows applicable exemptions", () => {
  for (const [code, expected] of Object.entries(
    fixture.costs2025 as Record<string, { gasoline: number; heating: number }>,
  )) {
    const p = province(2025, code);
    const cost = carbonCostsOf(2025, p, { km: 10000, lPer100km: 10 });
    assert.ok(cost);
    near(cost.gasoline, expected.gasoline, `${code} gasoline`);
    assert.equal(cost.heating, expected.heating, `${code} heating`);
    assert.equal(carbonCostsOf(2025, p, { km: 0, lPer100km: 10 })?.total, expected.heating);
    assert.equal(carbonCostsOf(2025, p, { km: 10000, lPer100km: 0 })?.total, expected.heating);
  }
});

test("carbon history: Quebec has no modeled direct charge and 2026 has no consumer carbon program", () => {
  for (let year = 2019; year <= 2025; year++) {
    assert.equal(carbonCostsOf(year, province(year, "QC"), { km: 10000, lPer100km: 10 }), null);
    assert.deepEqual(carbonRebatesOf(province(year, "QC"), 0, true, 2), []);
  }
  for (const p of loadYear(2026).provinces) {
    assert.equal(carbonCostsOf(2026, p, { km: 10000, lPer100km: 10 }), null);
    assert.deepEqual(carbonRebatesOf(p, 0, true, 2), []);
  }
});
