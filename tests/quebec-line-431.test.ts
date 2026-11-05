import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { loadYear } from "../src/data/load.ts";
import {
  blank,
  compute,
  type Household,
  household,
  type Person,
  UnsupportedSeniorCreditsError,
} from "../src/engine/index.ts";
import { UnsupportedRetirementPayrollError } from "../src/engine/payroll.ts";

const input = (people: Partial<Person>[], extra: Partial<Household> = {}): Household => ({
  people: people.map(p => ({ ...blank(0), ...p })),
  adults: 2,
  spouse: true,
  active: 0,
  kids: 0,
  under6: 0,
  useBpa: true,
  useCredits: false,
  whRate: 0,
  homeValue: 0,
  rent: 0,
  monthlySpending: 0,
  ...extra,
});
const round = (n: number) => Math.round(n * 100) / 100;
const round4 = (n: number) => Math.round(n * 1e4) / 1e4;
const fixture: {
  cases: {
    id: string;
    year: number;
    people: Partial<Person>[];
    expected: { prov: number; transfer: number[]; applied: number[] };
  }[];
} = JSON.parse(fs.readFileSync(new URL("./golden/features/quebec-line-431.json", import.meta.url), "utf8"));
const years = new Map(fixture.cases.map(c => [c.year, loadYear(c.year)]));

for (const c of fixture.cases) {
  test(`Quebec line 431 golden: ${c.id}`, () => {
    const y = years.get(c.year);
    assert.ok(y);
    const p = y.provinces.find(p => p.code === "QC");
    assert.ok(p);
    for (const reverse of [false, true]) {
      const people = reverse ? [...c.people].reverse() : c.people;
      const r = household(y, p, input(people));
      assert.equal(round4(r.prov), c.expected.prov);
      // The lower-income recipient uses 20,000 × .14 - 18,952 × .14 = 146.72.
      if (c.id === "2026-recipient-cap") assert.equal(round4(r.claim?.saved ?? 0), 146.72);
      for (const [i, person] of r.list.entries()) {
        const expectedIndex = reverse ? 1 - i : i;
        const b = person.breakdown.seniorCredits;
        assert.equal(round4(b.quebecTransfer), c.expected.transfer[expectedIndex]);
        assert.equal(round4(b.quebecTransferApplied), c.expected.applied[expectedIndex]);
        assert.equal(person.pSpFull, 0, "BPA must not also enter the legacy spouse credit");
      }
      if (c.year >= 2025) {
        for (const age of [40, 64]) {
          const withAge = household(y, p, input(people.map(person => ({ ...person, age, birthMonth: 6 }))));
          assert.equal(withAge.prov, r.prov);
          assert.equal(withAge.fed, r.fed);
          assert.equal(withAge.total, r.total);
        }
      }
    }
  });
}

test("line 431 needs neither historical senior data nor permission to accept unsupported senior inputs", () => {
  for (const [year, y] of years) {
    const p = y.provinces.find(p => p.code === "QC");
    assert.ok(p);
    const h = input([{ ed: 20000 }, { oth: 40000, ed: 2000 }]);
    const without = structuredClone(y);
    delete without.federal.seniorCredits;
    for (const q of without.provinces) delete q.seniorCredits;
    const q = without.provinces.find(p => p.code === "QC");
    assert.ok(q);
    assert.deepEqual(compute(without, q, h), compute(y, p, h));
    if (year < 2025) {
      assert.throws(
        () => household(y, p, input([{ ed: 20000, age: 40, birthMonth: 6 }, { oth: 40000 }])),
        UnsupportedRetirementPayrollError,
      );
      assert.throws(
        () => household(y, p, input([{ ed: 20000, retirementIncome: [] }, { oth: 40000 }])),
        UnsupportedSeniorCreditsError,
      );
    }
  }
});

test("line 431 respects spouse status and the personal-credit switch in every year", () => {
  for (const y of years.values()) {
    const p = y.provinces.find(p => p.code === "QC");
    assert.ok(p);
    for (const extra of [{ spouse: false }, { useBpa: false }]) {
      const r = household(y, p, input([{ ed: 20000 }, { oth: 40000, ed: 2000 }], extra));
      assert.ok(r.prov > 0);
      for (const person of r.list) assert.equal(person.breakdown.seniorCredits.quebecTransferApplied, 0);
    }
  }
});

test("personal credits off blocks an otherwise usable unused dividend credit", () => {
  const y = loadYear(2026);
  const p = y.provinces.find(p => p.code === "QC");
  assert.ok(p);
  const r = household(y, p, input([{ ed: 20000, ded: 20000 }, { oth: 40000 }], { useBpa: false }));
  // Donor line 430 without BPA: 7,600 × 14% - 27,600 × 11.7% = -2,165.20.
  // The switch disables that transfer, leaving the recipient's 40,000 × 14% untouched.
  assert.equal(round(r.prov), 5600);
  for (const person of r.list) assert.equal(person.breakdown.seniorCredits.quebecTransferApplied, 0);
});

test("spouse savings include the applied Quebec transfer in either direction, with or without age", () => {
  const y = loadYear(2026);
  const p = y.provinces.find(p => p.code === "QC");
  assert.ok(p);
  for (const [donor, expected] of [
    [0, 4576.5188],
    [18000, 133.28],
  ]) {
    for (const reverse of [false, true]) {
      const people = [{ ord: 60000 }, { oth: donor }];
      if (reverse) people.reverse();
      for (const age of [undefined, 40]) {
        const r = household(y, p, input(people.map(person => ({ ...person, ...(age ? { age, birthMonth: 6 } : {}) }))));
        // Federal spouse relief: 16,452 × .14 × .835 = 1,923.2388 for the zero-income donor.
        // Quebec transfers: 18,952 × .14 = 2,653.28, or (18,952 - 18,000) × .14 = 133.28.
        assert.equal(round4(r.claim?.saved ?? 0), expected);
        if (donor === 0) assert.equal(round(r.prov), 2993.34);
      }
    }
  }
});

test("#205: entering an under-65 age cannot enable Quebec line 431", () => {
  const y = loadYear(2026);
  const p = y.provinces.find(p => p.code === "QC");
  assert.ok(p);
  const people = [{ ed: 20000 }, { oth: 40000, ed: 2000 }];
  // TP-1: donor 3864 - 2653.28 - 3229.20 = -2018.48;
  // recipient 5986.40 - 2653.28 - 322.92 - 2018.48 = 991.72.
  const omitted = household(y, p, input(people));
  assert.equal(round(omitted.prov), 991.72);
  assert.equal(round(omitted.fed), 2729.26);
  assert.equal(round(omitted.total), 3885.98); // Includes $165 Health Services Fund contribution.
  for (const age of [40, 64]) {
    const entered = household(y, p, input(people.map(person => ({ ...person, age, birthMonth: 6 }))));
    assert.equal(entered.prov, omitted.prov);
    assert.equal(entered.fed, omitted.fed);
  }
});
