// The page's retirement-age inputs: how they reach the engine, which years can take them, and how damaged saved values
// fail. The engine's own calculation is covered by retirement-payroll.test.ts; these tests pin the UI's side of its
// input contract in docs/verification/146-retirement-payroll.md, including each way that contract can throw.
import assert from "node:assert/strict";
import test from "node:test";
import { listYears, loadCpi, loadYear } from "../src/data/load.ts";
import type { YearData } from "../src/data/schema.ts";
import { historyComparison } from "../src/engine/history.ts";
import { blank, compute, type Household, type Person } from "../src/engine/index.ts";
import type { RetirementPayroll } from "../src/engine/payroll.ts";
import { retirementTooltips } from "../src/ui/notes.ts";
import {
  compactRetirements,
  emptyRetirement,
  historyRetirementNote,
  normalizeRetirement,
  normalizeRetirements,
  parseWeight,
  parseYear,
  type Retirement,
  retirementActive,
  retirementCoverage,
  retirementGate,
  retirementHistory,
  retirementResult,
  retirementStatus,
  retirementSummary,
  retirementYears,
  withRetirement,
  yearList,
} from "../src/ui/retirement.ts";

const years = listYears().map(loadYear);
const cpi = loadCpi();
const data = (year: number) => years.find(y => y.year === year) as YearData;
const money = (n: number) => `$${Math.round(n).toLocaleString("en-CA")}`;
const entry = (change: Partial<Retirement> = {}): Retirement => ({
  ...emptyRetirement(),
  birthYear: 1960,
  birthMonth: 6,
  ...change,
});
const household = (people: Person[]): Household => ({
  people,
  active: 0,
  spouse: false,
  adults: people.length,
  kids: 0,
  under6: 0,
  useBpa: true,
  whRate: 0,
  useCredits: true,
  homeValue: 0,
  rent: 0,
  monthlySpending: 2000,
});
const person = blank(100000);
const inputFor = (entries: (Retirement | null)[]) => (y: YearData) =>
  household([withRetirement(person, entries[0] ?? null, y)]);
const history = (entries: (Retirement | null)[], home = "ON", mode: "real" | "nominal" = "nominal") =>
  retirementHistory(years, cpi, entries, inputFor(entries), home, mode);
const rowYears = (r: { rows: { year: number }[] }) => r.rows.map(row => row.year);

test("absent or incomplete inputs leave the very same person, so the engine stays on its legacy path", () => {
  const legacy = blank(50000);
  for (const y of years)
    for (const value of [null, emptyRetirement(), entry({ birthMonth: null }), entry({ birthYear: null })])
      assert.equal(withRetirement(legacy, value, y), legacy);
  assert.equal(retirementActive(null), false);
  assert.equal(retirementActive(entry()), true);
});

test("a birth date alone sets age and month, never a null or blank field", () => {
  const result = withRetirement(person, entry(), data(2026));
  assert.deepEqual(result, { ...person, age: 66, birthMonth: 6 });
  assert.equal(Object.hasOwn(result, "employeePayroll"), false);
});

test("the age follows the tax year; pension and election dates keep their calendar years", () => {
  const value = entry({
    pensionSince: { year: 2025, month: 1 },
    cppStop: { year: 2025, month: 6 },
    cppRestart: { year: 2027, month: 2 },
    qppStop: { year: 2026, month: 3 },
    weights: [1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0],
  });
  for (const year of [2025, 2026]) {
    const result = withRetirement(person, value, data(year));
    assert.equal(result.age, year - 1960);
    assert.deepEqual(result.employeePayroll, {
      retirementPensionSince: { year: 2025, month: 1 },
      cppElection: { stop: { year: 2025, month: 6 }, restart: { year: 2027, month: 2 } },
      qppElection: { stop: { year: 2026, month: 3 } },
      monthlyEarningsWeights: [1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0],
    });
  }
  // The contract's example: a valid June 2025 stop at 65, with no restart, is still stopped at 66.
  const on = data(2026).provinces.find(p => p.code === "ON");
  assert.ok(on);
  const once = entry({ pensionSince: { year: 2025, month: 1 }, cppStop: { year: 2025, month: 6 } });
  const stopped = compute(data(2026), on, household([withRetirement(person, once, data(2026))]));
  assert.equal(stopped.me.breakdown.retirementPayroll?.election, "stopped");
});

test("half-entered dates and stray restarts never reach the engine", () => {
  const result = withRetirement(
    person,
    entry({
      pensionSince: { year: 2024, month: null },
      cppStop: { year: null, month: 6 },
      cppRestart: { year: 2026, month: 1 },
      qppRestart: { year: 2026, month: 1 },
    }),
    data(2026),
  );
  assert.equal(Object.hasOwn(result, "employeePayroll"), false);
});

test("pay timing that totals zero is left out rather than sent to the engine, which rejects it", () => {
  const value = entry({ weights: Array(12).fill(0) });
  assert.equal(Object.hasOwn(withRetirement(person, value, data(2026)), "employeePayroll"), false);
});

test("coverage comes from the year's data, not a list of years", () => {
  assert.deepEqual(retirementYears(years), [2025, 2026]);
  assert.equal(retirementCoverage(null, data(2026)), "inactive");
  assert.equal(retirementCoverage(entry({ birthMonth: null }), data(2019)), "inactive");
  assert.equal(retirementCoverage(entry(), data(2024)), "no-data");
  assert.equal(retirementCoverage(entry(), data(2025)), "applied");
  const added = structuredClone(data(2024));
  added.federal.payroll.employeeRetirement = data(2025).federal.payroll.employeeRetirement;
  assert.equal(retirementCoverage(entry(), added), "applied");
  assert.deepEqual(retirementYears([added, data(2025)]), [2024, 2025]);
  const removed = structuredClone(data(2026));
  delete removed.federal.payroll.employeeRetirement;
  assert.equal(retirementCoverage(entry(), removed), "no-data");
});

test("the contribution start boundary follows the data and the stricter plan", () => {
  const start = data(2026).federal.payroll.employeeRetirement?.cpp.params.contributionStartAge ?? 0;
  const atAge = (age: number) => entry({ birthYear: 2026 - age });
  assert.equal(retirementCoverage(atAge(start + 1), data(2026)), "applied");
  assert.equal(retirementCoverage(atAge(start), data(2026)), "young");
  assert.equal(retirementCoverage(atAge(-3), data(2026)), "young");
  const stricter = structuredClone(data(2026));
  const qpp = stricter.federal.payroll.employeeRetirement?.qpp;
  assert.ok(qpp);
  qpp.params.contributionStartAge = start + 1;
  assert.equal(retirementCoverage(atAge(start + 1), stricter), "young");
  assert.equal(withRetirement(person, atAge(start), data(2026)), person);
});

test("no birth year throws in any province of any year, including each boundary year", () => {
  const birthYears = [1900, 1955, 1956, 1960, 2006, 2007, 2008, 2025, 2026, 2030, 2100];
  for (const y of years)
    for (const province of y.provinces)
      for (const birthYear of birthYears) {
        const value = entry({ birthYear, pensionSince: { year: 2024, month: 1 }, qppStop: { year: 2025, month: 6 } });
        assert.doesNotThrow(() => compute(y, province, household([withRetirement(person, value, y)])));
      }
});

test("with no retirement inputs, history is exactly the single engine call it replaced", () => {
  const legacy = historyComparison(years, cpi, household([person]), ["ON"], "real");
  for (const entries of [[], [null], [entry({ birthMonth: null })]]) {
    const { noData, young, ...rows } = retirementHistory(years, cpi, entries, () => household([person]), "ON", "real");
    assert.deepEqual(rows, legacy);
    assert.deepEqual([noData, young], [[], []]);
  }
});

test("retirement inputs leave out unsupported years before any row is computed", () => {
  const result = history([entry()]);
  assert.deepEqual(rowYears(result), [2025, 2026]);
  assert.deepEqual(result.noData, [2019, 2020, 2021, 2022, 2023, 2024]);
  assert.deepEqual(result.young, []);
  assert.match(historyRetirementNote(result, [2025, 2026]), /only for 2025 and 2026, so 2019–2024 are left out/);
  assert.deepEqual(rowYears(history([entry()], "ON", "real")), [2025], "real mode still needs published CPI");
});

test("a row at or below the contribution start age is left out, not thrown: born 2007 is 18 in 2025", () => {
  const result = history([entry({ birthYear: 2007 })]);
  assert.deepEqual(rowYears(result), [2026]);
  assert.deepEqual(result.young, [2025]);
  assert.match(historyRetirementNote(result, [2025, 2026]), /2025 left out/);
  assert.throws(() =>
    historyComparison([data(2025)], cpi, household([{ ...person, age: 18, birthMonth: 6 }]), ["ON"], "nominal"),
  );
});

test("real mode can have no rows at all, and still reports its base year", () => {
  const result = history([entry({ birthYear: 2007 })], "ON", "real");
  assert.deepEqual(result.rows, []);
  assert.equal(result.baseYear, Math.max(...Object.keys(cpi.values).map(Number)));
});

test("either person's coverage decides a history row", () => {
  const entries = [entry(), entry({ birthYear: 2007 })];
  const result = retirementHistory(
    years,
    cpi,
    entries,
    y => household([withRetirement(person, entries[0], y), withRetirement(blank(0), entries[1], y)]),
    "ON",
    "nominal",
  );
  assert.deepEqual(rowYears(result), [2026]);
});

test("each history row uses that year's age: born June 1955 contributes until June 2025, then not at all", () => {
  const value = entry({ birthYear: 1955 });
  const result = history([value]);
  const on = data(2025).provinces.find(p => p.code === "ON");
  assert.ok(on);
  for (const row of result.rows) {
    const y = data(row.year);
    const province = y.provinces.find(p => p.code === "ON");
    assert.ok(province);
    const age = row.year - 1955;
    const expected = compute(y, province, household([{ ...person, age, birthMonth: 6 }]));
    assert.equal(row.provinces[0].tax, expected.total);
    assert.equal(expected.me.breakdown.retirementPayroll?.contributoryMonths.length, row.year === 2025 ? 6 : 0);
  }
  // A plausible wrong reading: every row at the selected year's age. 2025 would lose its six contributing months.
  const fixed = compute(data(2025), on, household([{ ...person, age: 71, birthMonth: 6 }]));
  assert.notEqual(result.rows[0].provinces[0].tax, fixed.total);
});

test("the selected year says when results don't use what was entered", () => {
  const names = ["you", "your partner"];
  assert.equal(retirementGate([], data(2023), [2025, 2026], names), "");
  assert.equal(retirementGate([null, entry({ birthMonth: null })], data(2023), [2025, 2026], names), "");
  assert.equal(retirementGate([entry()], data(2026), [2025, 2026], names), "");
  assert.match(
    retirementGate([entry()], data(2023), [2025, 2026], names),
    /modelled for 2025 and 2026 only, so these 2023 results use ordinary CPP\/QPP/,
  );
  assert.match(
    retirementGate([entry(), entry({ birthYear: 2008 })], data(2026), [2025, 2026], names),
    /isn't modelled for your partner \(age 18\) in 2026/,
  );
  assert.match(
    retirementGate([entry({ birthYear: 2040 })], data(2026), [2025, 2026], names),
    /modelled for you in 2026/,
  );
});

test("the section's summary and status follow the selected year", () => {
  assert.equal(retirementSummary(null, data(2026)), "not set");
  assert.equal(retirementSummary(entry({ birthYear: null }), data(2026)), "incomplete");
  assert.equal(retirementSummary(entry(), data(2026)), "age 66 in 2026");
  assert.equal(retirementSummary(entry(), data(2023)), "not applied in 2023");
  assert.equal(retirementStatus(null, data(2026), undefined, "CPP", money), "");
  assert.match(retirementStatus(entry({ birthMonth: null }), data(2026), undefined, "CPP", money), /both the birth/);
  assert.match(retirementStatus(entry(), data(2023), undefined, "CPP", money), /2023 has no retirement-age/);
  assert.match(retirementStatus(entry({ birthYear: 2008 }), data(2026), undefined, "CPP", money), /isn't modelled/);
});

test("an election the engine rejected is reported, because it changes nothing", () => {
  const result: RetirementPayroll = {
    program: "cpp-employee-retirement",
    contributoryMonths: [1, 2, 3, 4, 5, 6],
    pensionableEarnings: 25000,
    election: "stopped",
    withheldBase: 0,
    withheldEnhanced: 0,
    overpayment: 0,
  };
  assert.match(retirementResult(result, "CPP", money), /CPP applies to 6 of 12 months, on \$25,000.*is valid/);
  assert.match(retirementResult({ ...result, election: "ineligible-stop" }, "CPP", money), /no effect/);
  assert.match(retirementResult({ ...result, election: "ineligible-restart" }, "CPP", money), /stop stays in force/);
  assert.doesNotMatch(retirementResult({ ...result, election: "none" }, "CPP", money), /;/);
  assert.match(retirementResult({ ...result, overpayment: 112 }, "QPP", money), /\$112 withheld/);
  assert.doesNotMatch(retirementResult(result, "QPP", money), /withheld/);
});

test("saved entries keep only valid values", () => {
  for (const value of [undefined, null, 7, "x", [], {}, { birthYear: "1960", birthMonth: 13, weights: "x", junk: 1 }])
    assert.equal(normalizeRetirement(value), null);
  const kept = normalizeRetirement({
    birthYear: 1960.5,
    birthMonth: 6,
    pensionSince: { year: 2024, month: 0 },
    cppStop: "2025",
    qppStop: { year: Number.POSITIVE_INFINITY, month: 3 },
    weights: [1, 2, 3],
    other: true,
  });
  assert.deepEqual(kept, {
    ...emptyRetirement(),
    birthMonth: 6,
    pensionSince: { year: 2024, month: null },
    qppStop: { year: null, month: 3 },
  });
  for (const weights of [Array(11).fill(1), Array(13).fill(1), [...Array(11).fill(1), -1], [...Array(11).fill(1), 1e7]])
    assert.equal(normalizeRetirement({ ...entry(), weights })?.weights, null);
  assert.deepEqual(normalizeRetirement({ ...entry(), weights: Array(12).fill(0) })?.weights, Array(12).fill(0));
});

test("a saved list has at most one entry per person and no trailing empties", () => {
  assert.deepEqual(normalizeRetirements("x", 2), []);
  assert.deepEqual(normalizeRetirements([null, {}], 2), []);
  assert.deepEqual(normalizeRetirements([entry(), entry()], 1), [entry()]);
  assert.deepEqual(normalizeRetirements([null, entry()], 2), [null, entry()]);
});

test("the compact link form restores every entered field", () => {
  const value = [
    null,
    entry({ pensionSince: { year: 2024, month: null }, weights: [1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0] }),
  ];
  const compact = JSON.parse(JSON.stringify(compactRetirements(value)));
  assert.deepEqual(compact[1].pensionSince, { year: 2024 });
  assert.equal(Object.hasOwn(compact[1], "cppStop"), false);
  assert.deepEqual(normalizeRetirements(compact, 2), value);
});

test("typed years and monthly amounts", () => {
  assert.equal(parseYear("1960"), 1960);
  assert.equal(parseYear(" 2026 "), 2026);
  for (const text of ["", "196", "19600", "1899", "2101", "19a0", "-196"]) assert.equal(parseYear(text), null);
  assert.equal(parseWeight(""), 0);
  assert.equal(parseWeight("2.5"), 2.5);
  assert.equal(parseWeight("$1,200"), 1200);
  for (const text of ["x", "-1", "1e3", "9999999"]) assert.equal(parseWeight(text), null);
});

test("year lists read naturally", () => {
  assert.equal(yearList([2025]), "2025");
  assert.equal(yearList([2025, 2026]), "2025 and 2026");
  assert.equal(yearList([2019, 2020, 2021]), "2019–2021");
  assert.equal(yearList([2019, 2021, 2023]), "2019, 2021 and 2023");
});

test("tooltips quote the data's ages and years", () => {
  const tips = retirementTooltips(years);
  assert.match(tips.retirementAge, /turn 70/);
  assert.match(tips.retirementAge, /year they turn 72/);
  assert.match(tips.retirementAge, /Modelled for 2025 and 2026 only/);
  assert.match(tips.retirementQpp, /December 31 birthday can't use December: enter January/);
  assert.match(tips.retirementCpp, /reached the employer, not the month it takes effect/);
  const changed = structuredClone(years);
  const newest = changed.find(y => y.year === 2026)?.federal.payroll.employeeRetirement;
  assert.ok(newest);
  newest.cpp.params.mandatoryStopAge = 71;
  assert.match(retirementTooltips(changed).retirementAge, /turn 71/);
  assert.throws(() => retirementTooltips(years.filter(y => y.year < 2025)), /No year has retirement payroll rules/);
});
