import assert from "node:assert/strict";
import test from "node:test";
import { loadYear } from "../src/data/load.ts";
import { blank, type Person, type RetirementReceipt } from "../src/engine/types.ts";
import { portfolioAssumptions } from "../src/ui/portfolio.ts";
import { normalizeRetirement, withRetirement } from "../src/ui/retirement.ts";
import { normalizeScenario, readScenario, scenarioHash } from "../src/ui/scenario-url.ts";
import { normalizeReceipts, seniorGate, withSeniorIncome } from "../src/ui/senior-income.ts";

const context = {
  years: [2024, 2025, 2026],
  provinces: ["ON", "AB", "QC"],
  treatyRate: () => 0.15,
  portfolioDefaults: portfolioAssumptions([loadYear(2026)]),
};
const receipts: RetirementReceipt[] = [
  { type: "rppLifetime", amount: 10000.25 },
  { type: "rrif", amount: 3000, survivorEligible: false },
  { type: "rrif", amount: 2000, survivorEligible: true },
  { type: "rrspAnnuity", amount: 2000, survivorEligible: false },
  { type: "rrspAnnuity", amount: 3000, survivorEligible: true },
  { type: "rrspWithdrawal", amount: 0 },
];
test("all receipt fields, duplicate types and both adults round-trip without moving other income", () => {
  const input = {
    year: 2025,
    people: [
      { ...blank(0), oth: 30000, retirementIncome: receipts },
      { ...blank(0), retirementIncome: receipts.slice().reverse() },
    ],
    retirement: [
      { birthYear: 1960, birthMonth: 12 },
      { birthYear: 1950, birthMonth: 1 },
    ],
  };
  const state = normalizeScenario(input, context);
  assert.deepEqual(readScenario(scenarioHash(input, context), context), state);
  assert.deepEqual((state.people as Person[])[0].retirementIncome, receipts);
  assert.equal((state.people as Person[])[0].oth, 30000);
  assert.deepEqual(normalizeScenario(state, context), state, "saved-state normalization is idempotent");
});

test("pre-17 URLs and saved states retain ordinary pensions and omit every new receipt field", () => {
  const people = [{ ...blank(0), oth: 40000 }];
  for (const year of context.years) {
    const old = { year, people, retirement: [{ birthYear: 1960, birthMonth: 6 }] };
    const hash = `#s=1&year=${year}&people=${encodeURIComponent(JSON.stringify(people))}&retirement=${encodeURIComponent(JSON.stringify(old.retirement))}`;
    assert.deepEqual(readScenario(hash, context), normalizeScenario(old, context));
    assert.deepEqual(readScenario(hash, context)?.people as Person[], people);
    assert.equal(scenarioHash(old, context).includes("retirementIncome"), false);
  }
});

test("malformed receipts cannot activate invalid engine paths in either migration", () => {
  for (const invalid of [
    undefined,
    null,
    {},
    "pension",
    [],
    [{ type: "unknown", amount: 10 }],
    [{ type: ["rrif"], amount: 10 }],
    [{ type: { toString: "rrif" }, amount: 10 }],
    [{ type: "rrif", amount: -1 }],
    [{ type: "rrif", amount: Infinity }],
  ])
    assert.equal(normalizeReceipts(invalid), undefined);
  assert.deepEqual(
    normalizeReceipts([
      { type: "rppLifetime", amount: 10, survivorEligible: true },
      { type: "rrspWithdrawal", amount: 20, survivorEligible: false },
      { type: "rrif", amount: 30, survivorEligible: "yes", extra: "ignored" },
    ]),
    [
      { type: "rppLifetime", amount: 10 },
      { type: "rrspWithdrawal", amount: 20 },
      { type: "rrif", amount: 30 },
    ],
  );
});

test("incomplete age and unsupported years keep receipts saved but omit unsupported engine inputs", () => {
  const person = { ...blank(0), retirementIncome: receipts };
  const birth = normalizeRetirement({ birthYear: 1960, birthMonth: 12 });
  const older = withSeniorIncome(withRetirement(person, birth, loadYear(2024)), loadYear(2024));
  assert.deepEqual(older, blank(0));
  assert.equal(person.retirementIncome, receipts);
  assert.match(seniorGate([person], loadYear(2024), [2025, 2026], true), /2025 and 2026 only/);
  const noAge = withSeniorIncome(person, loadYear(2025));
  assert.deepEqual(noAge.retirementIncome, [receipts[0], receipts[2], receipts[4], receipts[5]]);
  for (const year of [2025, 2026]) {
    const applied = withSeniorIncome(withRetirement(person, birth, loadYear(year)), loadYear(year));
    assert.equal(applied.age, year - 1960);
    assert.equal(applied.birthMonth, 12);
    assert.deepEqual(applied.retirementIncome, receipts);
  }
});
