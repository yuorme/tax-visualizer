import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { listYears, loadYear } from "../src/data/load.ts";
import { healthServicesFund } from "../src/engine/health-services-fund.ts";
import { blank, compute, type Household, type Person } from "../src/engine/index.ts";
import { type Scenario, toHousehold } from "./golden/adapter.ts";
import { SCENARIOS } from "./golden/scenarios.mjs";
import { scheduleF } from "./qc-health-fund-form.ts";

const fixture: {
  defaults: Omit<Household, "people">;
  cases: {
    id: string;
    year: number;
    household: Omit<Partial<Household>, "people"> & { people: Partial<Person>[] };
    expected: Record<string, number>;
  }[];
} = JSON.parse(fs.readFileSync(new URL("./golden/features/qc-health-fund.json", import.meta.url), "utf8"));
const near = (a: number, b: number, label: string) => assert.ok(Math.abs(a - b) < 1e-7, `${label}: ${a} != ${b}`);
const years = new Map(listYears().map(year => [year, loadYear(year)]));
function data(year: number) {
  const y = years.get(year);
  assert.ok(y);
  const p = y.provinces.find(p => p.code === "QC");
  assert.ok(p);
  return { y, p };
}

function verify(year: number, hh: Household) {
  const { y, p } = data(year);
  const r = compute(y, p, hh);
  const before = compute(y, { ...p, healthServicesFund: undefined }, hh);
  const expected = hh.people.reduce((s, x) => s + scheduleF(year, x).contribution, 0);
  for (const [i, person] of r.list.entries()) {
    near(person.breakdown.healthServicesFund.contribution, scheduleF(year, person.x).contribution, `person ${i}`);
    near(person.total - before.list[i].total, person.breakdown.healthServicesFund.contribution, "person once");
    for (const key of ["ti", "tiP", "fed", "prov", "fFtc", "pFtc", "fEmp", "pEmp"] as const)
      assert.equal(person[key], before.list[i][key], key);
  }
  for (const key of ["payroll", "gross", "total", "netTotal"] as const) near(r[key] - before[key], expected, key);
  for (const key of ["incomeTax", "fed", "prov", "wh", "famNet", "benefits", "refund", "ccb", "provBen"] as const)
    assert.equal(r[key], before[key], key);
  assert.deepEqual(r.credits, before.credits);
  assert.deepEqual(r.breakdown.incomeBases, before.breakdown.incomeBases);
  assert.deepEqual(r.breakdown.childcareCredit, before.breakdown.childcareCredit);
  near(
    r.gross,
    r.incomeTax + r.payroll + r.sales + r.property + (r.fuel?.total ?? 0) + (r.carbon?.total ?? 0),
    "gross",
  );
  const pay = r.breakdown.payroll;
  near(r.payroll, pay.cpp + pay.ei + pay.qpip + pay.terr + pay.ohp + r.breakdown.healthServicesFund, "ledger sum");
  return r;
}

test("health fund feature fixture has unique cases and nonempty assertions", () => {
  assert.equal(new Set(fixture.cases.map(c => c.id)).size, fixture.cases.length);
  for (const c of fixture.cases) assert.ok(Object.keys(c.expected).length > 0);
});

for (const c of fixture.cases) {
  test(`health fund golden: ${c.id}`, () => {
    const hh: Household = {
      ...fixture.defaults,
      ...c.household,
      people: c.household.people.map(x => ({ ...blank(0), ...x })),
    };
    const r = verify(c.year, hh);
    for (const [path, expected] of Object.entries(c.expected)) {
      let value: unknown = r;
      for (const key of path.split(".")) {
        assert.ok(value !== null && typeof value === "object" && key in value, path);
        value = (value as Record<string, unknown>)[key];
      }
      assert.equal(typeof value, "number");
      assert.equal(Math.round((value as number) * 1e4) / 1e4, expected, path);
    }
  });
}

test("independent Schedule F audit covers every affected baseline and marginal/investment counterfactual", () => {
  const other: { scenarios: Scenario[] } = JSON.parse(
    fs.readFileSync(new URL("./golden/other-income-original.json", import.meta.url), "utf8"),
  );
  for (const year of [2025, 2026])
    for (const s of [...(SCENARIOS as unknown as Scenario[]), ...other.scenarios]) {
      const hh = toHousehold(s);
      verify(year, hh);
      for (const key of ["ord", "oth", "cg", "ed", "nd", "fd"] as const)
        verify(year, {
          ...hh,
          people: hh.people.map((x, i) => (i === hh.active ? { ...x, [key]: (x[key] ?? 0) + 100 } : x)),
        });
      verify(year, { ...hh, people: hh.people.map(x => ({ ...x, cg: 0, ed: 0, nd: 0, fd: 0 })) });
    }
});

test("Schedule F negative controls: gross-ups, all deductions and pooling people give different positive amounts", () => {
  const actual = scheduleF(2025, { ed: 25000, rrsp: 5000 }).contribution;
  assert.equal(actual, 68.7);
  assert.equal(scheduleF(2025, { oth: 25000 * 1.38 }).contribution, 150, "wrong taxable dividends");
  assert.equal(scheduleF(2025, { oth: 25000 - 5000 }).contribution, 18.7, "wrong RRSP deduction");
  assert.equal(2 * scheduleF(2025, { oth: 25000 }).contribution, 137.4);
  assert.equal(scheduleF(2025, { oth: 50000 }).contribution, 150, "wrong household pooling");
  // Exclusions are already in total income. These form-only specimens document future classification requirements.
  const a = { exclusions: { 22: 8000, 26: 3000 }, deductions: { 56: 1000, 46: 2000 } };
  assert.equal(scheduleF(2025, { oth: 40000 }, a).contribution, 78.7);
  assert.equal(scheduleF(2025, { oth: 40000 }).contribution, 150, "ignoring exclusions/deductions changes liability");
  for (const x of [{ oth: 18130 }, { ord: 100000, oth: 18130 }, { ed: 18130 }])
    assert.equal(scheduleF(2025, x).contribution, 0, "Part A early exit");
  assert.equal(scheduleF(2025, { oth: 25000 }, { deductions: { 56: 6870 } }).contribution, 0);
});

test("contribution is selected by data; legacy years and other provinces remain inactive", () => {
  for (const year of listYears()) {
    const { y, p } = data(year);
    for (const province of y.provinces) {
      const active = year >= 2025 && province.code === "QC";
      assert.equal(!!province.healthServicesFund, active);
      if (!active) assert.equal(healthServicesFund(province, 200000).contribution, 0);
    }
    if (year < 2025)
      assert.equal(compute(y, p, { ...fixture.defaults, people: [{ ...blank(0), oth: 200000 }] }).payroll, 0);
  }
  const { y, p } = data(2025);
  const on = y.provinces.find(p => p.code === "ON");
  assert.ok(on);
  assert.equal(healthServicesFund({ ...on, healthServicesFund: p.healthServicesFund }, 25000).contribution, 68.7);
  assert.equal(healthServicesFund(p, 40000, 14000).contribution, 78.7, "classified deductions seam");
});

test("Schedule F 43/43.1 do not deduct ordinary employee QPP or QPIP", () => {
  // Schedule U Part B line 23: 678 first additional + 396 second additional = 1,074.
  // Schedule F instead names U 101/103/115 (Part C), and R 26 (Part A self-employment QPIP).
  const r = verify(2025, { ...fixture.defaults, people: [{ ...blank(81300), oth: 25000 }] });
  assert.equal(r.me.pay.enh, 1074);
  assert.equal(r.me.breakdown.healthServicesFund.income, 25000);
  assert.equal(r.me.breakdown.healthServicesFund.contribution, 68.7);
  assert.equal(scheduleF(2025, { oth: 25000 }, { deductions: { 43.1: 1074 } }).contribution, 57.96);
});

test("excluded OAS and taxable support in generic other income can overstate the contribution", () => {
  // Illustrative annual OAS of 9,000, not a published annual maximum. Pension amounts exclude OAS.
  for (const year of [2025, 2026]) {
    for (const [pension, error] of [
      [0, 0],
      [20000, 90],
      [40000, 0],
    ]) {
      const other = pension + 9000;
      const r = verify(year, { ...fixture.defaults, people: [{ ...blank(0), oth: other }] });
      const correct = scheduleF(year, { oth: other }, { exclusions: { 22: 9000 } });
      near(r.me.breakdown.healthServicesFund.contribution - correct.contribution, error, "OAS error");
    }
    const support = scheduleF(year, { oth: 29000 }, { exclusions: { 26: 9000 } });
    near(scheduleF(year, { oth: 29000 }).contribution - support.contribution, 90, "support error");
  }
});

test("childcare and credit switches do not change the subject income or contribution", () => {
  for (const year of [2025, 2026]) {
    const hh: Household = {
      ...fixture.defaults,
      kids: 1,
      under6: 1,
      useBpa: true,
      useCredits: true,
      people: [{ ...blank(40000), oth: 25000 }],
      childcare: {
        mode: "automatic",
        earnedIncome: [40000],
        children: [{ age: 4, expenses: 6000, qcEligibleExpenses: 6000 }],
      },
    };
    const r = verify(year, hh);
    assert.ok(r.childcare.claims[0] > 0);
    assert.ok(r.benefits > 0);
    assert.equal(r.me.breakdown.healthServicesFund.income, 25000);
  }
});
