import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { loadYear } from "../src/data/load.ts";
import { compute, household } from "../src/engine/household.ts";
import { blank, type Household, type Person } from "../src/engine/types.ts";

const fixture: {
  defaults: Omit<Household, "people">;
  cases: {
    id: string;
    year: number;
    province: string;
    household: Omit<Partial<Household>, "people"> & { people: Partial<Person>[] };
    expected: Record<string, number>;
  }[];
} = JSON.parse(fs.readFileSync(new URL("./golden/features/claimants.json", import.meta.url), "utf8"));

test("claimant feature IDs are unique and provisional 2026 rules are marked as estimates", () => {
  assert.equal(new Set(fixture.cases.map(c => c.id)).size, fixture.cases.length);
  for (const year of [2025, 2026]) {
    const provinces = loadYear(year).provinces.filter(p => p.claimants);
    assert.deepEqual(provinces.map(p => p.code).sort(), ["NB", "NL", "NS", "NU", "PE", "SK"]);
    for (const p of provinces)
      for (const rule of Object.values(p.claimants ?? {})) assert.equal(rule.estimated ?? false, year === 2026);
  }
});

for (const c of fixture.cases) {
  test(`claimant golden: ${c.id}`, () => {
    const y = loadYear(c.year);
    const p = y.provinces.find(p => p.code === c.province);
    assert.ok(p);
    const hh = { ...fixture.defaults, ...c.household, people: c.household.people.map(x => ({ ...blank(0), ...x })) };
    const result = compute(y, p, hh);
    for (const [path, expected] of Object.entries(c.expected)) {
      let value: unknown = result;
      for (const key of path.split(".")) {
        assert.ok(value && typeof value === "object" && key in value, path);
        value = (value as Record<string, unknown>)[key];
      }
      assert.equal(typeof value, "number", path);
      assert.ok(Math.abs((value as number) - expected) < 1e-8, `${path}: ${value} != ${expected}`);
    }
    // Reversing spouses may change the legal tie election, but cannot change total household tax.
    if (hh.spouse && hh.people.length === 2) {
      const reversed = household(y, p, { ...hh, people: [...hh.people].reverse() });
      assert.ok(Math.abs(reversed.total - household(y, p, hh).total) < 1e-8);
    }
  });
}
