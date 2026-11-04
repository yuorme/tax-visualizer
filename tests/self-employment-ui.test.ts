import assert from "node:assert/strict";
import { test } from "node:test";
import { listYears, loadCpi, loadYear } from "../src/data/load.ts";
import { blank, type Household } from "../src/engine/types.ts";
import { ChildcareModel } from "../src/ui/childcare.ts";
import { footerNotes, retirementTooltips, tooltips } from "../src/ui/notes.ts";
import { portfolioAssumptions } from "../src/ui/portfolio.ts";
import { normalizeRetirement, retirementHistory, withRetirement } from "../src/ui/retirement.ts";
import { normalizeScenario, readScenario, scenarioHash } from "../src/ui/scenario-url.ts";
import {
  childcareEarnings,
  parseSelfEmployment,
  selfEmploymentGate,
  selfEmploymentYears,
  validSelfEmployment,
  withSelfEmployment,
} from "../src/ui/self-employment.ts";

const years = listYears().map(loadYear);
const context = {
  years: listYears(),
  provinces: ["ON", "QC", "AB"],
  treatyRate: () => 0.15,
  portfolioDefaults: portfolioAssumptions(years),
};

test("business drafts distinguish omitted, zero, decimal profit and malformed input", () => {
  assert.equal(parseSelfEmployment("  "), undefined);
  assert.equal(parseSelfEmployment("0"), 0);
  assert.equal(parseSelfEmployment("$75,000.25"), 75000.25);
  for (const value of ["-1", "NaN", "Infinity", "1e3", "1,2", "100.001", "<script>"])
    assert.equal(parseSelfEmployment(value), null, value);
  for (const value of [null, "300", -1, Infinity, NaN, 1e100, {}, []]) assert.equal(validSelfEmployment(value), false);
});

test("version 1 URLs and saved-state normalization retain each adult's profit without migrating wages", () => {
  for (const selfEmployment of [undefined, 0, 75000.25]) {
    const people = [
      { ...blank(30000), ...(selfEmployment === undefined ? {} : { selfEmployment }) },
      { ...blank(10000), selfEmployment: 15000 },
    ];
    const restored = readScenario(scenarioHash({ year: 2025, people }, context), context);
    assert.deepEqual(restored?.people, people);
  }
  for (const bad of [null, "75000", -1, {}, [], Infinity, 1e100]) {
    const state = normalizeScenario({ people: [{ ord: 30000, selfEmployment: bad }] }, context);
    assert.deepEqual(state.people, [blank(30000)]);
  }
  assert.equal(
    scenarioHash({ year: 2025, people: [blank(30000)] }, context),
    "#s=1&year=2025&people=%5B%7B%22ord%22%3A30000%7D%5D",
  );
});

test("year gating is data-driven, retains drafts, and omits even explicit zero only in unsupported years", () => {
  assert.deepEqual(selfEmploymentYears(years), [2025, 2026]);
  const ordinary = blank(30000);
  for (const data of years) {
    assert.equal(withSelfEmployment(ordinary, data), ordinary);
    for (const amount of [0, 75000]) {
      const draft = { ...ordinary, selfEmployment: amount };
      assert.equal(
        withSelfEmployment(draft, data).selfEmployment,
        data.federal.payroll.selfEmployment ? amount : undefined,
      );
      assert.equal(draft.selfEmployment, amount);
    }
  }
  const changed = structuredClone(loadYear(2025));
  delete changed.federal.payroll.selfEmployment;
  assert.equal(withSelfEmployment({ ...ordinary, selfEmployment: 0 }, changed).selfEmployment, undefined);
  assert.match(selfEmploymentGate([{ ...ordinary, selfEmployment: 0 }], changed, [2026]), /2026 only/);
});

test("only the unsupported employee CPP election is omitted for a business-only earner", () => {
  const person = {
    ...blank(0),
    selfEmployment: 75000,
    employeePayroll: {
      cppElection: { stop: { year: 2025, month: 6 } },
      qppElection: { stop: { year: 2025, month: 7 } },
    },
  };
  const applied = withSelfEmployment(person, loadYear(2025));
  assert.equal(applied.employeePayroll?.cppElection, undefined);
  assert.deepEqual(applied.employeePayroll?.qppElection, person.employeePayroll.qppElection);
  assert.ok(person.employeePayroll.cppElection);
  assert.match(selfEmploymentGate([blank(0), person], loadYear(2025), [2025, 2026]), /your partner/);
  const mixed = { ...person, ord: 1 };
  assert.equal(withSelfEmployment(mixed, loadYear(2025)), mixed);
  const zero = { ...person, selfEmployment: 0 };
  assert.equal(withSelfEmployment(zero, loadYear(2025)), zero);
});

test("business history filters before computing and preserves each row's age and the entry-age guard", () => {
  const entry = normalizeRetirement({ birthYear: 2007, birthMonth: 6 });
  const inputFor = (data: ReturnType<typeof loadYear>): Household => ({
    people: [withSelfEmployment(withRetirement({ ...blank(0), selfEmployment: 75000 }, entry, data), data)],
    active: 0,
    spouse: false,
    adults: 1,
    kids: 0,
    under6: 0,
    useBpa: true,
    whRate: 0.15,
    useCredits: true,
    homeValue: 0,
    rent: 0,
    monthlySpending: 0,
  });
  const nominal = retirementHistory(years, loadCpi(), [entry], inputFor, "ON", "nominal", true);
  assert.deepEqual(
    nominal.rows.map(r => r.year),
    [2026],
  );
  assert.deepEqual(nominal.young, [2025]);
  assert.deepEqual(nominal.noSelfEmploymentData, [2019, 2020, 2021, 2022, 2023, 2024]);
  assert.equal(retirementHistory(years, loadCpi(), [entry], inputFor, "ON", "real", true).rows.length, 0);
});

test("childcare includes profit and history can supply row earnings without losing explicit overrides", () => {
  const care = new ChildcareModel();
  care.configure([childcareEarnings({ ...blank(10000), oth: 2000, selfEmployment: 30000 })], 1);
  care.setMonthly("500");
  care.setNumber("care-age-0", "4");
  care.setNumber("care-expenses-0", "6000");
  assert.deepEqual(care.claimInput()?.earnedIncome, [42000]);
  assert.deepEqual(care.claimInput([12000])?.earnedIncome, [12000]);
  care.overrideEarnings(0, true);
  care.setNumber("care-earnings-0", "0");
  assert.deepEqual(care.claimInput([50000])?.earnedIncome, [0]);
  assert.deepEqual(care.claimInput()?.earnedIncome, [0]);
});

test("business explanations distinguish contribution shares, deductions and election limits", () => {
  const tips = tooltips(loadYear(2025));
  assert.match(tips.selfEmployment, /after expenses/);
  assert.match(tips.selfEmployment, /not moved automatically/);
  assert.match(tips.rrsp, /employment and self-employment/);
  const notes = footerNotes(loadYear(2025), { defaultIncome: 100000, spendEst: () => 2000 });
  assert.match(notes, /both CPP\/QPP shares/);
  assert.match(retirementTooltips(years).retirementQpp, /stop applies only to wages/);
});
