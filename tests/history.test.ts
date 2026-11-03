import assert from "node:assert/strict";
import test from "node:test";
import { cpiSchema } from "../src/data/cpi.ts";
import { loadCpi, loadYear } from "../src/data/load.ts";
import { historyComparison, scaleHousehold } from "../src/engine/history.ts";
import { blank, compute, type Household } from "../src/engine/index.ts";

const input: Household = {
  people: [{ ...blank(100000), cg: -4000, ed: 2000, ded: 3000, rrsp: 5000, fhsa: 12000 }, blank(20000)],
  active: 0,
  spouse: true,
  adults: 2,
  kids: 2,
  under6: 1,
  useBpa: true,
  useCredits: true,
  whRate: 0.15,
  homeValue: 600000,
  rent: 1500,
  monthlySpending: 2500,
  propertyRates: { ON: 0.01 },
  driving: { km: 12000, lPer100km: 8 },
};

test("annual CPI matches Statistics Canada's published Canada all-items observations", () => {
  // Table18-10-0005-01, vectorv41693271; downloaded CSV is cached in2025/sources/cpi-canada-all-items.txt.
  assert.deepEqual(loadCpi().values, {
    2019: 136,
    2020: 137,
    2021: 141.6,
    2022: 151.2,
    2023: 157.1,
    2024: 160.9,
    2025: 164.2,
  });
  assert.throws(() => cpiSchema.parse({ ...loadCpi(), values: { 2025: 0 } }));
});

test("real-income conversion scales all money including losses and claims, preserving household and driving", () => {
  const before = structuredClone(input);
  const scaled = scaleHousehold(input, 0.5);
  assert.equal(scaled.people[0].ord, 50000);
  assert.equal(scaled.people[0].cg, -2000);
  assert.equal(scaled.people[0].ded, 1500);
  assert.equal(scaled.people[0].rrsp, 2500);
  assert.equal(scaled.people[0].fhsa, 6000);
  assert.equal(scaled.homeValue, 300000);
  assert.equal(scaled.rent, 750);
  assert.equal(scaled.monthlySpending, 1250);
  assert.equal(scaled.kids, 2);
  assert.equal(scaled.under6, 1);
  assert.equal(scaled.whRate, 0.15);
  assert.deepEqual(scaled.propertyRates, input.propertyRates);
  assert.deepEqual(scaled.driving, input.driving);
  assert.deepEqual(input, before);
});

test("history converts tax back to base-year dollars, keeps nominal inputs fixed and omits unpublished CPI", () => {
  const recent = loadYear(2025);
  const older = { ...recent, year: 2019 };
  const current = loadYear(2026);
  const cpi = { ...loadCpi(), values: { 2019: 50, 2025: 100 } };
  const hh = {
    ...input,
    people: [blank(100000)],
    adults: 1,
    kids: 0,
    under6: 0,
    homeValue: 0,
    rent: 0,
    monthlySpending: 0,
  };
  const real = historyComparison([current, recent, older], cpi, hh, ["ON"], "real");
  assert.deepEqual(real.omittedYears, [2026]);
  assert.deepEqual(
    real.rows.map(r => r.year),
    [2019, 2025],
  );
  const on = recent.provinces.find(p => p.code === "ON");
  assert.ok(on);
  const halfIncomeTax = compute(recent, on, { ...hh, people: [blank(50000)] });
  assert.equal(real.rows[0].provinces[0].tax, halfIncomeTax.total * 2);
  assert.equal(real.rows[0].provinces[0].income, 100000);
  assert.equal(real.rows[0].provinces[0].rate, halfIncomeTax.avg);
  const nominal = historyComparison([current, recent, older], cpi, hh, ["ON"], "nominal");
  assert.equal(nominal.rows.length, 3);
  assert.equal(nominal.rows[0].provinces[0].tax, nominal.rows[1].provinces[0].tax);
  assert.equal(real.rows[1].provinces[0].tax, nominal.rows[1].provinces[0].tax);
  assert.notEqual(real.rows[0].provinces[0].tax, nominal.rows[0].provinces[0].tax);
});
