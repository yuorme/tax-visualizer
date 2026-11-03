import assert from "node:assert/strict";
import test from "node:test";
import { blank } from "../src/engine/types.ts";
import { ChildcareModel } from "../src/ui/childcare.ts";
import { spendEst } from "../src/ui/defaults.ts";
import { normalizeScenario, readScenario, scenarioDefaults, scenarioHash } from "../src/ui/scenario-url.ts";

const context = { years: [2026, 2025, 2024], provinces: ["ON", "AB", "BC", "QC"], treatyRate: () => 0.15 };
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
