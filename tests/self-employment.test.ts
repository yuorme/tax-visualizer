import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { loadYear } from "../src/data/load.ts";
import { federalSchema } from "../src/data/schema.ts";
import { historyComparison, scaleHousehold } from "../src/engine/history.ts";
import {
  blank,
  compute,
  computeAll,
  type Household,
  type Person,
  UnsupportedSelfEmploymentError,
} from "../src/engine/index.ts";
import { netOf, payrollDetailsOf, payrollOf } from "../src/engine/payroll.ts";
import { snapshot } from "./golden/snapshot.mjs";

interface Case {
  id: string;
  year: number;
  province: string;
  household: Omit<Partial<Household>, "people"> & { people: Partial<Person>[] };
  expected: Record<string, unknown>;
}
const fixture: { defaults: Omit<Household, "people">; cases: Case[] } = JSON.parse(
  fs.readFileSync(new URL("./golden/features/self-employment.json", import.meta.url), "utf8"),
);
const years = new Map([2025, 2026].map(year => [year, loadYear(year)]));
function yearOf(year: number) {
  const value = years.get(year);
  assert.ok(value);
  return value;
}
const hhOf = (x: Partial<Person>): Household => ({ ...fixture.defaults, people: [{ ...blank(0), ...x }] });
const round = (n: number) => Math.round(n * 1e4) / 1e4;
function atPath(value: unknown, path: string): unknown {
  for (const key of path.split(".")) {
    assert.ok(value !== null && typeof value === "object" && key in value, `missing ${path}`);
    value = (value as Record<string, unknown>)[key];
  }
  return value;
}

test("self-employment fixtures have unique IDs and cover both supported years", () => {
  assert.equal(new Set(fixture.cases.map(c => c.id)).size, fixture.cases.length);
  assert.deepEqual(new Set(fixture.cases.map(c => c.year)), new Set([2025, 2026]));
});
for (const c of fixture.cases) {
  test(`self-employment independent golden: ${c.id}`, () => {
    const y = yearOf(c.year);
    const p = y.provinces.find(p => p.code === c.province);
    assert.ok(p);
    const hh = { ...fixture.defaults, ...c.household, people: c.household.people.map(x => ({ ...blank(0), ...x })) };
    const result = compute(y, p, hh);
    for (const [path, expected] of Object.entries(c.expected)) {
      const actual = atPath(result, path);
      // Independent fixture rounds to four decimals; compare the raw double within half that unit.
      // Python and JS round exact halfway values differently. The extra 1e-9 covers binary representation.
      if (typeof expected === "number") {
        assert.ok(
          typeof actual === "number" && Math.abs(actual - expected) <= 0.000050001,
          `${c.id}: ${path}: ${actual} vs ${expected}`,
        );
      } else assert.deepEqual(actual, expected, `${c.id}: ${path}`);
    }
  });
}

test("published CRA Pierre example: $75,000 net business income, 2025 and 2026", () => {
  for (const [year, first, second, total] of [
    [2025, 8068.2, 296, 8364.2],
    [2026, 8460.9, 32, 8492.9],
  ]) {
    const y = yearOf(year);
    const pay = payrollOf(y.federal, null, { ...blank(0), selfEmployment: 75000 });
    assert.equal(round(pay.base + 2 * (y.federal.payroll.cpp.ympe - 3500) * 0.01), first);
    assert.equal(round(pay.enh - 2 * (y.federal.payroll.cpp.ympe - 3500) * 0.01), second);
    assert.equal(round(pay.base + pay.enh), total);
    assert.equal(pay.ei, 0);
  }
});

test("legacy omission and explicit zero leave every ordinary result unchanged in all provinces", () => {
  for (const y of years.values()) {
    const hh = hhOf({ ord: 54000, oth: 12000, cg: 5000, ed: 6000, rrsp: 4000 });
    const before = computeAll(y, hh);
    const after = computeAll(y, { ...hh, people: hh.people.map(x => ({ ...x, selfEmployment: 0 })) });
    for (let i = 0; i < before.length; i++) assert.deepEqual(snapshot(after[i].r), snapshot(before[i].r));
  }
});

test("unsupported historical years reject explicit zero too; omitted inputs remain valid", () => {
  for (const year of [2019, 2020, 2021, 2022, 2023, 2024]) {
    const y = loadYear(year);
    for (const amount of [0, 10000]) {
      assert.throws(
        () => compute(y, y.provinces[0], hhOf({ selfEmployment: amount })),
        error => error instanceof UnsupportedSelfEmploymentError && error.year === year,
      );
    }
    assert.doesNotThrow(() => payrollOf(y.federal, null, blank(0)));
  }
});

test("invalid profit, entry-age and employee-only CPP elections fail explicitly", () => {
  const y = yearOf(2025);
  for (const value of [-1, Infinity, NaN, null, "1000"]) {
    assert.throws(() => payrollOf(y.federal, null, { ...blank(0), selfEmployment: value } as Person), RangeError);
  }
  assert.throws(
    () => payrollOf(y.federal, null, { ...blank(0), selfEmployment: 10000, age: 18, birthMonth: 6 }),
    RangeError,
  );
  assert.throws(
    () =>
      compute(
        y,
        y.provinces[0],
        hhOf({
          selfEmployment: 10000,
          age: 66,
          birthMonth: 6,
          employeePayroll: {
            retirementPensionSince: { year: 2024, month: 1 },
            cppElection: { stop: { year: 2025, month: 6 } },
          },
        }),
      ),
    /effective months/,
  );
});

test("support and amounts are data-driven, without year-number branches", () => {
  const y = loadYear(2026);
  y.federal.year = 2099;
  const x = { ...blank(0), selfEmployment: 10000 };
  assert.ok(payrollOf(y.federal, null, x).base > 0);
  delete y.federal.payroll.selfEmployment;
  assert.throws(() => payrollOf(y.federal, null, x), UnsupportedSelfEmploymentError);
  assert.ok(federalSchema.safeParse(y.federal).success);
});

test("deduct the employer base plus ALL enhancements; credit only one base share", () => {
  const y = yearOf(2025);
  const x = { ...blank(0), selfEmployment: 75000 };
  const { pay, selfEmployment: se } = payrollDetailsOf(y.federal, null, x);
  assert.ok(se);
  assert.equal(round(se.baseCredit), 3356.1);
  assert.equal(round(se.pensionDeduction), 5008.1);
  assert.equal(round(netOf(y.federal, null, x)), 69991.9);
  assert.notEqual(round(se.pensionDeduction), round((pay.base + pay.enh) / 2));
  assert.notEqual(round(se.baseCredit), round(pay.base));
});

test("business marginal uses profit, retains employee income, and includes the shared ceiling", () => {
  const y = yearOf(2025);
  const p = y.provinces.find(p => p.code === "ON");
  assert.ok(p);
  const hh = hhOf({ ord: 70000, selfEmployment: 1000 });
  const r = compute(y, p, hh);
  const bumped = compute(y, p, hhOf({ ord: 70000, selfEmployment: 1100 }));
  const marginal = r.breakdown.margSelfEmployment;
  assert.ok(typeof marginal === "number");
  assert.equal(round(marginal), round((bumped.netTotal - r.netTotal) / 100));
  assert.notEqual(round(marginal), round(r.margBy.ord));
});

test("real history scales business profit, preserves omission, and requires supported years", () => {
  const hh = hhOf({ ord: 30000, selfEmployment: 60000 });
  assert.equal(scaleHousehold(hh, 0.5).people[0].selfEmployment, 30000);
  assert.equal(scaleHousehold(hhOf({ ord: 30000 }), 0.5).people[0].selfEmployment, undefined);
  assert.equal(hh.people[0].selfEmployment, 60000);
  assert.throws(
    () =>
      historyComparison(
        [loadYear(2024)],
        { series: "test", values: { 2024: 100 }, sources: [] },
        hh,
        ["ON"],
        "nominal",
      ),
    UnsupportedSelfEmploymentError,
  );
});
