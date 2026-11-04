import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { loadYear } from "../src/data/load.ts";
import { compute, household } from "../src/engine/household.ts";
import { blank, type Household, type Person } from "../src/engine/types.ts";
import { DEFAULT_INCOME, spendEst } from "../src/ui/defaults.ts";
import { footerNotes } from "../src/ui/notes.ts";
import { formReturns } from "./claimants-forms.ts";

interface Feature {
  id: string;
  year: number;
  household: Omit<Partial<Household>, "people"> & { people: Partial<Person>[] };
  childcareClaims?: number[];
  expected: Record<string, number>;
}
const fixture: { defaults: Omit<Household, "people">; cases: Feature[] } = JSON.parse(
  fs.readFileSync(new URL("./golden/features/pei-young-children.json", import.meta.url), "utf8"),
);
const input = (c: Feature): Household => ({
  ...fixture.defaults,
  ...c.household,
  people: c.household.people.map(p => ({ ...blank(0), ...p })),
});
const near = (actual: number, expected: number, label: string) =>
  assert.ok(Math.abs(actual - expected) < 1e-7, `${label}: ${actual} != ${expected}`);

test("PE young-child golden IDs are unique; 2026 amount and claimant continuation are marked", () => {
  assert.equal(new Set(fixture.cases.map(c => c.id)).size, fixture.cases.length);
  for (const c of fixture.cases) assert.ok(Object.keys(c.expected).length > 0);
  for (const year of [2025, 2026]) {
    const p = loadYear(year).provinces.find(p => p.code === "PE");
    assert.ok(p?.childAmount);
    assert.equal(p.childAmount.perChild, 1200);
    assert.equal(p.childAmount.ages, "under6");
    assert.equal(p.childAmount.estimated ?? false, year === 2026);
    assert.deepEqual(p.claimants?.childAmount, {
      claimant: "lower-net-income",
      transfer: "none",
      ...(year === 2026 ? { estimated: true } : {}),
    });
  }
});

for (const c of fixture.cases) {
  test(`PE young-child golden: ${c.id}`, () => {
    const y = loadYear(c.year);
    const p = y.provinces.find(p => p.code === "PE");
    assert.ok(p);
    const hh = input(c);
    const result = compute(y, p, hh);
    for (const [path, expected] of Object.entries(c.expected)) {
      let actual: unknown = result;
      for (const key of path.split(".")) {
        assert.ok(actual !== null && typeof actual === "object" && key in actual, path);
        actual = (actual as Record<string, unknown>)[key];
      }
      assert.equal(typeof actual, "number", path);
      near(actual as number, expected, path);
    }
    // The independent return worksheet has no childcare algorithm. These verified claims enter line 21400
    // as deductions; ages supply the existing annual child counts, not monthly eligibility.
    const formInput = {
      ...hh,
      childcare: undefined,
      kids: hh.childcare?.children?.filter(c => c.age < 18).length ?? hh.kids,
      under6: hh.childcare?.children?.filter(c => c.age < 6).length ?? hh.under6,
      people: hh.people.map((person, i) => ({ ...person, ded: person.ded + (c.childcareClaims?.[i] ?? 0) })),
    };
    const legal = formReturns(c.year, "PE", formInput);
    near(
      result.prov,
      legal[0].reduce((sum, r) => sum + r.prov, 0),
      "independent PE428",
    );
    if (hh.people.length === 2) {
      const reversed = household(y, p, {
        ...hh,
        people: [...hh.people].reverse(),
        childcare: hh.childcare
          ? { ...hh.childcare, manualClaims: hh.childcare.manualClaims?.toReversed() }
          : undefined,
      });
      near(reversed.total, household(y, p, hh).total, "spouse order");
    }
  });
}

test("PE size and claimant checks reject omission, higher-income claims and unused-child transfers", () => {
  for (const year of [2025, 2026]) {
    const y = loadYear(year);
    const p = y.provinces.find(p => p.code === "PE");
    assert.ok(p?.claimants?.childAmount);
    const caseInput = (id: string) => {
      const c = fixture.cases.find(c => c.id === `${year}-${id}`);
      assert.ok(c);
      return input(c);
    };
    const size = caseInput("size-check");
    const omitted = { ...p, childAmount: undefined };
    near(compute(y, omitted, size).total - compute(y, p, size).total, 114, "annual savings");
    near((114 / 60000) * 100, 0.19, "percentage points");
    const zero = caseInput("zero-income-no-transfer");
    near(household(y, p, zero).prov, household(y, omitted, zero).prov, "zero-income spouse cannot use credit");
    const wrongOwner = { ...p, claimants: { ...p.claimants, childAmount: undefined } };
    assert.ok(household(y, wrongOwner, zero).prov < household(y, p, zero).prov);
    const wrongTransfer = structuredClone(p);
    assert.ok(wrongTransfer.claimants?.childAmount);
    wrongTransfer.claimants.childAmount.transfer = "schedule-2";
    assert.ok(household(y, wrongTransfer, zero).prov < household(y, p, zero).prov);
    const tied = household(y, p, caseInput("tie-dividends"));
    assert.equal(tied.list[0].kidAmt, 0);
    assert.equal(tied.list[1].kidAmt, 1200);
    const age5 = household(y, p, caseInput("age-5"));
    const age6 = household(y, p, caseInput("age-6"));
    near(age6.prov - age5.prov, 114, "annual age cutoff");
  }
});

test("PE notes explain annual approximation, provisional amounts and the historical coverage gap", () => {
  for (const year of [2025, 2026]) {
    const y = loadYear(year);
    const page = { defaultIncome: DEFAULT_INCOME, spendEst };
    const notes = footerNotes(y, page);
    assert.match(notes, /worth up to \$114 in tax savings per child/);
    assert.match(notes, /Unused amounts do not transfer/);
    assert.match(notes, /does not prorate for births, birthdays or residence changes/);
    assert.match(notes, /claimant-coverage step at 2025/);
    assert.equal(notes.includes("amount and rules provisionally continue"), year === 2026);
    const p = y.provinces.find(p => p.code === "PE");
    assert.ok(p?.childAmount);
    p.childAmount.perChild = 2400;
    assert.match(footerNotes(y, page), /worth up to \$228 in tax savings per child/);
  }
  for (let year = 2019; year <= 2024; year++) {
    const p = loadYear(year).provinces.find(p => p.code === "PE");
    assert.deepEqual(p?.childAmount, { perChild: 1200, ages: "under6" }, `${year}: existing amount retained`);
    assert.equal(p?.claimants?.childAmount, undefined, `${year}: claimant follow-up remains separate`);
  }
});
