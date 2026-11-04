import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { loadYear } from "../src/data/load.ts";
import { blank, type Household, household, type Person } from "../src/engine/index.ts";

const defaults: Omit<Household, "people"> = {
  active: 0,
  adults: 1,
  spouse: true,
  kids: 0,
  under6: 0,
  useBpa: true,
  useCredits: true,
  whRate: 0,
  homeValue: 0,
  rent: 0,
  monthlySpending: 0,
};

test("Quebec living-alone taper includes the worker deduction exactly once", () => {
  const y = loadYear(2025);
  const p = y.provinces.find(p => p.code === "QC");
  assert.ok(p);
  const h = household(y, p, { ...defaults, people: [blank(48_000)] });
  // TP-1: 48000 - (48000 - 3500) × 1% - 1420 = 46135 on line 275.
  // Schedule B: 2128 - (46135 - 42090) × 18.75% = 1369.5625 on line 34.
  assert.equal(h.list[0].tiP, 46_135);
  assert.equal(h.claim?.pAmt, 1369.5625);
  assert.ok(Math.abs(h.list[0].pSp - 191.73875) < 1e-8);
});

const fixture: {
  cases: {
    id: string;
    year: number;
    person: Partial<Person>;
    kids?: number;
    childcare?: Household["childcare"];
    expected: { line275: number; amount: number; credit: number; applied: number };
  }[];
} = JSON.parse(fs.readFileSync(new URL("./golden/features/qc-living-alone.json", import.meta.url), "utf8"));
const rounded = (n: number) => Math.round(n * 1e4) / 1e4;

// Independently calculated from the forms; no snapshot capture. See the linked verification note.
for (const c of fixture.cases) {
  test(`Quebec living-alone golden: ${c.id}`, () => {
    const y = loadYear(c.year);
    const p = y.provinces.find(p => p.code === "QC");
    assert.ok(p);
    const h = household(y, p, {
      ...defaults,
      people: [{ ...blank(0), ...c.person }],
      kids: c.kids ?? 0,
      under6: c.kids ?? 0,
      childcare: c.childcare,
    });
    assert.deepEqual(
      {
        line275: rounded(h.list[0].tiP),
        amount: rounded(h.claim?.pAmt ?? 0),
        credit: rounded(h.list[0].pSpFull),
        applied: rounded(h.list[0].pSp),
      },
      c.expected,
    );
  });
}

test("Quebec living-alone eligibility still requires one adult and enabled personal credits", () => {
  const y = loadYear(2025);
  const p = y.provinces.find(p => p.code === "QC");
  assert.ok(p);
  for (const input of [
    { people: [blank(48_000)], useBpa: false },
    { people: [blank(48_000), blank(48_000)], adults: 2, spouse: false },
    { people: [blank(48_000), blank(48_000)], adults: 2, spouse: true },
  ]) {
    const h = household(y, p, { ...defaults, ...input });
    assert.equal(h.list[0].pSpFull, 0);
    assert.notEqual(h.claim?.kind, "alone");
  }
});

test("federal childcare never reduces the Schedule B income base", () => {
  for (const year of [2025, 2026]) {
    const y = loadYear(year);
    const p = y.provinces.find(p => p.code === "QC");
    assert.ok(p);
    const input = { ...defaults, people: [blank(48_000)], kids: 1, under6: 1 };
    const no = household(y, p, input);
    const withChildcare = household(y, p, {
      ...input,
      childcare: {
        mode: "automatic",
        children: [{ age: 3, expenses: 8000, qcEligibleExpenses: 8000 }],
        earnedIncome: [48_000],
      },
    });
    assert.equal(withChildcare.list[0].ti, no.list[0].ti - 8000);
    assert.equal(withChildcare.claim?.pAmt, no.claim?.pAmt);
    assert.equal(withChildcare.list[0].pSpFull, no.list[0].pSpFull);
  }
});
