import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { loadYear } from "../src/data/load.ts";
import { blank, type Household, household, type Person } from "../src/engine/index.ts";

// Independently calculated additions for #206; no capture mode or engine-derived expectations.
const fixture: {
  defaults: Omit<Household, "people">;
  cases: {
    id: string;
    year: number;
    province: string;
    household: Omit<Partial<Household>, "people"> & { people: Partial<Person>[] };
    expected: Record<string, number>;
    expectedCredits?: Record<string, number>;
  }[];
} = JSON.parse(fs.readFileSync(new URL("./golden/features/senior-audit.json", import.meta.url), "utf8"));
const years = [loadYear(2025), loadYear(2026)];
for (const c of fixture.cases) {
  test(`senior audit: ${c.id}`, () => {
    const y = years.find(y => y.year === c.year);
    assert.ok(y);
    const p = y.provinces.find(p => p.code === c.province);
    assert.ok(p);
    const result = household(y, p, {
      ...fixture.defaults,
      adults: c.household.people.length,
      ...c.household,
      people: c.household.people.map(x => ({ ...blank(0), ...x })),
    });
    for (const [path, expected] of Object.entries(c.expected)) {
      let actual: unknown = result;
      for (const key of path.split(".")) {
        assert.ok(actual && typeof actual === "object" && key in actual, path);
        actual = (actual as Record<string, unknown>)[key];
      }
      assert.equal(typeof actual, "number");
      assert.ok(Math.abs((actual as number) - expected) < 1e-8, `${path}: ${actual} != ${expected}`);
    }
    for (const [name, expected] of Object.entries(c.expectedCredits ?? {})) {
      const actual = result.credits.find(([label]) => label === name)?.[1] ?? 0;
      assert.ok(Math.abs(actual - expected) < 1e-8, `${name}: ${actual} != ${expected}`);
    }
  });
}

test("senior audit cases have unique IDs and independently cover both supported years", () => {
  assert.equal(new Set(fixture.cases.map(c => c.id)).size, fixture.cases.length);
  assert.deepEqual(new Set(fixture.cases.map(c => c.year)), new Set([2025, 2026]));
});
