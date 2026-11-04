import assert from "node:assert/strict";
import test from "node:test";
import { loadYear } from "../src/data/load.ts";
import { blank } from "../src/engine/types.ts";
import { ChildcareModel } from "../src/ui/childcare.ts";
import { spendEst } from "../src/ui/defaults.ts";
import { defaultPortfolio, type Portfolio, portfolioAssumptions } from "../src/ui/portfolio.ts";
import { emptyRetirement } from "../src/ui/retirement.ts";
import { normalizeScenario, readScenario, scenarioDefaults, scenarioHash } from "../src/ui/scenario-url.ts";

const assumptions = portfolioAssumptions([loadYear(2026)]);
const context = {
  years: [2026, 2025, 2024],
  provinces: ["ON", "AB", "BC", "QC"],
  treatyRate: () => 0.15,
  portfolioDefaults: assumptions,
};
test("default links omit defaults but identify a scenario and pin the tax year", () => {
  assert.equal(scenarioHash(scenarioDefaults(context), context), "#s=1&year=2026");
  assert.equal(readScenario("#notes", context), null);
  assert.equal(readScenario("", context), null);
  assert.deepEqual(readScenario("#s=1&year=2026", context), scenarioDefaults(context));
  const future = { ...context, years: [2027, ...context.years] };
  assert.equal(readScenario("#s=1&year=2026", future)?.year, 2026);
});

test("all scenario inputs round-trip including explicit zeros, retained fields and invalid childcare drafts", () => {
  const care = new ChildcareModel();
  care.setChildCount(2);
  care.setMonthly("1,200.25");
  care.setNumber("care-age-0", "4");
  care.setNumber("care-expenses-0", "10,000");
  care.setNumber("care-qc-0", "9,500");
  care.setNumber("care-age-1", "invalid draft <");
  care.state.children[0].disabilityTaxCredit = true;
  care.state.children[0].infirm = true;
  care.state.children[0].qcSevereImpairment = true;
  care.state.mode = "manual";
  care.state.earnings = [30000, 0];
  care.state.earningsOverridden = [true, true];
  care.state.claims = [5000, 1000];
  const state = {
    ...scenarioDefaults(context, 2025),
    historyOpen: true,
    historyMode: "nominal",
    people: [
      { ...blank(40000), oth: 1234, cg: -3000, ed: 500, nd: 600, fd: 700, ded: 800, rrsp: 900, fhsa: 1000 },
      { ...blank(0), oth: 2345 },
    ],
    active: 1,
    spouse: false,
    sort: "geo",
    home: "QC",
    dest: "BC",
    view: "dest",
    useBpa: false,
    whRate: 0,
    adults: 3,
    kids: 2,
    under6: 1,
    spend: 3200,
    spendingAdjustment: -12.345,
    childcare: care.state,
    metric: "usd",
    homeValue: 700000,
    propOverride: 0.009,
    propertyTaxBill: 0,
    rent: 2345,
    tenure: "rent",
    useCredits: false,
    tab: "home",
    km: 12345.678,
    eff: 0,
    drivingUnits: "us",
  };
  const hash = scenarioHash(state, context);
  assert.deepEqual(readScenario(hash, context), state);
  assert.equal(scenarioHash(readScenario(hash, context), context), hash);
  assert.ok(!hash.includes("v="), "local-storage version is not a URL field");
});

const retirement = {
  ...emptyRetirement(),
  birthYear: 1956,
  birthMonth: 12,
  pensionSince: { year: 2021, month: 7 },
  cppStop: { year: 2025, month: 6 },
  cppRestart: { year: 2026, month: 2 },
  qppStop: { year: 2026, month: 3 },
  qppRestart: { year: 2027, month: null },
  weights: [1, 1, 1, 1, 1, 1, 0.5, 0, 0, 0, 0, 0],
};

test("retirement inputs round-trip for each person, keeping a birth year rather than an age", () => {
  const state = {
    ...scenarioDefaults(context, 2025),
    people: [blank(40000), blank(30000)],
    adults: 2,
    retirement: [retirement, { ...emptyRetirement(), birthYear: 1960 }],
  };
  const hash = scenarioHash(state, context);
  assert.deepEqual(readScenario(hash, context), state);
  assert.equal(scenarioHash(readScenario(hash, context), context), hash);
  const link = JSON.parse(new URLSearchParams(hash.slice(1)).get("retirement") ?? "null");
  assert.equal(link[0].birthYear, 1956);
  assert.equal(Object.hasOwn(link[0], "age"), false);
  assert.deepEqual(link[1], { birthYear: 1960 }, "blank fields stay out of the link");
  const people = JSON.parse(new URLSearchParams(hash.slice(1)).get("people") ?? "null");
  assert.ok(!JSON.stringify(people).includes("age"), "people carry no derived age");
});

test("links without retirement inputs have no retirement field and restore none", () => {
  const empty = { ...scenarioDefaults(context), retirement: [emptyRetirement()] };
  assert.equal(scenarioHash(empty, context), "#s=1&year=2026");
  assert.deepEqual(readScenario("#s=1&year=2026", context)?.retirement, []);
});

test("malformed retirement parameters fail to the same safe result, field by field", () => {
  for (const value of ["null", "7", "{bad", '"x"', "[1]", '[{"birthYear":"1960"}]', '[{"birthMonth":0}]'])
    assert.deepEqual(
      readScenario(`#s=1&retirement=${encodeURIComponent(value)}`, context),
      scenarioDefaults(context),
      value,
    );
  const damaged = [{ birthYear: 1960, birthMonth: 6, age: null, cppStop: { year: "2025", month: 99 }, weights: [1] }];
  const hash = `#s=1&retirement=${encodeURIComponent(JSON.stringify(damaged))}`;
  assert.deepEqual(readScenario(hash, context)?.retirement, [{ ...emptyRetirement(), birthYear: 1960, birthMonth: 6 }]);
  const repeated = "#s=1&retirement=%5B%5D&retirement=%5B%5D";
  assert.deepEqual(readScenario(repeated, context)?.retirement, []);
  const extra = JSON.stringify([{ birthYear: 1960 }, { birthYear: 1961 }]);
  assert.deepEqual(readScenario(`#s=1&retirement=${extra}`, context)?.retirement, [
    { ...emptyRetirement(), birthYear: 1960 },
  ]);
});

test("household defaults omit derived spending, preserve zero income and restore partner defaults", () => {
  const state = { ...scenarioDefaults(context), adults: 2, kids: 1, spend: spendEst(3), people: [blank(0), blank(0)] };
  const hash = scenarioHash(state, context);
  assert.equal(new URLSearchParams(hash.slice(1)).has("spend"), false);
  assert.deepEqual(readScenario(hash, context), state);
});

test("the largest spending input retains its derived adjustment", () => {
  const state = { ...scenarioDefaults(context), spendingAdjustment: (9999999 / spendEst(1) - 1) * 100 };
  assert.deepEqual(readScenario(scenarioHash(state, context), context), state);
});

test("childcare defaults are omitted without losing retained disabled rows or long invalid drafts", () => {
  const care = new ChildcareModel();
  care.setChildCount(1);
  care.setNumber("care-age-0", "bad input".repeat(100));
  care.setChildCount(0);
  const state = { ...scenarioDefaults(context), childcare: care.state };
  const hash = scenarioHash(state, context);
  const serialized = JSON.parse(new URLSearchParams(hash.slice(1)).get("childcare") ?? "null");
  assert.equal(Object.hasOwn(serialized, "monthly"), false);
  assert.equal(Object.hasOwn(serialized.children[0], "infirm"), false);
  assert.deepEqual(readScenario(hash, context), state);
});

test("malformed, duplicate and old parameters fall back without using unrelated fields", () => {
  for (const hash of ["#s=0&home=%22QC%22", "#s=2", "#s=1&s=1", `#s=1&junk=${"x".repeat(50000)}`])
    assert.deepEqual(readScenario(hash, context), scenarioDefaults(context));
  const result = readScenario(
    "#s=1&year=9999&home=%22ZZ%22&people=null&adults=1.5&kids=-1&useCredits=0&whRate=8&km=1e999&tab=%22oops%22&spend=7&spend=8&unknown=123",
    context,
  );
  assert.deepEqual(result, scenarioDefaults(context));
  assert.deepEqual(readScenario("#s=1&people=%7Bbad&home=%22QC%22", context), {
    ...scenarioDefaults(context),
    home: "QC",
  });
  assert.equal(readScenario("#s=1&year=2025&dest=%22ON%22", context)?.dest, "AB");
});

test("hostile nested objects cannot create engine amounts or prototype properties", () => {
  const hostile = JSON.parse(
    '{"__proto__":{"polluted":true},"people":[{"ord":1e300,"ed":-5,"cg":-40}],"childcare":{"monthly":1e300,"children":[null,42],"claims":{}}}',
  );
  const result = normalizeScenario(hostile, context);
  assert.deepEqual(result.people, [{ ...blank(75000), cg: -40 }]);
  assert.equal((result.childcare as ChildcareModel["state"]).monthly, null);
  assert.equal(Object.hasOwn(result, "__proto__"), false);
  assert.equal(Object.getPrototypeOf(result), Object.prototype);
});

const portfolio = (change: Partial<Portfolio> = {}): Portfolio => ({
  ...defaultPortfolio(assumptions),
  view: "portfolio",
  value: 500000,
  canadian: 30,
  foreign: 30,
  bonds: 40,
  yieldPct: 3,
  ...change,
});

test("links and saves from before the portfolio field keep the manual view and their exact amounts", () => {
  const people = [{ ...blank(60000), oth: 1200, cg: 900, ed: 800, nd: 700, fd: 600 }];
  const hash = `#s=1&year=2025&people=${encodeURIComponent(JSON.stringify(people))}`;
  const state = readScenario(hash, context);
  assert.deepEqual(state?.portfolios, []);
  assert.deepEqual(state?.people, people);
  assert.equal(new URLSearchParams(scenarioHash(state, context).slice(1)).has("portfolios"), false);
  assert.deepEqual(normalizeScenario({ v: 3, people }, context).portfolios, []);
  assert.equal(scenarioHash(scenarioDefaults(context), context), "#s=1&year=2026");
});

test("the portfolio view round-trips with the manual amounts it sets aside", () => {
  const state = {
    ...scenarioDefaults(context),
    people: [{ ...blank(60000), oth: 1200, cg: -900, ed: 800, nd: 700, fd: 600 }, blank(30000)],
    adults: 2,
    spend: spendEst(2),
    portfolios: [
      portfolio({ other: 0 }),
      portfolio({ value: 123456, canadian: 12.5, foreign: 0, bonds: 150 / 2, yieldPct: 0, other: 2500 }),
    ],
  };
  const hash = scenarioHash(state, context);
  assert.deepEqual(readScenario(hash, context), state);
  assert.equal(scenarioHash(readScenario(hash, context), context), hash);
});

test("the manual view round-trips a portfolio typed earlier, and one person can use each view", () => {
  const typedEarlier = portfolio({ view: "manual" });
  for (const portfolios of [[typedEarlier], [null, portfolio()], [typedEarlier, portfolio()]]) {
    const state = {
      ...scenarioDefaults(context),
      people: [blank(60000), blank(30000)],
      adults: 2,
      spend: spendEst(2),
      portfolios,
    };
    assert.deepEqual(readScenario(scenarioHash(state, context), context), state);
  }
});

test("a link states every portfolio field, so a later change of starting assumptions can't change its result", () => {
  const state = { ...scenarioDefaults(context), portfolios: [{ ...defaultPortfolio(assumptions), view: "portfolio" }] };
  const hash = scenarioHash(state, context);
  const later = {
    ...context,
    portfolioDefaults: { ...assumptions, canadian: 0.5, foreign: 0.5, bonds: 0, yield: 0.09 },
  };
  assert.deepEqual(readScenario(hash, later)?.portfolios, state.portfolios);
  const written = new URLSearchParams(hash.slice(1)).get("portfolios") ?? "[]";
  assert.deepEqual(Object.keys(JSON.parse(written)[0]).sort(), [
    "bonds",
    "canadian",
    "foreign",
    "other",
    "value",
    "view",
    "yieldPct",
  ]);
});

test("an untouched manual entry adds nothing to a link", () => {
  const state = { ...scenarioDefaults(context), portfolios: [defaultPortfolio(assumptions)] };
  assert.equal(scenarioHash(state, context), "#s=1&year=2026");
});

test("malformed portfolio fields fall back safely without disturbing the other inputs", () => {
  const read = (value: string) => readScenario(`#s=1&home=%22QC%22&portfolios=${encodeURIComponent(value)}`, context);
  for (const value of ["{bad", "null", "7", '"x"', "{}", "[null]", "[7]", '[{"view":"manual"}]', '[{"view":"both"}]'])
    assert.deepEqual(read(value), { ...scenarioDefaults(context), home: "QC" });
  assert.deepEqual(read('[{"view":"portfolio","value":1e999,"canadian":-1,"yieldPct":"3"}]')?.portfolios, [
    { ...defaultPortfolio(assumptions), view: "portfolio" },
  ]);
  assert.deepEqual(read(`[${JSON.stringify(portfolio())},${JSON.stringify(portfolio())}]`)?.portfolios, [portfolio()]);
  const hostile = JSON.parse('{"portfolios":[{"__proto__":{"polluted":true},"view":"portfolio","value":5,"extra":1}]}');
  const [entry] = normalizeScenario(hostile, context).portfolios as Portfolio[];
  assert.deepEqual(entry, { ...defaultPortfolio(assumptions), view: "portfolio", value: 5 });
  assert.equal(Object.getPrototypeOf(entry), Object.prototype);
  assert.equal(Object.hasOwn(entry, "polluted"), false);
});
