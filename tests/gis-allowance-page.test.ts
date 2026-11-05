import assert from "node:assert/strict";
import test from "node:test";
import { loadYear } from "../src/data/load.ts";
import { blank, type Person } from "../src/engine/types.ts";
import { portfolioAssumptions } from "../src/ui/portfolio.ts";
import { normalizeRetirement, withRetirement } from "../src/ui/retirement.ts";
import { normalizeScenario, readScenario, scenarioHash } from "../src/ui/scenario-url.ts";
import { normalizeSeniorBenefits, seniorBenefitGate } from "../src/ui/senior-benefits.ts";
import { withSeniorIncome } from "../src/ui/senior-income.ts";

const context = {
  years: [2024, 2025, 2026],
  provinces: ["ON", "QC", "AB"],
  treatyRate: () => 0.15,
  portfolioDefaults: portfolioAssumptions([loadYear(2026)]),
};
const birth = { birthYear: 1950, birthMonth: 6 };

test("GIS and Allowance independently preserve omission, false and true for both adults in URL and save migration", () => {
  for (const gis of [undefined, false, true])
    for (const allowance of [undefined, false, true]) {
      const flags = { ...(gis === undefined ? {} : { gis }), ...(allowance === undefined ? {} : { allowance }) };
      const input = {
        year: 2025,
        people: [
          { ...blank(0), ...flags },
          { ...blank(0), ...flags },
        ],
        retirement: [birth, birth],
      };
      const state = normalizeScenario(input, context);
      assert.deepEqual(state.people, input.people);
      assert.deepEqual(readScenario(scenarioHash(input, context), context), state);
      assert.deepEqual(normalizeScenario(state, context), state);
    }
});

test("pre-19 URLs and saved states retain all existing pension fields without adding benefits", () => {
  const people = [
    { ...blank(0), oth: 40000, oas: true, cppQpp: 10000, retirementIncome: [{ type: "rppLifetime", amount: 1000 }] },
  ];
  for (const year of context.years) {
    const input = { year, people, retirement: [birth] };
    const hash = `#s=1&year=${year}&people=${encodeURIComponent(JSON.stringify(people))}&retirement=${encodeURIComponent(JSON.stringify([birth]))}`;
    assert.deepEqual(readScenario(hash, context), normalizeScenario(input, context));
    assert.deepEqual(normalizeScenario(input, context).people, people);
    assert.equal(scenarioHash(input, context).includes("gis"), false);
    assert.equal(scenarioHash(input, context).includes("allowance"), false);
  }
});

test("malformed opt-ins are ignored by both migration paths", () => {
  for (const value of [null, 0, 1, "true", "false", [], {}, Infinity]) {
    assert.deepEqual(normalizeSeniorBenefits({ gis: value, allowance: value }), {});
    const input = { people: [{ ...blank(0), gis: value, allowance: value }] };
    assert.deepEqual(normalizeScenario(input, context).people, [blank(0)]);
    const hash = `#s=1&people=${encodeURIComponent(JSON.stringify(input.people))}`;
    assert.deepEqual(readScenario(hash, context)?.people, [blank(0)]);
  }
});

test("unsupported years strip even false; incomplete dates exclude true flags without changing saved drafts", () => {
  for (const value of [true, false]) {
    const person = { ...blank(0), gis: value, allowance: value };
    assert.deepEqual(withSeniorIncome(person, loadYear(2024)), blank(0));
    assert.match(seniorBenefitGate([person], loadYear(2024), [2025, 2026]), /2025 and 2026 only.*2024 results exclude/);
    for (const year of [2025, 2026]) {
      for (const partial of [{}, { birthYear: 1950 }, { birthMonth: 6 }]) {
        const draft = withRetirement(person, normalizeRetirement(partial), loadYear(year));
        assert.deepEqual(withSeniorIncome(draft, loadYear(year)), value ? blank(0) : person);
      }
      const complete = withSeniorIncome(
        withRetirement(person, normalizeRetirement(birth), loadYear(year)),
        loadYear(year),
      );
      assert.equal(complete.age, year - birth.birthYear);
      assert.equal(complete.gis, value);
      assert.equal(complete.allowance, value);
      assert.equal(person.gis, value);
    }
  }
  const independent: Person = { ...blank(0), gis: false, allowance: true };
  assert.deepEqual(withSeniorIncome(independent, loadYear(2025)), { ...blank(0), gis: false });
});
