import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { loadYear } from "../src/data/load.ts";
import { federalSchema } from "../src/data/schema.ts";
import { compute, computeAll, household } from "../src/engine/household.ts";
import { employeeRetirementPayrollOf, payrollOf, UnsupportedRetirementPayrollError } from "../src/engine/payroll.ts";
import { blank, type Household, type Person } from "../src/engine/types.ts";
import { ccb2025, type PayrollYear, payrollWorksheet } from "./retirement-payroll-forms.ts";

interface Case {
  id: string;
  year: PayrollYear;
  province: string;
  person: Partial<Person> & { ord: number };
  audit: { contributoryMonths: number[]; pensionableEarnings: number };
  expected: Record<string, unknown>;
}
const fixture: { defaults: Omit<Household, "people">; cases: Case[] } = JSON.parse(
  fs.readFileSync(new URL("./golden/features/retirement-payroll.json", import.meta.url), "utf8"),
);
const years = { 2025: loadYear(2025), 2026: loadYear(2026) };
const hhOf = (person: Partial<Person>): Household => ({ ...fixture.defaults, people: [{ ...blank(0), ...person }] });
const rounded = (n: number) => Math.round(n * 1e4) / 1e4;
function atPath(value: unknown, path: string): unknown {
  for (const key of path.split(".")) {
    assert.ok(value !== null && typeof value === "object" && key in value, `missing ${path}`);
    value = (value as Record<string, unknown>)[key];
  }
  return typeof value === "number" ? rounded(value) : value;
}

test("retirement goldens have unique IDs, both plans and both supported years", () => {
  assert.equal(new Set(fixture.cases.map(c => c.id)).size, fixture.cases.length);
  assert.deepEqual(
    new Set(fixture.cases.map(c => `${c.year}-${c.province}`)),
    new Set(["2025-ON", "2025-QC", "2026-ON", "2026-QC"]),
  );
});

for (const c of fixture.cases) {
  test(`retirement payroll golden and independent worksheet: ${c.id}`, () => {
    const y = years[c.year];
    const p = y.provinces.find(p => p.code === c.province);
    assert.ok(p);
    const result = compute(y, p, hhOf(c.person));
    for (const [path, expected] of Object.entries(c.expected))
      assert.deepEqual(atPath(result, path), expected, `${c.id}: ${path}`);
    const weights = c.person.employeePayroll?.monthlyEarningsWeights ?? Array<number>(12).fill(1);
    const sum = weights.reduce((a, b) => a + b, 0);
    const pays = c.audit.contributoryMonths.map(month => (c.person.ord * weights[month - 1]) / sum);
    const form = payrollWorksheet(c.year, c.province === "QC" ? "QPP" : "CPP", c.person.ord, pays);
    const actual = result.list[0];
    assert.deepEqual(actual.breakdown.retirementPayroll?.contributoryMonths, c.audit.contributoryMonths);
    assert.equal(rounded(form.pensionable), c.audit.pensionableEarnings);
    for (const [value, expected] of [
      [actual.pay.base, form.base],
      [actual.pay.enh, form.enhanced],
      [actual.pay.ei, form.ei],
      [actual.pay.qpip, form.qpip],
      [actual.fEmpFull, form.federalEmploymentCredit],
      [actual.pEmpFull, form.provincialEmploymentCredit],
      [actual.breakdown.retirementPayroll?.overpayment, form.overpayment],
    ]) {
      assert.ok(value !== undefined && expected !== undefined);
      assert.equal(rounded(value), rounded(expected));
    }
    const net =
      c.person.ord +
      (c.person.oth ?? 0) -
      (c.person.ded ?? 0) -
      (c.person.rrsp ?? 0) -
      (c.person.fhsa ?? 0) -
      form.enhanced;
    assert.equal(rounded(result.famNet), rounded(net));
    if (c.year === 2025) assert.equal(rounded(result.ccb), rounded(ccb2025(net)));
  });
}

test("negative controls: prorating QPP or taxing pay after a stop fails the independent goldens", () => {
  const c = fixture.cases.find(c => c.id === "2026-qpp-both-tiers-half-year");
  assert.ok(c);
  const wrong = payrollWorksheet(2026, "QPP", 180000, Array<number>(6).fill(15000), true);
  assert.throws(() => assert.equal(rounded(wrong.base), c.expected["list.0.pay.base"]));
  assert.throws(() => assert.equal(rounded(wrong.enhanced), c.expected["list.0.pay.enh"]));
  const after = fixture.cases.find(c => c.id === "2025-cpp-pay-after-stop");
  assert.ok(after);
  const taxedAnnualPay = payrollWorksheet(2025, "CPP", 100000, Array<number>(6).fill(100000 / 6));
  assert.throws(() => assert.equal(rounded(taxedAnnualPay.base), after.expected["list.0.pay.base"]));
});

test("source data and program dispatch control support, ages and election timing", () => {
  const y = loadYear(2026);
  const x = { ...blank(100000), age: 70, birthMonth: 6 };
  const rules = y.federal.payroll.employeeRetirement;
  assert.ok(rules);
  y.federal.year = 2099;
  assert.equal(employeeRetirementPayrollOf(y.federal, null, x)?.retirement.contributoryMonths.length, 6);
  rules.cpp.params.mandatoryStopAge = 71;
  assert.equal(employeeRetirementPayrollOf(y.federal, null, x)?.retirement.contributoryMonths.length, 12);
  rules.cpp.params.electionFromAge = 66;
  const election = {
    ...blank(50000),
    age: 65,
    birthMonth: 6,
    employeePayroll: {
      retirementPensionSince: { year: 2098, month: 1 },
      cppElection: { stop: { year: 2099, month: 6 } },
    },
  };
  assert.equal(employeeRetirementPayrollOf(y.federal, null, election)?.retirement.election, "ineligible-stop");
  rules.cpp.params.electionFromAge = 65;
  rules.cpp.params.electionEffectiveMonthOffset = 2;
  assert.equal(employeeRetirementPayrollOf(y.federal, null, election)?.retirement.contributoryMonths.length, 7);
  assert.ok(federalSchema.safeParse(y.federal).success);
  delete y.federal.payroll.employeeRetirement;
  assert.throws(() => payrollOf(y.federal, null, x), UnsupportedRetirementPayrollError);
});

test("unconfigured historical retirement payroll fails explicitly, including zero earnings", () => {
  for (let year = 2019; year <= 2024; year++) {
    const y = loadYear(year);
    const person = { ...blank(0), age: 73, birthMonth: 1 };
    assert.throws(() => compute(y, y.provinces[0], hhOf(person)), UnsupportedRetirementPayrollError);
    assert.doesNotThrow(() => compute(y, y.provinces[0], hhOf(blank(50000))));
  }
});

test("malformed timing fails instead of silently choosing a contribution period", () => {
  const fed = years[2026].federal;
  const good: Person = { ...blank(50000), age: 66, birthMonth: 6 };
  for (const bad of [
    { age: undefined },
    { age: 65.5 },
    { age: NaN },
    { age: -1 },
    { age: 18 },
    { birthMonth: undefined },
    { birthMonth: 0 },
    { birthMonth: 13 },
    { employeePayroll: { monthlyEarningsWeights: [1] } },
    { employeePayroll: { monthlyEarningsWeights: Array<number>(12).fill(0) } },
    { employeePayroll: { monthlyEarningsWeights: [NaN, ...Array<number>(11).fill(1)] } },
    { employeePayroll: { retirementPensionSince: { year: 2025, month: 0 } } },
    { employeePayroll: { qppElection: { stop: { year: 2025, month: 13 } } } },
  ])
    assert.throws(() => payrollOf(fed, null, { ...good, ...bad }), RangeError);
});

test("defaults retain exact legacy payroll in all years; equal weights preserve full-year contributions", () => {
  for (let year = 2019; year <= 2026; year++) {
    const y = loadYear(year);
    for (const p of y.provinces) {
      const x = blank(80000);
      const legacy = payrollOf(y.federal, p, x);
      assert.equal(employeeRetirementPayrollOf(y.federal, p, x), null);
      if (y.federal.payroll.employeeRetirement) {
        assert.deepEqual(payrollOf(y.federal, p, { ...x, age: 65, birthMonth: 6 }), legacy);
        assert.deepEqual(
          payrollOf(y.federal, p, {
            ...x,
            age: 65,
            birthMonth: 6,
            employeePayroll: { monthlyEarningsWeights: Array<number>(12).fill(2) },
          }),
          legacy,
        );
      }
    }
  }
});

test("province comparison preserves independent elections and EI/QPIP; marginal pay follows the same weights", () => {
  const y = years[2026];
  const h = hhOf({
    ord: 50000,
    age: 66,
    birthMonth: 6,
    employeePayroll: {
      retirementPensionSince: { year: 2025, month: 1 },
      cppElection: { stop: { year: 2025, month: 6 } },
    },
  });
  for (const { r } of computeAll(y, h)) {
    assert.ok(r.list[0].pay.ei > 0);
    if (r.list[0].pay.qpip) assert.ok(r.list[0].pay.base > 0);
    else assert.equal(r.list[0].pay.base, 0);
  }
  const c = fixture.cases.find(c => c.id === "2026-cpp-pay-after-stop");
  const p = y.provinces.find(p => p.code === "ON");
  assert.ok(c && p);
  const hh = hhOf(c.person);
  const r = compute(y, p, hh);
  const next = household(y, p, hh, [{ ...hh.people[0], ord: hh.people[0].ord + 100 }]);
  assert.equal(next.list[0].pay.base, 0);
  assert.ok(Math.abs(r.margBy.ord - (next.netTotal - r.netTotal) / 100) < 1e-9);
});

test("both spouses' enhanced contributions reach family net income, childcare bases and benefits", () => {
  const y = years[2025];
  const p = y.provinces.find(p => p.code === "ON");
  assert.ok(p);
  const hh = hhOf({ ord: 50000, age: 70, birthMonth: 6 });
  hh.adults = 2;
  hh.people.push({ ...blank(20000), age: 71, birthMonth: 1 });
  const r = household(y, p, hh);
  // Six months of 50,000/12 pay: Schedule 8 first additional = (25,000 - 1,750) * 1%.
  assert.equal(r.list[0].pay.enh, 232.5);
  assert.equal(r.list[1].pay.enh, 0);
  assert.equal(r.famNet, 69767.5);
  assert.equal(rounded(r.ccb), rounded(ccb2025(69767.5)));
  assert.deepEqual(r.breakdown.incomeBases.beforeChildcare, [49767.5, 20000]);
});
