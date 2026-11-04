import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { loadYear } from "../src/data/load.ts";
import { compute, household } from "../src/engine/household.ts";
import { blank, type Household, type Person } from "../src/engine/types.ts";
import { type Scenario, toHousehold } from "./golden/adapter.ts";
import { SCENARIOS } from "./golden/scenarios.mjs";
import { type ManitobaYear, mbForms } from "./mb-family-forms.ts";

interface Feature {
  id: string;
  year: ManitobaYear;
  household: Omit<Partial<Household>, "people"> & { people: Partial<Person>[] };
  expected: Record<string, number>;
}
const fixture: { defaults: Omit<Household, "people">; cases: Feature[] } = JSON.parse(
  fs.readFileSync(new URL("./golden/features/mb-family-benefit-history.json", import.meta.url), "utf8"),
);
const years = [2019, 2020, 2021, 2022, 2023, 2024] as const;
const data = new Map(years.map(year => [year, loadYear(year)]));
const province = (year: ManitobaYear) => {
  const y = data.get(year as (typeof years)[number]);
  assert.ok(y, String(year));
  const p = y.provinces.find(p => p.code === "MB");
  assert.ok(p);
  return { y, p };
};
const input = (c: Feature): Household => ({
  ...fixture.defaults,
  ...c.household,
  people: c.household.people.map(x => ({ ...blank(0), ...x })),
});
const near = (actual: number, expected: number, label: string) =>
  assert.ok(Math.abs(actual - expected) < 1e-7, `${label}: ${actual} != ${expected}`);

function verify(year: ManitobaYear, hh: Household, omitted = false) {
  const { y, p } = province(year);
  const actual = household(y, omitted ? { ...p, familyTaxBenefit: undefined } : p, hh);
  const forms = mbForms(year, hh, { omitted });
  for (const [i, r] of actual.list.entries()) {
    const f = forms[i];
    const label = `${year}, adult ${i}`;
    near(r.ti, f.net, `${label}: net income`);
    near(r.breakdown.familyTaxBenefit.base, f.line12A, `${label}: family base`);
    near(r.breakdown.familyTaxBenefit.applied, f.familyApplied, `${label}: applied family credit`);
    near(r.pDtc, f.pDtc, `${label}: dividend credit`);
    near(r.fFtc, f.fFtc, `${label}: federal FTC`);
    near(r.pFtc, f.pFtc, `${label}: provincial FTC`);
    near(r.prov, f.prov, `${label}: provincial tax`);
  }
  near(
    actual.prov,
    forms.reduce((sum, r) => sum + r.prov, 0),
    `${year}: household tax`,
  );
}

test("historical Manitoba feature IDs are unique and every year has the complete independent specimen set", () => {
  assert.equal(new Set(fixture.cases.map(c => c.id)).size, fixture.cases.length);
  for (const year of years) {
    const cases = fixture.cases.filter(c => c.year === year);
    assert.equal(cases.length, 31);
    assert.equal(province(year).p.familyTaxBenefit?.program, "mb-family-tax-benefit");
    assert.notEqual(province(year).p.familyTaxBenefit?.estimated, true);
    for (const c of cases) assert.ok(Object.keys(c.expected).length > 0, c.id);
  }
});

for (const c of fixture.cases) {
  test(`historical Manitoba family feature golden: ${c.id}`, () => {
    const { y, p } = province(c.year);
    const hh = input(c);
    const result = compute(y, p, hh);
    for (const [path, expected] of Object.entries(c.expected)) {
      let actual: unknown = result;
      for (const key of path.split(".")) {
        assert.ok(actual !== null && typeof actual === "object" && key in actual, path);
        actual = (actual as Record<string, unknown>)[key];
      }
      assert.equal(typeof actual, "number", path);
      assert.equal(Math.round((actual as number) * 1e4) / 1e4, expected, path);
    }
    verify(c.year, hh);
    if (hh.people.length === 2) {
      const reversed = { ...hh, people: [...hh.people].reverse() };
      verify(c.year, reversed);
      near(household(y, p, reversed).prov, result.prov, "adult-order invariance");
    }
  });
}

test("historical MB428 audit checks all locked households and marginal/investment counterfactuals before and after", () => {
  let checked = 0;
  for (const year of years)
    for (const s of SCENARIOS as unknown as Scenario[]) {
      const hh = toHousehold(s);
      const variants = [hh];
      for (const key of ["ord", "oth", "cg", "ed", "nd", "fd"] as const)
        variants.push({
          ...hh,
          people: hh.people.map((x, i) => (i === hh.active ? { ...x, [key]: (x[key] ?? 0) + 100 } : x)),
        });
      variants.push({ ...hh, people: hh.people.map(x => ({ ...x, cg: 0, ed: 0, nd: 0, fd: 0 })) });
      for (const v of variants)
        for (const omitted of [false, true]) {
          verify(year, v, omitted);
          checked++;
        }
    }
  assert.equal(checked, 14208);
});

test("historical negative controls reject wrong FTC ordering and lower-income child allocation", () => {
  for (const year of years)
    for (const [suffix, mutation] of [
      ["mixed-dividends-foreign", { wrongOrder: true }],
      ["higher-income-child-claim", { lowerClaimant: true }],
    ] as const) {
      const c = fixture.cases.find(c => c.id === `${year}-${suffix}`);
      assert.ok(c);
      const hh = input(c);
      const tax = (rs: ReturnType<typeof mbForms>) => rs.reduce((sum, r) => sum + r.prov, 0);
      assert.ok(Math.abs(tax(mbForms(year, hh)) - tax(mbForms(year, hh, mutation))) > 1, c.id);
    }
});

test("every historical year distinguishes age 18 from 19 and individual income from family income", () => {
  for (const year of years) {
    const results = [17, 18, 19].map(age => {
      const c = fixture.cases.find(c => c.id === `${year}-ages-only-${age}`);
      assert.ok(c);
      const { y, p } = province(year);
      return household(y, p, input(c));
    });
    assert.ok(results[0].ccb > 0);
    assert.equal(results[1].ccb, 0);
    near(results[0].prov, results[1].prov, "turning 18 preserves the annual family amount");
    assert.ok(results[2].prov - results[1].prov > 200, `${year}: 19-year-old exclusion`);
    const c = fixture.cases.find(c => c.id === `${year}-higher-income-child-claim`);
    assert.ok(c);
    const { y, p } = province(year);
    const r = household(y, p, input(c));
    assert.ok(r.famNet > 2065 / 0.09);
    assert.ok(
      r.list.some(person => person.breakdown.familyTaxBenefit.base > 0),
      "taper uses individual income",
    );
  }
});
