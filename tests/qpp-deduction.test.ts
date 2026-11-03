import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { loadYear } from "../src/data/load.ts";
import { blank, compute, type Household, netIncomeParts, netOf, type Person } from "../src/engine/index.ts";

const fixture: {
  plan: { exempt: number; ympe: number; yampe: number; enh1: number; enh2: number };
  cases: {
    id: string;
    province: string;
    people: Partial<Person>[];
    childcare?: Household["childcare"];
    expected: Record<string, unknown>;
  }[];
} = JSON.parse(fs.readFileSync(new URL("./golden/features/qpp-deduction.json", import.meta.url), "utf8"));

function atPath(value: unknown, path: string): unknown {
  for (const key of path.split(".")) {
    assert.ok(value !== null && typeof value === "object" && key in value, `missing ${path}`);
    value = (value as Record<string, unknown>)[key];
  }
  return value;
}

function rounded(value: unknown): unknown {
  if (typeof value === "number") return Math.round(value * 1e4) / 1e4;
  if (Array.isArray(value)) return value.map(rounded);
  return value;
}

// Synthetic QPP parameters intentionally differ from CPP. These are independently calculated rule specimens,
// not published tax returns. Derivations and the changed caller paths are in docs/verification/84-qpp-deduction.md.
for (const c of fixture.cases) {
  test(`QPP deduction golden: ${c.id}`, () => {
    const y = loadYear(2026);
    Object.assign(y.federal.payroll.qpp, fixture.plan);
    const p = y.provinces.find(p => p.code === c.province);
    assert.ok(p);
    const hh: Household = {
      people: c.people.map(p => ({ ...blank(0), ...p })),
      active: 0,
      adults: c.people.length,
      spouse: true,
      kids: 1,
      under6: 1,
      useBpa: true,
      useCredits: true,
      whRate: 0,
      homeValue: 0,
      rent: 0,
      monthlySpending: 0,
      childcare: c.childcare,
    };
    const result = compute(y, p, hh);
    for (const [path, expected] of Object.entries(c.expected))
      assert.deepEqual(rounded(atPath(result, path)), expected, `${c.id}: ${path}`);
    for (const person of result.list)
      assert.equal(person.breakdown.netIncome.enh, person.pay.enh, "deduct the plan actually charged");
  });
}

test("loaded years have matching enhanced plan parameters, preserving existing golden results", () => {
  for (let year = 2019; year <= 2026; year++) {
    const { cpp, qpp } = loadYear(year).federal.payroll;
    for (const key of ["exempt", "ympe", "yampe", "enh1", "enh2"] as const)
      assert.equal(qpp[key], cpp[key], `${year}: ${key}`);
  }
});

test("net income deducts both enhanced QPP tiers alongside ordinary and childcare deductions", () => {
  const y = loadYear(2026);
  const qc = y.provinces.find(p => p.code === "QC");
  assert.ok(qc);
  y.federal.payroll.qpp.enh1 = 0.02;
  y.federal.payroll.qpp.enh2 = 0.06;
  const person = { ...blank(80_000), oth: 1000, ded: 2000 };
  // QPP: (74,600 - 3,500) * 2% + (80,000 - 74,600) * 6% = 1,746.
  // CPP: the same earnings at 1% and 4% = 927. Other income does not attract either contribution.
  assert.equal(netIncomeParts(y.federal, qc, person, 1000).enh, 1746);
  assert.equal(netIncomeParts(y.federal, null, person, 1000).enh, 927);
  assert.equal(netOf(y.federal, qc, person, 1000), 76_254);
  assert.equal(netOf(y.federal, null, person, 1000), 77_073);
  assert.equal(netOf(y.federal, qc, { ...person, ded: 100_000 }), 0);
});
