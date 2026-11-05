import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { loadYear } from "../src/data/load.ts";
import type { Province } from "../src/data/schema.ts";
import type { GisCategory } from "../src/engine/gis-allowance.ts";
import { blank, compute, type Household, type Person } from "../src/engine/index.ts";
import {
  reportProvincialAssistance,
  seniorCashSupplementsOf,
  seniorRefundableCreditsOf,
} from "../src/engine/senior-supplements.ts";

const fixture: {
  defaults: Omit<Household, "people">;
  cases: {
    id: string;
    year: number;
    province: string;
    household: Omit<Partial<Household>, "people"> & { people: Partial<Person>[] };
    cash?: number[];
    reported?: number[];
    expectedCredits?: Record<string, number>;
  }[];
  monthlyCases: {
    id: string;
    year: number;
    quarter: number;
    category: GisCategory;
    age: number;
    income: number;
    upper: number;
    expected: number;
  }[];
} = JSON.parse(fs.readFileSync(new URL("./golden/features/senior-supplements.json", import.meta.url), "utf8"));
const years = [loadYear(2025), loadYear(2026)];
const near = (actual: number, expected: number, message = "") =>
  assert.ok(Math.abs(actual - expected) < 1e-8, `${message}: ${actual} != ${expected}`);
for (const c of fixture.cases) {
  test(`senior supplement golden: ${c.id}`, () => {
    const y = years.find(y => y.year === c.year);
    assert.ok(y);
    const p = y.provinces.find(p => p.code === c.province);
    assert.ok(p);
    const hh: Household = {
      ...fixture.defaults,
      ...c.household,
      people: c.household.people.map(x => ({ ...blank(0), ...x })),
    };
    const result = compute(y, p, hh);
    if (c.cash) {
      const payment = result.breakdown.provincialSupplements;
      for (const [i, expected] of c.cash.entries()) {
        near(payment?.payments.reduce((s, x) => s + x.recipients[i], 0) ?? 0, expected, `recipient ${i}`);
        near(payment?.reported[i] ?? 0, c.reported?.[i] ?? 0, `reporter ${i}`);
      }
      near(
        payment?.total ?? 0,
        c.cash.reduce((a, b) => a + b, 0),
        "cash total",
      );
    }
    for (const [name, expected] of Object.entries(c.expectedCredits ?? {}))
      near(result.credits.find(([label]) => name === label)?.[1] ?? 0, expected, name);
    const baseline = compute(y, { ...p, seniorSupplements: undefined }, hh);
    assert.deepEqual(
      result.breakdown.gisAllowance,
      baseline.breakdown.gisAllowance,
      "provincial payments never alter GIS",
    );
    near(result.cash, baseline.cash, "cash transfers must not be added to gross receipts as well as benefits");
    if (result.breakdown.provincialSupplements && !hh.childcare)
      result.list.forEach((person, i) => {
        near(person.ti, baseline.list[i].ti, "line 25000 removes line 14500 from taxable income");
        near(
          person.breakdown.publicPensions?.recoveryTax ?? 0,
          baseline.list[i].breakdown.publicPensions?.recoveryTax ?? 0,
          "OAS recovery excludes provincial assistance",
        );
      });
  });
}

for (const c of fixture.monthlyCases)
  test(`Ontario published monthly boundary: ${c.id}`, () => {
    const y = years.find(y => y.year === c.year);
    assert.ok(y);
    const p = y.provinces.find(p => p.code === "ON");
    assert.ok(p);
    const people = [{ ...blank(0), age: c.age, birthMonth: 6, oas: true, gis: true }];
    if (c.category !== "single") people.push({ ...blank(0), age: 70, birthMonth: 6, oas: true, gis: true });
    const hh = { ...fixture.defaults, adults: people.length, spouse: people.length === 2, people };
    const template = compute(y, p, hh).breakdown.gisAllowance;
    assert.ok(template);
    for (const income of [c.income, c.upper]) {
      const gis = structuredClone(template);
      gis.adults.forEach(adult => {
        adult.monthly.forEach(row => {
          row.category = null;
          row.gis = 0;
          row.allowance = 0;
        });
      });
      gis.adults[0].monthly[c.quarter * 3] = { category: c.category, income, gis: 1, allowance: 0, protection: 0 };
      const cash = seniorCashSupplementsOf(
        y.federal,
        p,
        people,
        people.length === 2,
        people.map(() => 0),
        gis,
      );
      near(cash.payments[0].recipients[0], c.expected, `${c.id} at ${income}`);
    }
  });

test("territorial payments follow positive GIS/Allowance, including the last published cent before zero", () => {
  for (const y of years)
    for (const [code, monthly] of [
      ["NT", 196],
      ["NU", 300],
    ] as const) {
      const p = y.provinces.find(p => p.code === code);
      assert.ok(p);
      const person = { ...blank(0), age: 70, birthMonth: 6, oas: true, gis: true };
      const gis = compute(y, p, { ...fixture.defaults, people: [person] }).breakdown.gisAllowance;
      assert.ok(gis);
      gis.adults[0].monthly.forEach(row => {
        row.gis = 0;
        row.allowance = 0;
      });
      for (const [benefit, expected] of [
        [y.year === 2025 ? 0.52 : 1, monthly],
        [0, 0],
      ]) {
        gis.adults[0].monthly[0].gis = benefit;
        const result = seniorCashSupplementsOf(y.federal, p, [person], false, [0], gis);
        near(result.total, expected);
        gis.adults[0].monthly[0].gis = 0;
        gis.adults[0].monthly[0].allowance = benefit;
        near(seniorCashSupplementsOf(y.federal, p, [person], false, [0], gis).total, expected);
        gis.adults[0].monthly[0].allowance = 0;
      }
    }
});

test("supplement goldens cover every supported program in both years; historical data stays absent", () => {
  assert.equal(new Set(fixture.cases.map(c => c.id)).size, fixture.cases.length);
  for (const year of years) {
    assert.deepEqual(
      new Set(fixture.cases.filter(c => c.year === year.year).map(c => c.province)),
      new Set(year.provinces.map(p => p.code)),
    );
    for (const p of year.provinces)
      for (const rule of p.seniorSupplements ?? [])
        assert.ok(
          fixture.cases.some(c => c.year === year.year && c.province === p.code),
          rule.program,
        );
  }
  for (const year of [2019, 2020, 2021, 2022, 2023, 2024])
    for (const p of loadYear(year).provinces) assert.equal(p.seniorSupplements, undefined);
});

test("T5007 reporter reverses childcare/recovery; ties keep recipients and reporting never changes cash", () => {
  const payments = [{ program: "test", name: "test", recipients: [600, 400], reportable: [600, 0], estimated: false }];
  assert.deepEqual(reportProvincialAssistance(payments, [100, 100], true), [600, 0]);
  assert.deepEqual(reportProvincialAssistance(payments, [100, 101], true), [0, 600]);
  assert.deepEqual(reportProvincialAssistance(payments, [100, 101], false), [600, 0]);
  assert.deepEqual(payments[0].recipients, [600, 400]);
});

test("BC's verified $500 income exception is separate from cash and applies before spouse attribution", () => {
  const y = years[0];
  const published = y.provinces.find(p => p.code === "BC");
  assert.ok(published);
  for (const [cash, reportable] of [
    [500, 0],
    [500.01, 500.01],
  ]) {
    const p: Province = structuredClone(published);
    const rule = p.seniorSupplements?.find(rule => rule.program === "bc-senior-supplement");
    assert.ok(rule && rule.program === "bc-senior-supplement");
    rule.params.single = cash / 12; // isolate the published reporting boundary with a synthetic payment series
    const person = { ...blank(0), age: 70, birthMonth: 6, oas: true, gis: true };
    const result = compute(y, p, { ...fixture.defaults, people: [person] });
    near(result.breakdown.provincialSupplements?.total ?? 0, cash);
    near(result.breakdown.provincialSupplements?.reported[0] ?? 0, reportable);
  }
});

test("NS statutory refund has a discontinuous $50 minimum and a $10,000 automatic cap", () => {
  for (const y of years) {
    const p = y.provinces.find(p => p.code === "NS");
    assert.ok(p);
    const person = { ...blank(0), age: 70, birthMonth: 6, oas: true, gis: true };
    const hh = { ...fixture.defaults, people: [person], useCredits: true };
    const gis = compute(y, p, hh).breakdown.gisAllowance;
    assert.ok(gis);
    for (const [liability, expected] of [
      [0, 0],
      [0.01, 50],
      [49.99, 50],
      [50, 50],
      [500, 500],
      [10000, 10000],
      [10000.01, 10000],
    ]) {
      const credits = seniorRefundableCreditsOf(p, hh, [person], false, [20000], 20000, [liability], gis, false);
      near(credits.find(([name]) => name === "Nova Scotia GIS tax refund")?.[1] ?? 0, expected);
    }
  }
});
