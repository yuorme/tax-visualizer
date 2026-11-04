import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { loadYear } from "../src/data/load.ts";
import { blank, type Household, household, type Person } from "../src/engine/index.ts";

const defaults: Omit<Household, "people"> = {
  active: 0,
  adults: 1,
  spouse: true,
  kids: 1,
  under6: 1,
  useBpa: true,
  useCredits: true,
  whRate: 0,
  homeValue: 0,
  rent: 0,
  monthlySpending: 0,
};

test("Quebec benefits use line 275 after the worker deduction", () => {
  const y = loadYear(2026);
  const p = y.provinces.find(p => p.code === "QC");
  assert.ok(p);
  const h = household(y, p, { ...defaults, people: [blank(55_000)] });
  assert.equal(h.famNet, 54_485);
  assert.equal(h.breakdown.incomeBases.provincialFamily, 53_035);
  // Retraite Québec line 275 definition; 4145 - 4% × (53035 - 44032).
  assert.equal(h.provBen, 3784.88);
  // Revenu Québec solidarity: 363 + 172 + 746 + 158 - 6% × (53035 - 43195).
  assert.equal(h.credits.find(([name]) => name === "Solidarity tax credit")?.[1], 848.6);
});

const fixture: {
  cases: {
    id: string;
    year: number;
    people: Partial<Person>[];
    kids: number;
    childcare?: Household["childcare"];
    expected: { provincial: number[]; provincialFamily: number; provBen: number; solidarity: number; premium: number };
  }[];
} = JSON.parse(fs.readFileSync(new URL("./golden/features/qc-provincial-net-income.json", import.meta.url), "utf8"));
const rounded = (n: number) => Math.round(n * 1e4) / 1e4;
const credit = (h: ReturnType<typeof household>, name: string) => h.credits.find(([n]) => n === name)?.[1] ?? 0;

// Static expected values were calculated from the source forms, without calling the engine.
// See docs/verification/103-qc-provincial-net-income.md for the equations and coverage map.
for (const c of fixture.cases) {
  test(`Quebec provincial income golden: ${c.id}`, () => {
    const y = loadYear(c.year);
    const p = y.provinces.find(p => p.code === "QC");
    assert.ok(p);
    const h = household(y, p, {
      ...defaults,
      people: c.people.map(x => ({ ...blank(0), ...x })),
      adults: c.people.length,
      kids: c.kids,
      under6: c.kids,
      childcare: c.childcare,
    });
    assert.deepEqual(
      {
        provincial: h.breakdown.incomeBases.provincial.map(rounded),
        provincialFamily: rounded(h.breakdown.incomeBases.provincialFamily),
        provBen: rounded(h.provBen),
        solidarity: rounded(credit(h, "Solidarity tax credit")),
        premium: rounded(credit(h, "Work premium")),
      },
      c.expected,
    );
  });
}

for (const year of [2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026]) {
  test(`${year}: a provincial-only worker deduction cannot change federal benefits or work income`, () => {
    const y = loadYear(year);
    const p = y.provinces.find(p => p.code === "QC");
    assert.ok(p?.quebec);
    for (const income of [10_000, 20_000, 55_000]) {
      const hh = { ...defaults, people: [blank(income)] };
      const normal = household(y, p, hh);
      const noWorker = household(
        y,
        {
          ...p,
          quebec: { ...p.quebec, workerDeduction: { ...p.quebec.workerDeduction, max: 0 } },
        },
        hh,
      );
      assert.equal(normal.famNet, noWorker.famNet);
      assert.equal(normal.ccb, noWorker.ccb);
      const federal = (h: typeof normal) =>
        h.credits.filter(([name]) => !["Solidarity tax credit", "Work premium"].includes(name));
      assert.deepEqual(federal(normal), federal(noWorker));
      if (income === 10_000) assert.equal(credit(normal, "Work premium"), credit(noWorker, "Work premium"));
      if (income === 20_000) {
        assert.ok(
          Math.abs(
            credit(normal, "Work premium") -
              credit(noWorker, "Work premium") -
              Math.min(p.quebec.workerDeduction.max, income * p.quebec.workerDeduction.rate) * 0.1,
          ) < 1e-8,
        );
      }
      if (income === 55_000) assert.ok(normal.provBen > noWorker.provBen);
    }
  });
}

test("federal childcare changes federal benefits but leaves every Quebec income-tested program on line 275", () => {
  const y = loadYear(2026);
  const p = y.provinces.find(p => p.code === "QC");
  assert.ok(p);
  // Both a work-premium phase-out and the Family Allowance/solidarity phase-outs must resist a federal claim.
  for (const income of [20_000, 55_000]) {
    const input = { ...defaults, people: [blank(income)] };
    const no = household(y, p, input);
    const withChildcare = household(y, p, {
      ...input,
      childcare: {
        mode: "automatic",
        children: [{ age: 3, expenses: 8000, qcEligibleExpenses: 8000 }],
        earnedIncome: [income],
      },
    });
    assert.equal(withChildcare.famNet, no.famNet - 8000);
    assert.equal(withChildcare.provBen, no.provBen);
    for (const name of ["Solidarity tax credit", "Work premium"])
      assert.equal(credit(withChildcare, name), credit(no, name));
    assert.equal(withChildcare.breakdown.childcareCredit?.income, no.breakdown.incomeBases.provincialFamily);
    assert.equal(credit(withChildcare, "Quebec childcare expenses tax credit"), income === 55_000 ? 5600 : 6240);
    if (income === 55_000) assert.ok(withChildcare.ccb > no.ccb);
  }
});

test("a second adult who is not a spouse does not enter Quebec family benefit income", () => {
  const y = loadYear(2026);
  const p = y.provinces.find(p => p.code === "QC");
  assert.ok(p);
  const first = { ...defaults, adults: 2, spouse: false, people: [blank(20_000), blank(0)] };
  const a = household(y, p, first);
  const b = household(y, p, { ...first, people: [blank(20_000), blank(55_000)] });
  assert.equal(b.breakdown.incomeBases.provincialFamily, 18_635);
  assert.equal(b.provBen, a.provBen);
  assert.deepEqual(b.credits, a.credits);
});
