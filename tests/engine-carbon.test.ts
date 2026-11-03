import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { loadYear } from "../src/data/load.ts";
import { provinceSchema, yearSchema } from "../src/data/schema.ts";
import { blank, carbonCostsOf, carbonRebatesOf, compute, type Household } from "../src/engine/index.ts";

const fixture = JSON.parse(fs.readFileSync(new URL("./golden/features/carbon.json", import.meta.url), "utf8"));
const data = loadYear(2025);
// Keep this prerequisite's original no-carbon baseline independent of the subsequently activated year data.
delete data.federal.driving;
for (const p of data.provinces) {
  delete p.carbon;
  delete p.driving;
}
const base = data.provinces.find(p => p.code === "AB");
assert.ok(base);
const province = provinceSchema.parse({
  ...base,
  carbon: {
    name: "Carbon pricing",
    gasoline: [
      { from: "2025-01-01", rate: 0.1761 },
      { from: "2025-04-01", rate: 0 },
    ],
    heating: { amount: 100, estimated: true, method: "Synthetic heating amount for isolated integration verification" },
    rebates: [
      {
        program: "carbon-rebate-payments",
        name: "Canada Carbon Rebate",
        params: {
          payments: [
            {
              date: "2025-01-15",
              adult: 225,
              spouse: 112.5,
              child: 56.25,
              firstChild: 112.5,
              threshold: [0, 0],
              rate: 0,
            },
            { date: "2025-04-22", adult: 228, spouse: 114, child: 57, firstChild: 114, threshold: [0, 0], rate: 0 },
          ],
        },
      },
    ],
  },
});
const round = (value: number) => Math.round(value * 1e10) / 1e10;

test("carbon golden: 2025 gasoline stops April 1, with unchanged independent heating estimate", () => {
  const result = carbonCostsOf(2025, province, { km: 10000, lPer100km: 10 });
  assert.ok(result);
  for (const [key, expected] of Object.entries(fixture.gasoline2025))
    assert.equal(round(result[key as keyof typeof result]), expected, key);
  assert.equal(carbonCostsOf(2025, province)?.total, 100);
  assert.equal(carbonCostsOf(2025, province, { km: 10000, lPer100km: 0 })?.gasoline, 0);
  assert.equal(carbonCostsOf(2025, base), null);
});

test("carbon golden: January and final April payments include single-parent substitution and ignore income", () => {
  for (const [id, couple, kids] of [
    ["single", false, 0],
    ["couple", true, 0],
    ["coupleTwoChildren", true, 2],
    ["parentTwoChildren", false, 2],
  ] as const) {
    for (const income of [0, 500000])
      assert.equal(carbonRebatesOf(province, income, couple, kids)[0][1], fixture.rebates2025[id]);
  }
  assert.deepEqual(carbonRebatesOf(base, 0, false, 0), []);
});

test("carbon golden: each income-tested payment floors independently before being summed", () => {
  const p = structuredClone(province);
  assert.ok(p.carbon);
  p.carbon.rebates[0].params.payments = [
    { date: "2025-01-01", adult: 100, spouse: 0, child: 0, firstChild: 0, threshold: [10000, 10000], rate: 0.01 },
    { date: "2025-04-01", adult: 120, spouse: 0, child: 0, firstChild: 0, threshold: [20000, 20000], rate: 0.02 },
  ];
  assert.equal(carbonRebatesOf(p, 15000, false, 0)[0][1], fixture.independentIncomeTests.income15000);
  assert.equal(carbonRebatesOf(p, 30000, false, 0)[0][1], fixture.independentIncomeTests.income30000);
  for (const income of [10000, 20000, 22000, 26000])
    assert.equal(carbonRebatesOf(p, income, false, 0)[0][1], fixture.independentIncomeTests[`income${income}`]);
});

test("carbon golden: couples and single parents use the family income threshold", () => {
  const p = structuredClone(province);
  assert.ok(p.carbon);
  p.carbon.rebates[0].params.payments = [
    { date: "2025-01-01", adult: 100, spouse: 50, child: 25, firstChild: 50, threshold: [10000, 20000], rate: 0.01 },
  ];
  for (const [id, couple, kids] of [
    ["single", false, 0],
    ["couple", true, 0],
    ["parentOneChild", false, 1],
    ["parentTwoChildren", false, 2],
  ] as const)
    assert.equal(carbonRebatesOf(p, 15000, couple, kids)[0][1], fixture.familyThresholds[id]);
});

test("carbon golden: costs enter gross tax, rebates enter benefits once and follow the credits switch", () => {
  const hh: Household = {
    people: [blank(100000), blank(50000)],
    active: 0,
    spouse: true,
    adults: 2,
    kids: 2,
    under6: 0,
    useBpa: true,
    useCredits: true,
    whRate: 0,
    homeValue: 0,
    rent: 0,
    monthlySpending: 0,
    driving: { km: 10000, lPer100km: 10 },
  };
  const before = compute(data, base, hh),
    after = compute(data, province, hh);
  assert.equal(round(after.total - before.total), fixture.netTaxDelta);
  assert.equal(after.benefits - before.benefits, 906);
  assert.equal(round(after.gross - before.gross), fixture.gasoline2025.total);
  assert.equal(after.incomeTax, before.incomeTax);
  assert.equal(after.payroll, before.payroll);
  assert.equal(after.marg, before.marg);
  assert.equal(after.breakdown.left, after.cash - after.total);
  const noCredits = compute(data, province, { ...hh, useCredits: false });
  const noCreditsBase = compute(data, base, { ...hh, useCredits: false });
  assert.equal(round(noCredits.total - noCreditsBase.total), fixture.gasoline2025.total);
});

test("carbon schema: all driving defaults and payment/rate dates must match the year", () => {
  const y = structuredClone(data);
  y.provinces = y.provinces.map(p => (p.code === "AB" ? province : p));
  assert.ok(!yearSchema.safeParse(y).success);
  y.federal.driving = loadYear(2026).federal.driving;
  for (const p of y.provinces) p.driving = { distance: 10000 };
  assert.ok(yearSchema.safeParse(y).success);
  const wrong = structuredClone(y);
  const ab = wrong.provinces.find(p => p.code === "AB");
  assert.ok(ab?.carbon);
  ab.carbon.rebates[0].params.payments[0].date = "2024-01-15";
  assert.ok(!yearSchema.safeParse(wrong).success);
  ab.carbon.rebates[0].params.payments[0].date = "2025-01-15";
  ab.carbon.gasoline = [
    { from: "2025-02-01", rate: 0.1 },
    { from: "2025-04-01", rate: 0 },
  ];
  assert.ok(!yearSchema.safeParse(wrong).success);
});
