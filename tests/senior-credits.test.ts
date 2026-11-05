import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { loadYear } from "../src/data/load.ts";
import { scaleHousehold } from "../src/engine/history.ts";
import {
  blank,
  compute,
  type Household,
  household,
  type Person,
  UnsupportedSeniorCreditsError,
} from "../src/engine/index.ts";
import { seniorBases, seniorTransfer } from "../src/engine/senior-credits.ts";

interface Case {
  id: string;
  year: number;
  province: string;
  household: Omit<Partial<Household>, "people"> & { people: Partial<Person>[] };
  expected: Record<string, number>;
}
const fixture: { defaults: Omit<Household, "people">; cases: Case[] } = JSON.parse(
  fs.readFileSync(new URL("./golden/features/senior-credits.json", import.meta.url), "utf8"),
);
const years = [loadYear(2025), loadYear(2026)];
const round = (n: number) => Math.round(n * 1e4) / 1e4;
function valueAt(value: unknown, path: string): number {
  for (const key of path.split(".")) {
    assert.ok(value && typeof value === "object" && key in value, path);
    value = (value as Record<string, unknown>)[key];
  }
  assert.equal(typeof value, "number");
  return value as number;
}
const input = (people: Partial<Person>[], extra: Partial<Household> = {}): Household => ({
  ...fixture.defaults,
  adults: people.length,
  ...extra,
  people: people.map(p => ({ ...blank(0), ...p })),
});
const province = (y: (typeof years)[number], code: string) => {
  const p = y.provinces.find(p => p.code === code);
  assert.ok(p);
  return p;
};
for (const c of fixture.cases) {
  test(`senior golden: ${c.id}`, () => {
    const y = years.find(y => y.year === c.year);
    assert.ok(y);
    const h = input(c.household.people, c.household as Partial<Household>);
    const r = household(y, province(y, c.province), h);
    for (const [path, expected] of Object.entries(c.expected))
      assert.equal(round(valueAt(r, path)), expected, `${c.id}: ${path}`);
  });
}

test("senior goldens cover both years and all thirteen jurisdictions, with unique immutable cases", () => {
  assert.equal(new Set(fixture.cases.map(c => c.id)).size, fixture.cases.length);
  for (const y of years)
    assert.deepEqual(
      new Set(fixture.cases.filter(c => c.year === y.year).map(c => c.province)),
      new Set(y.provinces.map(p => p.code)),
    );
});

test("legacy inputs remain identical when senior data is absent; explicit retirement receipts conserve cash", () => {
  for (const y of years)
    for (const p of y.provinces) {
      const h = input([{ oth: 40000 }]);
      const baseline = compute(y, p, h);
      const without = structuredClone(y);
      delete without.federal.seniorCredits;
      for (const q of without.provinces) delete q.seniorCredits;
      assert.deepEqual(compute(without, province(without, p.code), h), baseline);
      const pension = compute(
        y,
        p,
        input([{ oth: 30000, retirementIncome: [{ type: "rppLifetime", amount: 10000 }] }]),
      );
      assert.equal(pension.cash, baseline.cash);
      assert.equal(pension.famNet, baseline.famNet);
      assert.deepEqual(pension.me.pay, baseline.me.pay);
      assert.equal(pension.breakdown.healthServicesFund, baseline.breakdown.healthServicesFund);
      assert.equal(pension.breakdown.incomeBases.beforeChildcare[0], 40000);
      assert.equal(pension.me.breakdown.rrspRoom, baseline.me.breakdown.rrspRoom);
    }
});

test("data gates historical pension support even at zero receipts or with credits disabled", () => {
  for (const year of [2019, 2020, 2021, 2022, 2023, 2024]) {
    const y = loadYear(year);
    assert.throws(
      () => compute(y, y.provinces[0], input([{ retirementIncome: [] }], { useBpa: false })),
      UnsupportedSeniorCreditsError,
    );
  }
  const y = structuredClone(years[1]);
  y.federal.year = 2099;
  assert.doesNotThrow(() =>
    compute(y, y.provinces[0], input([{ retirementIncome: [{ type: "rppLifetime", amount: 2000 }] }])),
  );
});

test("receipt validation rejects unknown, negative, nonfinite and ambiguous age-dependent inputs", () => {
  const y = years[0];
  const p = province(y, "QC");
  for (const receipt of [
    { type: "genericPension", amount: 1000 },
    { type: "rppLifetime", amount: -1 },
    { type: "rrif", amount: NaN },
    { type: "rrif", amount: 1000 },
    { type: "rrspWithdrawal", amount: 1000, survivorEligible: true },
  ]) {
    assert.throws(() => compute(y, p, input([{ retirementIncome: [receipt] as Person["retirementIncome"] }])));
  }
  assert.doesNotThrow(() =>
    compute(y, p, input([{ retirementIncome: [{ type: "rrif", amount: 1000, survivorEligible: true }] }])),
  );
});

test("personal-credit switch disables age/pension/transfer relief while retaining receipts", () => {
  for (const y of years)
    for (const p of y.provinces) {
      const person = {
        age: 65,
        birthMonth: 6,
        oth: 30000,
        retirementIncome: [{ type: "rppLifetime" as const, amount: 10000 }],
      };
      const r = household(y, p, input([person], { useBpa: false }));
      const b = r.list[0].breakdown.seniorCredits;
      assert.equal(r.cash, 40000);
      assert.equal(b.federalApplied, 0);
      assert.equal(b.provincialApplied, 0);
      assert.equal(b.ageTaxApplied, 0);
      assert.equal(b.familyAgeBase, 0);
      assert.equal(b.quebecTransferApplied, 0);
    }
});

test("real-history scaling preserves categories, survivor status, age and receipt omission", () => {
  const h = input([
    { age: 64, birthMonth: 6, retirementIncome: [{ type: "rrif", amount: 1000, survivorEligible: true }] },
    {},
  ]);
  const r = scaleHousehold(h, 2);
  assert.deepEqual(r.people[0].retirementIncome, [{ type: "rrif", amount: 2000, survivorEligible: true }]);
  assert.equal(r.people[0].age, 64);
  assert.equal(r.people[1].retirementIncome, undefined);
  assert.equal(h.people[0].retirementIncome?.[0].amount, 1000);
});

test("age and pension parameters, including Yukon copy, dispatch from data", () => {
  const y = structuredClone(years[0]);
  const f = y.federal.seniorCredits;
  assert.ok(f);
  f.age.params.minimumAge = 66;
  f.pension.params.minimumRrifAge = 66;
  const x = { ...blank(0), age: 65, birthMonth: 6, retirementIncome: [{ type: "rrif" as const, amount: 3000 }] };
  const b = seniorBases(y.federal, province(y, "YT"), x, 40000, true);
  assert.equal(b.federalAge, 0);
  assert.equal(b.provincialAge, 0);
  assert.equal(b.federalPension, 0);
});

test("S2 uses prior employment bases, not final tax, spouse credits, dividends or incoming transfers", () => {
  const y = years[0];
  const p = province(y, "ON");
  const h = input([
    { ord: 20000, age: 65, birthMonth: 6, retirementIncome: [{ type: "rppLifetime", amount: 2000 }] },
    { oth: 80000 },
  ]);
  const donor = household(y, p, h).list[0];
  const transfer = seniorTransfer(donor, p, 0.145);
  const capacity = donor.ti - 16129 - (1471 + donor.pay.base + donor.pay.ei);
  assert.ok(Math.abs(transfer.federal - (9028 + 2000 - capacity)) < 1e-8);
  assert.deepEqual(seniorTransfer({ ...donor, fSpFull: 5000, fDtcFull: 5000, fed: 0 }, p, 0.145), transfer);
});

test("existing age-66 QPP business input acquires both age tapers: independent marginal calculation", () => {
  const y = years[0];
  const h = input(
    [
      {
        selfEmployment: 75000,
        age: 66,
        birthMonth: 1,
        employeePayroll: {
          retirementPensionSince: { year: 2024, month: 1 },
          cppElection: { stop: { year: 2025, month: 6 } },
        },
      },
    ],
    { useCredits: true, whRate: 0.15, spouse: false },
  );
  // #14's independent Schedule U/R/F calculation: +100 profit, -8 QPP2, -.38400208 deductible QPIP.
  const netChange = 100 - 8 - 0.38400208;
  const previous = 0.42823757229792;
  const expected = previous + (netChange * (0.15 * 0.145 * 0.835 + 0.1875 * 0.14)) / 100;
  const actual = compute(y, province(y, "QC"), h).breakdown.margSelfEmployment;
  assert.ok(typeof actual === "number" && Math.abs(actual - expected) < 1e-10);
  assert.ok(Math.abs(expected - 0.468925382174166) < 1e-12);
});
