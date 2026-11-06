import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { loadYear } from "../src/data/load.ts";
import type { GisCategory } from "../src/engine/gis-allowance.ts";
import {
  blank,
  compute,
  gisIncomeOf,
  gisMonthly,
  type Household,
  household,
  type Person,
  UnsupportedGisAllowanceError,
} from "../src/engine/index.ts";

const published: {
  year: number;
  quarter: number;
  category: GisCategory;
  income: number;
  gis: number;
  allowance: number;
}[] = JSON.parse(fs.readFileSync(new URL("./golden/features/gis-published.json", import.meta.url), "utf8"));
const years = [loadYear(2025), loadYear(2026)];
const fixture: {
  defaults: Omit<Household, "people">;
  cases: {
    id: string;
    year: number;
    province: string;
    household: Omit<Partial<Household>, "people"> & { people: Partial<Person>[] };
    expected: Record<string, number>;
    expectedCredits?: Record<string, number>;
  }[];
} = JSON.parse(fs.readFileSync(new URL("./golden/features/gis-allowance.json", import.meta.url), "utf8"));
const input = (people: Partial<Person>[], extra: Partial<Household> = {}): Household => ({
  ...fixture.defaults,
  adults: people.length,
  spouse: people.length === 2,
  ...extra,
  people: people.map(x => ({ ...blank(0), ...x })),
});
const near = (a: number, b: number) => assert.ok(Math.abs(a - b) < 1e-8, `${a} != ${b}`);
const senior = { age: 70, birthMonth: 6, oas: true, gis: true };
const younger = { age: 62, birthMonth: 6, allowance: true };
for (const c of fixture.cases)
  test(`GIS/Allowance golden: ${c.id}`, () => {
    const y = years.find(y => y.year === c.year);
    assert.ok(y);
    const p = y.provinces.find(p => p.code === c.province);
    assert.ok(p);
    const result = compute(y, p, input(c.household.people, c.household as Partial<Household>));
    for (const [path, expected] of Object.entries(c.expected)) {
      let value: unknown = result;
      for (const key of path.split(".")) {
        assert.ok(value && typeof value === "object" && key in value, path);
        value = (value as Record<string, unknown>)[key];
      }
      assert.equal(typeof value, "number");
      assert.equal(Math.round((value as number) * 1e4) / 1e4, expected, path);
    }
    for (const [name, expected] of Object.entries(c.expectedCredits ?? {})) {
      const actual = result.credits.find(([label]) => label === name)?.[1] ?? 0;
      assert.equal(Math.round(actual * 1e4) / 1e4, expected, name);
    }
  });

test("GIS goldens have unique names and cover all jurisdictions in both years", () => {
  assert.equal(new Set(fixture.cases.map(c => c.id)).size, fixture.cases.length);
  for (const y of years)
    assert.deepEqual(
      new Set(fixture.cases.filter(c => c.year === y.year).map(c => c.province)),
      new Set(y.provinces.map(p => p.code)),
    );
});

test("GIS/Allowance validate explicit opt-ins, dates and unsupported years", () => {
  const y = years[0];
  const run = (x: Partial<Person>) => household(y, y.provinces[0], input([x]));
  for (const x of [
    { gis: true },
    { allowance: true },
    { ...senior, birthMonth: 0 },
    { ...senior, age: 65.5 },
    { gis: 1 },
  ])
    assert.throws(() => run(x as Person), RangeError);
  const old = loadYear(2024);
  for (const x of [{ gis: false }, { allowance: false }, { gis: true }])
    assert.throws(() => household(old, old.provinces[0], input([x])), UnsupportedGisAllowanceError);
});

for (const y of years) {
  test(`${y.year}: GIS/Allowance matches published nonmaximum rows and income-band boundaries in all quarters`, () => {
    for (const c of published.filter(c => c.year === y.year)) {
      const r = gisMonthly(y.federal, c.quarter, c.income, c.category);
      assert.equal(r.gis, c.gis, JSON.stringify(c));
      assert.equal(r.allowance, c.allowance, JSON.stringify(c));
    }
  });
  test(`${y.year}: omission and explicit false preserve legacy calculations`, () => {
    for (const p of y.provinces) {
      const base = input([{ age: 70, birthMonth: 6, oas: true, oth: 12000 }]);
      const off = input([{ ...base.people[0], gis: false, allowance: false }]);
      const a = compute(y, p, base),
        b = compute(y, p, off);
      near(a.total, b.total);
      near(a.famNet, b.famNet);
      assert.deepEqual(a.margBy, b.margBy);
      assert.equal(b.breakdown.gisAllowance, undefined);
    }
  });
  test(`${y.year}: Allowance requires a spouse and GIS; adult order does not change the result`, () => {
    for (const p of y.provinces) {
      const a = household(y, p, input([senior, younger]));
      const b = household(y, p, input([younger, senior]));
      near(a.netTotal, b.netTotal);
      assert.deepEqual(a.breakdown.gisAllowance?.adults, b.breakdown.gisAllowance?.adults.toReversed());
      const unrelated = household(y, p, input([senior, younger], { spouse: false }));
      near(unrelated.breakdown.gisAllowance?.adults[1].allowance ?? -1, 0);
    }
  });
  test(`${y.year}: GIS and Allowance affect net income and benefits, but not taxable income or working income`, () => {
    for (const p of y.provinces) {
      const h = input([{ ...senior, ord: 18000 }, younger], { useCredits: true, kids: 1, under6: 1 });
      const a = compute(y, p, h);
      const base = compute(y, p, { ...h, people: h.people.map(x => ({ ...x, gis: false, allowance: false })) });
      const benefit = a.breakdown.gisAllowance?.total ?? 0;
      assert.ok(benefit > 0);
      const reportable = a.breakdown.provincialSupplements?.reported.reduce((a, b) => a + b, 0) ?? 0;
      const baselineReportable = base.breakdown.provincialSupplements?.reported.reduce((a, b) => a + b, 0) ?? 0;
      near(a.famNet - base.famNet, benefit + reportable - baselineReportable);
      near(a.cash, base.cash); // netted against tax; cash does not add the same transfer twice
      a.list.forEach((r, i) => {
        near(r.ti, base.list[i].ti);
        near(r.tiP, base.list[i].tiP);
        assert.deepEqual(r.pay, base.list[i].pay);
        near(r.breakdown.seniorCredits.eligibleFederal, base.list[i].breakdown.seniorCredits.eligibleFederal);
        near(r.breakdown.healthServicesFund.contribution, base.list[i].breakdown.healthServicesFund.contribution);
      });
      // Published one-child-under-six CCB formula, within the first reduction band in these households.
      const maximum = y.year === 2025 ? 7997 : 8157;
      const threshold = y.year === 2025 ? 37487 : 38237;
      assert.ok(a.famNet > threshold && a.famNet < (y.year === 2025 ? 81222 : 82847));
      near(a.ccb, maximum - 0.07 * (a.famNet - threshold));
      near(base.ccb, maximum);
      assert.ok(a.ccb < base.ccb);
      near(a.breakdown.left, a.cash - a.total);
      const noCredits = compute(y, p, { ...h, useCredits: false });
      near(noCredits.breakdown.gisAllowance?.total ?? -1, benefit);
    }
  });
  test(`${y.year}: wages and self-employment share one exemption per adult after full pension contributions`, () => {
    const p = y.provinces.find(p => p.code === "ON");
    assert.ok(p);
    // Age 62, business-only: both CPP base shares plus enhancements come off before the exemption.
    const r = gisIncomeOf(y.federal, p, { ...blank(0), age: 62, birthMonth: 6, selfEmployment: 20000 });
    const pension = (20000 - 3500) * 0.119;
    near(r.working, 20000 - pension);
    near(r.earningsExemption, 10000);
    near(r.income, 20000 - pension - 10000);
    const qc = y.provinces.find(p => p.code === "QC");
    assert.ok(qc);
    const q = gisIncomeOf(y.federal, qc, { ...blank(10000), age: 62, birthMonth: 6, selfEmployment: 10000 });
    const payroll =
      (10000 - 3500) * (y.year === 2025 ? 0.064 : 0.063) +
      10000 * (y.year === 2025 ? 0.128 : 0.126) +
      10000 * (y.year === 2025 ? 0.0131 : 0.013);
    near(q.working, 20000 - payroll);
    near(q.earningsExemption, 10000);
    assert.ok(q.deductions > 0, "deductible self-employed QPIP is separate from the earnings exemption");
  });
}
