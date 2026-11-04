import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { listYears, loadYear } from "../src/data/load.ts";
import { compute, household } from "../src/engine/household.ts";
import { blank, type Household, type Person } from "../src/engine/types.ts";
import { type Scenario, toHousehold } from "./golden/adapter.ts";
import { SCENARIOS } from "./golden/scenarios.mjs";
import { type ManitobaYear, mbForms } from "./mb-family-forms.ts";

interface Feature {
  id: string;
  year: ManitobaYear;
  household: Omit<Partial<Household>, "people"> & { people: Partial<Person>[] };
  childcareClaims?: number[];
  expected: Record<string, number>;
}
const fixture: { defaults: Omit<Household, "people">; cases: Feature[] } = JSON.parse(
  fs.readFileSync(new URL("./golden/features/mb-family-benefit.json", import.meta.url), "utf8"),
);
const input = (c: Feature): Household => ({
  ...fixture.defaults,
  ...c.household,
  people: c.household.people.map(x => ({ ...blank(0), ...x })),
});
const years = new Map(listYears().map(year => [year, loadYear(year)]));
const province = (year: number) => {
  const y = years.get(year);
  assert.ok(y);
  const p = y.provinces.find(p => p.code === "MB");
  assert.ok(p);
  return { y, p };
};
const near = (actual: number, expected: number, label: string) =>
  assert.ok(Math.abs(actual - expected) < 1e-7, `${label}: ${actual} != ${expected}`);

function verify(year: ManitobaYear, hh: Household, childcareClaims?: number[]) {
  const { y, p } = province(year);
  const actual = household(y, p, hh);
  const forms = mbForms(year, hh, { childcareClaims });
  for (const [i, r] of actual.list.entries()) {
    const f = forms[i];
    near(r.ti, f.net, "line 23600");
    near(r.breakdown.familyTaxBenefit.base, f.line12A, "MB428-A line 12");
    near(r.breakdown.familyTaxBenefit.applied, f.familyApplied, "usable family credit");
    near(r.pDtc, f.pDtc, "usable dividend credit");
    near(r.pFtc, f.pFtc, "MB428 line 73");
    near(r.fFtc, f.fFtc, "federal FTC");
    near(r.prov, f.prov, "MB428 line 82");
    near(
      r.pr.tax - r.pCred - r.pSp - r.pEmp - r.breakdown.familyTaxBenefit.applied - r.pDtc - r.pFtc,
      r.prov,
      "provincial ledger reconciles",
    );
  }
  near(
    actual.prov,
    forms.reduce((sum, f) => sum + f.prov, 0),
    "household provincial tax",
  );
  near(actual.total, actual.fed + actual.prov + actual.wh + actual.payroll, "household total");
}

test("Manitoba family feature golden IDs are unique and assertions are nonempty", () => {
  assert.equal(new Set(fixture.cases.map(c => c.id)).size, fixture.cases.length);
  for (const c of fixture.cases) assert.ok(Object.keys(c.expected).length > 0, c.id);
});

for (const c of fixture.cases) {
  test(`Manitoba family feature golden: ${c.id}`, () => {
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
    verify(c.year, hh, c.childcareClaims);
    if (hh.people.length === 2) {
      const reversed = {
        ...hh,
        people: [...hh.people].reverse(),
        childcare: hh.childcare
          ? { ...hh.childcare, manualClaims: hh.childcare.manualClaims?.toReversed() }
          : undefined,
      };
      verify(c.year, reversed, c.childcareClaims?.toReversed());
      near(household(y, p, reversed).total, result.fed + result.prov + result.wh + result.payroll, "adult order");
    }
  });
}

test("MB equal-income interpretation elects the whole claim using tax after dividend credit and FTC", () => {
  for (const year of [2025, 2026] as const) {
    for (const id of ["equal-income-dividend-capacity", "equal-income-foreign-tax"]) {
      const c = fixture.cases.find(c => c.id === `${year}-${id}`);
      assert.ok(c);
      const hh = input(c);
      const tax = (owner: number) => mbForms(year, hh, { childClaimant: owner }).reduce((s, r) => s + r.prov, 0);
      assert.ok(tax(0) - tax(1) > 500, "first-adult election must lose material tax savings");
      const { y, p } = province(year);
      const r = household(y, p, hh);
      near(r.prov, tax(1), "best completed returns");
      assert.equal(r.list[0].breakdown.familyTaxBenefit.base, 0);
      assert.ok(r.list[1].breakdown.familyTaxBenefit.applied > 500);
    }
  }
});

test("MB birth-year eligibility includes a child turning 18 even when the model's CCB count is zero", () => {
  for (const year of [2025, 2026] as const) {
    const results = [17, 18, 19].map(age => {
      const c = fixture.cases.find(c => c.id === `${year}-child-age-${age}`);
      assert.ok(c);
      const { y, p } = province(year);
      return household(y, p, input(c));
    });
    assert.ok(results[0].ccb > 0);
    assert.equal(results[1].ccb, 0);
    near(results[0].prov, results[1].prov, "turning 18 does not remove the annual family amount");
    assert.ok(results[2].prov - results[1].prov > 200, "age 19 cannot qualify for the ordinary child component");
  }
});

test("Separate child ages leave every other province/year byte-identical and preserve CCB counts", () => {
  for (const year of listYears()) {
    const y = years.get(year);
    assert.ok(y);
    for (const age of [17, 18, 19]) {
      const hh: Household = {
        ...fixture.defaults,
        adults: 2,
        kids: age < 18 ? 1 : 0,
        people: [{ ...blank(0), oth: 40000 }, blank(0)],
      };
      for (const p of y.provinces) {
        const before = compute(y, p, hh);
        const after = compute(y, p, { ...hh, childAges: [age] });
        assert.equal(after.ccb, before.ccb, `${year} ${p.code}: CCB`);
        if (!p.familyTaxBenefit) assert.equal(JSON.stringify(after), JSON.stringify(before), `${year} ${p.code}`);
      }
    }
  }
});

test("MB legacy smoke correction is independently verified at $28,000 and its $100 marginal step", () => {
  for (const [ord, oldTax, base] of [
    [28000, 126.5598, 1632.05],
    [28100, 136.54116, 1623.14],
  ]) {
    const hh = { ...fixture.defaults, kids: 1, people: [blank(ord)] };
    const before = mbForms(2026, hh, { omitted: true })[0];
    const after = mbForms(2026, hh)[0];
    near(before.prov, oldTax, "legacy provincial tax");
    near(after.line12A, base, "MB428-A line 12");
    near(after.familyApplied, oldTax, "credit absorbs the remaining capacity");
    assert.equal(after.prov, 0);
    verify(2026, hh);
  }
});

test("MB428 independent audit covers locked scenarios and every marginal/investment counterfactual", () => {
  const other: { scenarios: Scenario[] } = JSON.parse(
    fs.readFileSync(new URL("./golden/other-income-original.json", import.meta.url), "utf8"),
  );
  let checked = 0;
  for (const year of [2025, 2026] as const)
    for (const s of [...(SCENARIOS as unknown as Scenario[]), ...other.scenarios]) {
      const hh = toHousehold(s);
      const variants = [hh];
      for (const key of ["ord", "oth", "cg", "ed", "nd", "fd"] as const)
        variants.push({
          ...hh,
          people: hh.people.map((x, i) => (i === hh.active ? { ...x, [key]: (x[key] ?? 0) + 100 } : x)),
        });
      variants.push({ ...hh, people: hh.people.map(x => ({ ...x, cg: 0, ed: 0, nd: 0, fd: 0 })) });
      for (const v of variants) {
        verify(year, v);
        checked++;
      }
    }
  assert.equal(checked, 2528);
});

test("MB audit negative controls distinguish incorrect FTC order and lower-income child allocation", () => {
  for (const [id, mutation] of [
    ["mixed-dividends-foreign", { wrongOrder: true }],
    ["higher-income-child-claim", { lowerClaimant: true }],
  ] as const) {
    const c = fixture.cases.find(c => c.id === `2025-${id}`);
    assert.ok(c);
    const hh = input(c);
    const correct = mbForms(c.year, hh);
    const wrong = mbForms(c.year, hh, mutation);
    const tax = (rs: typeof correct) => rs.reduce((s, r) => s + r.prov, 0);
    assert.ok(tax(correct) > 0);
    assert.ok(Math.abs(tax(correct) - tax(wrong)) > 1, "negative control must change final tax materially");
  }
});

test("Manitoba family benefit is selected through data only for 2025–2026", () => {
  for (const year of listYears()) {
    const { p } = province(year);
    assert.equal(!!p.familyTaxBenefit, year === 2025 || year === 2026);
    if (year === 2026) assert.equal(p.familyTaxBenefit?.estimated, true);
  }
});
