// Additive feature goldens. Expected values and their input cases are committed independently of the engine;
// this runner has no capture/update mode. Preserve the legacy suite and these cases when adding a feature.
import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { loadYear } from "../src/data/load.ts";
import { type FuelRate, provinceSchema } from "../src/data/schema.ts";
import { blank, compute, type Household, type Person, ratePeriods, yearAverage } from "../src/engine/index.ts";

interface FeatureCase {
  id: string;
  year: number;
  province: string;
  rule?: string;
  household: Omit<Partial<Household>, "people"> & { people: Partial<Person>[] };
  expected: Record<string, unknown>;
}
const fixture: {
  defaults: Omit<Household, "people">;
  rules: Record<string, object>;
  cases: FeatureCase[];
  ratePeriodCases: { id: string; year: number; rates: FuelRate; expected: unknown }[];
} = JSON.parse(fs.readFileSync(new URL("./golden/features/coverage.json", import.meta.url), "utf8"));
const childcareFixture: typeof fixture = JSON.parse(
  fs.readFileSync(new URL("./golden/features/childcare.json", import.meta.url), "utf8"),
);
const history2024Fixture: typeof fixture = JSON.parse(
  fs.readFileSync(new URL("./golden/features/history2024.json", import.meta.url), "utf8"),
);
const history2023Fixture: typeof fixture = JSON.parse(
  fs.readFileSync(new URL("./golden/features/history2023.json", import.meta.url), "utf8"),
);
const history2022Fixture: typeof fixture = JSON.parse(
  fs.readFileSync(new URL("./golden/features/history2022.json", import.meta.url), "utf8"),
);
const history2021Fixture: typeof fixture = JSON.parse(
  fs.readFileSync(new URL("./golden/features/history2021.json", import.meta.url), "utf8"),
);
const history2020Fixture: typeof fixture = JSON.parse(
  fs.readFileSync(new URL("./golden/features/history2020.json", import.meta.url), "utf8"),
);
const fixtures = [
  fixture,
  childcareFixture,
  history2024Fixture,
  history2023Fixture,
  history2022Fixture,
  history2021Fixture,
  history2020Fixture,
];

function rounded(value: unknown): unknown {
  if (typeof value === "number") {
    assert.ok(Number.isFinite(value), "feature results must be finite");
    return Math.round(value * 1e4) / 1e4;
  }
  if (Array.isArray(value)) return value.map(rounded);
  if (value && typeof value === "object")
    return Object.fromEntries(Object.entries(value).map(([key, v]) => [key, rounded(v)]));
  return value;
}

function atPath(value: unknown, path: string): unknown {
  for (const key of path.split(".")) {
    assert.ok(value !== null && typeof value === "object" && key in value, `missing output ${path}`);
    value = (value as Record<string, unknown>)[key];
  }
  return value;
}

test("feature golden cases have unique names, known rules and nonempty assertions", () => {
  assert.ok(fixture.cases.length > 0);
  const cases = fixtures.flatMap(f => [...f.cases, ...f.ratePeriodCases]);
  assert.equal(new Set(cases.map(c => c.id)).size, cases.length);
  for (const fixture of fixtures)
    for (const c of fixture.cases) {
      assert.ok(c.id.length > 0);
      assert.ok(Object.keys(c.expected).length > 0, c.id);
      if (c.rule) assert.ok(Object.hasOwn(fixture.rules, c.rule), `${c.id}: unknown rule ${c.rule}`);
    }
});

for (const fixture of fixtures)
  for (const c of fixture.cases) {
    test(`feature golden: ${c.id}`, () => {
      const data = loadYear(c.year);
      const base = data.provinces.find(p => p.code === c.province);
      assert.ok(base, c.province);
      // Historical rule specimens explicitly override only the relevant program. They are not 2024 tax returns.
      const province = provinceSchema.parse({ ...base, ...(c.rule ? fixture.rules[c.rule] : {}) });
      const household: Household = {
        ...fixture.defaults,
        ...c.household,
        people: c.household.people.map(p => ({ ...blank(0), ...p })),
      };
      const result = compute(data, province, household);
      for (const [path, expected] of Object.entries(c.expected))
        assert.deepStrictEqual(rounded(atPath(result, path)), expected, `${c.id}: ${path}`);
    });
  }

for (const fixture of fixtures)
  for (const c of fixture.ratePeriodCases) {
    test(`feature golden: ${c.id}`, () => {
      assert.deepStrictEqual(
        rounded({ average: yearAverage(c.rates, c.year), periods: ratePeriods(c.rates, c.year) }),
        c.expected,
      );
    });
  }
