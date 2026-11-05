import assert from "node:assert/strict";
import test from "node:test";
import { loadYear } from "../src/data/load.ts";
import { blank, type Person } from "../src/engine/types.ts";
import { portfolioAssumptions } from "../src/ui/portfolio.ts";
import { normalizeRetirement, withRetirement } from "../src/ui/retirement.ts";
import { normalizeScenario, readScenario, scenarioHash } from "../src/ui/scenario-url.ts";
import {
  normalizePublicPensions,
  publicPensionGate,
  publicPensionYears,
  withSeniorIncome,
} from "../src/ui/senior-income.ts";

const context = {
  years: [2024, 2025, 2026],
  provinces: ["ON", "AB", "QC"],
  treatyRate: () => 0.15,
  portfolioDefaults: portfolioAssumptions([loadYear(2026)]),
};

test("both public pension fields and existing birthdays round-trip for both adults, including false and zero", () => {
  for (const oas of [true, false]) {
    const people = [
      { ...blank(0), oth: 30000, oas, cppQpp: 12345.67 },
      { ...blank(0), oas: !oas, cppQpp: 0 },
    ];
    const input = {
      year: 2025,
      people,
      retirement: [
        { birthYear: 1950, birthMonth: 6 },
        { birthYear: 1960, birthMonth: 12 },
      ],
    };
    const state = normalizeScenario(input, context);
    assert.deepEqual(state.people, people);
    assert.deepEqual(readScenario(scenarioHash(input, context), context), state);
    assert.deepEqual(normalizeScenario(state, context), state);
  }
});

test("pre-18 URLs and saved states do not infer OAS or CPP/QPP from Other income, age or pension receipts", () => {
  for (const year of context.years) {
    const input = {
      v: 3,
      year,
      people: [{ ...blank(0), oth: 40000, retirementIncome: [{ type: "rppLifetime", amount: 1000 }] }],
      retirement: [{ birthYear: 1950, birthMonth: 6 }],
    };
    const hash = `#s=1&year=${year}&people=${encodeURIComponent(JSON.stringify(input.people))}&retirement=${encodeURIComponent(JSON.stringify(input.retirement))}`;
    assert.deepEqual(readScenario(hash, context), normalizeScenario(input, context));
    assert.deepEqual(normalizeScenario(input, context).people, input.people);
    assert.doesNotMatch(scenarioHash(input, context), /oas|cppQpp/);
  }
});

test("normalization rejects malformed public pensions while preserving independent valid fields", () => {
  for (const oas of [undefined, null, 0, 1, "true", [], {}])
    assert.deepEqual(normalizePublicPensions({ oas, cppQpp: 10 }), { cppQpp: 10 });
  for (const cppQpp of [undefined, null, -1, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1, "100", [], {}])
    assert.deepEqual(normalizePublicPensions({ oas: false, cppQpp }), { oas: false });
  assert.deepEqual(normalizePublicPensions({ oas: true, cppQpp: 0 }), { oas: true, cppQpp: 0 });
  const state = normalizeScenario({ people: [{ oas: "true", cppQpp: -1 }] }, context);
  assert.equal(Object.hasOwn((state.people as Person[])[0], "oas"), false);
  assert.equal(Object.hasOwn((state.people as Person[])[0], "cppQpp"), false);
});

test("unsupported years and incomplete dates gate only new pension inputs, preserving drafts and legacy income", () => {
  const person = { ...blank(0), oth: 40000, oas: true, cppQpp: 10000 };
  const birth = normalizeRetirement({ birthYear: 1950, birthMonth: 6 });
  const years = context.years.map(loadYear);
  assert.deepEqual(publicPensionYears(years), [2025, 2026]);
  assert.deepEqual(withSeniorIncome(person, years[0]), { ...blank(0), oth: 40000 });
  assert.match(publicPensionGate([person], years[0], [2025, 2026]), /2025 and 2026 only.*2024 results exclude/);
  for (const data of years.slice(1)) {
    assert.deepEqual(withSeniorIncome(person, data), { ...blank(0), oth: 40000, cppQpp: 10000 });
    assert.match(publicPensionGate([person], data, [2025, 2026]), /Enter both birth year and month/);
    const applied = withRetirement(person, birth, data);
    assert.deepEqual(withSeniorIncome(applied, data), applied);
    assert.equal(publicPensionGate([applied], data, [2025, 2026]), "");
    assert.deepEqual(withSeniorIncome({ ...person, oas: false }, data), { ...person, oas: false });
  }
  assert.equal(person.oas, true);
  assert.equal(person.cppQpp, 10000);
});
