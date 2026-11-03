import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { loadYear } from "../src/data/load.ts";
import { provinceSchema, yearSchema } from "../src/data/schema.ts";
import { blank, carbonRebatesOf, compute, type Household } from "../src/engine/index.ts";

type Case = [string, number, boolean, number, number];
const fixture: {
  alberta: Case[];
  pei: Case[];
  nwt2020: Case[];
  nwt2021: Case[];
  consolidationBoundary: [number, number][];
  integration: Case[];
} = JSON.parse(fs.readFileSync(new URL("./golden/regional-carbon.json", import.meta.url), "utf8"));
const y = loadYear(2025);
const base = y.provinces.find(p => p.code === "AB");
assert.ok(base);
const province = (program: string, payments: object[]) =>
  provinceSchema.parse({
    ...base,
    carbon: {
      name: "Regional carbon",
      gasoline: 0,
      heating: { amount: 0, estimated: true, method: "Isolated rebate test" },
      rebates: [{ program, name: "Regional rebate", params: { payments } }],
    },
  });
const annualAb = {
  adult: 300,
  spouse: 150,
  child: 45,
  firstChild: 150,
  childCap: 4,
  threshold: [47500, 95000],
  rate: [0.0267, 0.04],
  minAnnual: 100,
  weight: 0.25,
};
const regular = {
  individual: 110,
  spouseOrDependant: 55,
  supplementRate: 0.005,
  supplementFrom: 30000,
  supplementMax: 55,
  threshold: 50000,
  rate: 0.02,
};
const ntPayment = (date: string, adult: number, child: number, multiplier: number) => ({
  date,
  adult,
  spouse: adult,
  child,
  firstChild: child,
  threshold: [0, 0],
  rate: 0,
  smallPayment: { below: 50, multiplier },
});
const provinces = {
  alberta: province("alberta-carbon-rebate-payments", [
    { date: "2019-01", ...annualAb },
    { date: "2019-04", ...annualAb },
  ]),
  pei: province("pei-carbon-rebate-increment", [
    { date: "2022-07-05", weight: 0.25, regular, enhanced: { ...regular, individual: 670, rate: 0.04 } },
  ]),
  nwt2020: province("carbon-rebate-consolidated-payments", [
    ntPayment("2020-04-30", 52, 60, 1),
    ntPayment("2020-07", 39, 45, 4),
    ntPayment("2020-10", 39, 45, 0),
  ]),
  nwt2021: province("carbon-rebate-consolidated-payments", [
    ntPayment("2021-01", 39, 45, 0),
    ntPayment("2021-04", 39, 45, 0),
    ntPayment("2021-07", 52, 60, 1),
    ntPayment("2021-10", 52, 60, 1),
  ]),
};
const close = (actual: number, expected: number) =>
  assert.ok(Math.abs(actual - expected) < 1e-8, `${actual} != ${expected}`);
for (const key of ["alberta", "pei", "nwt2020", "nwt2021"] as const)
  for (const [id, income, couple, kids, expected] of fixture[key])
    test(`regional carbon golden: ${key} ${id}`, () =>
      close(carbonRebatesOf(provinces[key], income, couple, kids)[0][1], expected));
for (const [amount, expected] of fixture.consolidationBoundary)
  test(`regional carbon golden: consolidation boundary ${amount}`, () => {
    const p = province("carbon-rebate-consolidated-payments", [ntPayment("2020-07", amount, 0, 4)]);
    close(carbonRebatesOf(p, 0, false, 0)[0][1], expected);
  });
for (const [key, income, couple, kids, expected] of fixture.integration)
  test(`regional carbon golden: integrated ${key}`, () => {
    assert.ok(key in provinces);
    const p = provinces[key as keyof typeof provinces];
    const hh: Household = {
      people: [{ ...blank(0), fd: income }, ...(couple ? [blank(0)] : [])],
      active: 0,
      adults: couple ? 2 : 1,
      spouse: couple,
      kids,
      under6: 0,
      useBpa: true,
      useCredits: true,
      whRate: 0,
      homeValue: 0,
      rent: 0,
      monthlySpending: 0,
    };
    const actual = compute(y, p, hh),
      without = compute(y, { ...p, carbon: undefined }, hh);
    close(actual.netTotal - without.netTotal, expected);
    close(actual.total - without.total, expected);
    close(actual.gross, without.gross);
    close(actual.refund - without.refund, -expected);
    close(
      compute(y, p, { ...hh, useCredits: false }).netTotal,
      compute(y, { ...p, carbon: undefined }, { ...hh, useCredits: false }).netTotal,
    );
  });
test("regional carbon schema retains exact dates and validates month-only dates within the data year", () => {
  const valid = structuredClone(y);
  valid.federal.driving = { efficiency: 10, efficiencySource: "Synthetic", distanceSource: "Synthetic" };
  valid.provinces = valid.provinces.map(p => ({ ...p, driving: { distance: 0 } }));
  valid.provinces[0] = {
    ...provinces.alberta,
    code: valid.provinces[0].code,
    order: valid.provinces[0].order,
    driving: { distance: 0 },
  };
  assert.ok(valid.provinces[0].carbon);
  const rebate = valid.provinces[0].carbon.rebates[0];
  assert.equal(rebate.program, "alberta-carbon-rebate-payments");
  for (const payment of rebate.params.payments) payment.date = "2025-01";
  assert.equal(yearSchema.safeParse(valid).success, true);
  rebate.params.payments[0].date = "2024-12";
  const outside = yearSchema.safeParse(valid);
  assert.equal(outside.success, false);
  assert.ok(!outside.success && outside.error.issues.some(i => i.message.includes("payment dates")));
  rebate.params.payments[0].date = "2025-13";
  assert.equal(yearSchema.safeParse(valid).success, false);
  assert.throws(() => province("alberta-carbon-rebate-payments", [{ date: "2019-01", ...annualAb, childCap: -1 }]));
  assert.throws(() => province("alberta-carbon-rebate-payments", [{ date: "2019-01", ...annualAb, weight: 2 }]));
  assert.throws(() =>
    province("carbon-rebate-payments", [
      { date: "2025-01", adult: 1, spouse: 0, child: 0, firstChild: 0, threshold: [0, 0], rate: 0 },
    ]),
  );
});
