import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { loadYear } from "../src/data/load.ts";
import { blank, compute, type Household } from "../src/engine/index.ts";
import { type Scenario, toHousehold } from "./golden/adapter.ts";
import { SCENARIOS } from "./golden/scenarios.mjs";
import { snapshot } from "./golden/snapshot.mjs";
import { type NwtPerson, nwtAnnual, nwtDifference, nwtFamilyNet, nwtInherited } from "./nwt-child-benefit-form.ts";

interface Feature {
  id: string;
  year: 2025 | 2026;
  province: string;
  household: { people: NwtPerson[]; kids: number; under6: number };
  expected: { famNet: number; provBen: number };
}
const fixture: { defaults: Omit<Household, "people">; cases: Feature[] } = JSON.parse(
  fs.readFileSync(new URL("./golden/features/nwt-child-benefit.json", import.meta.url), "utf8"),
);
const near = (actual: number, expected: number, label: string) =>
  assert.ok(Math.abs(actual - expected) < 1e-7, `${label}: ${actual} != ${expected}`);
const r4 = (n: number) => Math.round(n * 1e4) / 1e4;
const years = new Map(([2025, 2026] as const).map(year => [year, loadYear(year)]));
const data = (year: 2025 | 2026) => {
  const y = years.get(year);
  assert.ok(y);
  const p = y.provinces.find(p => p.code === "NT");
  assert.ok(p);
  return { y, p };
};

test("NWT feature cases have unique IDs and independently checked expectations", () => {
  assert.equal(new Set(fixture.cases.map(c => c.id)).size, fixture.cases.length);
  assert.equal(fixture.cases.length, 48);
  for (const c of fixture.cases) {
    assert.equal(c.province, "NT");
    const net = nwtFamilyNet(c.year, c.household.people, fixture.defaults.spouse);
    assert.equal(net, c.expected.famNet, c.id);
    assert.equal(r4(nwtAnnual(net, c.household.kids, c.household.under6)), c.expected.provBen, c.id);
  }
});

for (const c of fixture.cases) {
  test(`NWT feature golden: ${c.id}`, () => {
    const { y, p } = data(c.year);
    const hh: Household = {
      ...fixture.defaults,
      ...c.household,
      people: c.household.people.map(p => ({ ...blank(0), ...p })),
    };
    const result = compute(y, p, hh);
    assert.equal(r4(result.famNet), c.expected.famNet);
    assert.equal(r4(result.provBen), c.expected.provBen);
  });
}

test("NWT negative controls reject both age-share blending and annualized rounded monthly amounts", () => {
  near(nwtInherited(55000, 3, 2), 931.8, "inherited reproduction");
  assert.equal(nwtAnnual(55000, 3, 2), 1059.5);
  assert.ok(
    Math.abs(nwtAnnual(55000, 3, 2) - nwtInherited(55000, 3, 2, true)) > 127,
    "fixing annual rounding alone must still fail the mixed-age test",
  );
  near(nwtInherited(30000, 1, 1), 814.92, "rounded monthly amount");
  assert.equal(nwtAnnual(30000, 1, 1), 815);
  assert.equal(nwtAnnual(30000, 6, 5), 3464);
  assert.notEqual(nwtAnnual(30000, 6, 5), nwtInherited(30000, 6, 5, true));
});

const affected = [
  4, 5, 6, 7, 10, 23, 31, 36, 39, 40, 46, 49, 50, 51, 57, 60, 61, 62, 64, 70, 77, 79, 80, 82, 91, 96, 98, 99, 100, 101,
  103, 107, 110, 111, 114, 116, 119, 121, 123, 127, 128, 133, 141, 143,
];

test("NWT independent audit reconciles both sets of 44 legacy corrections and all counterfactuals", () => {
  const other: { scenarios: Scenario[] } = JSON.parse(
    fs.readFileSync(new URL("./golden/other-income-original.json", import.meta.url), "utf8"),
  );
  let checked = 0;
  for (const year of [2025, 2026] as const) {
    const { y, p } = data(year);
    const inherited = {
      ...p,
      childBenefit: {
        name: "NWT Child Benefit",
        program: "nwt-child-benefit" as const,
        params: {
          under6: [0, 814.92, 1467, 1996.92, 2445],
          under6More: 366.96,
          over6: [0, 651.96, 1173.96, 1596.96, 1956],
          over6More: 292.92,
          fullUpTo: 30000,
          endsAt: 80000,
        },
      },
    };
    const changed: number[] = [],
      changedOther: number[] = [];
    let maxDelta = 0;
    for (const s of [...(SCENARIOS as unknown as Scenario[]), ...other.scenarios]) {
      const hh = toHousehold(s);
      const before = compute(y, inherited, hh),
        after = compute(y, p, hh);
      const net = (people: NwtPerson[]) => nwtFamilyNet(year, people, hh.spouse);
      const delta = (people: NwtPerson[]) => nwtDifference(net(people), hh.kids, hh.under6);
      const d = delta(hh.people);
      near(before.famNet, net(hh.people), "family net income before correction");
      near(after.famNet, net(hh.people), "family net income after correction");
      near(before.provBen, nwtInherited(net(hh.people), hh.kids, hh.under6), "inherited benefit");
      near(after.provBen, nwtAnnual(net(hh.people), hh.kids, hh.under6), "published benefit");
      for (const field of ["provBen", "childBen", "benefits"] as const) near(after[field] - before[field], d, field);
      for (const field of ["total", "netTotal"] as const) near(after[field] - before[field], -d, field);
      near(after.avg - before.avg, before.cash > 0 ? -d / before.cash : 0, "average rate");
      for (const key of ["ord", "oth", "cg", "ed", "nd", "fd"] as const) {
        const people = hh.people.map((p, i) => (i === hh.active ? { ...p, [key]: (p[key] ?? 0) + 100 } : p));
        const variant = compute(y, p, { ...hh, people });
        near(variant.famNet, net(people), `${key} family net income`);
        near(variant.provBen, nwtAnnual(net(people), hh.kids, hh.under6), `${key} benefit`);
        const marginalDelta =
          key === "oth"
            ? after.breakdown.margOther - before.breakdown.margOther
            : after.margBy[key] - before.margBy[key];
        near(marginalDelta, (d - delta(people)) / 100, `${key} marginal difference`);
        checked++;
      }
      const zero = hh.people.map(p => ({ ...p, cg: 0, ed: 0, nd: 0, fd: 0 }));
      const noInvestments = compute(y, p, { ...hh, people: zero });
      near(noInvestments.famNet, net(zero), "investment-free family net income");
      near(noInvestments.provBen, nwtAnnual(net(zero), hh.kids, hh.under6), "investment-free benefit");
      near(after.invTax - before.invTax, delta(zero) - d, "investment-tax difference");
      checked += 2;
      // Everything outside the listed benefit-dependent paths must remain exactly equal.
      const a = snapshot(before),
        b = snapshot(after);
      if (JSON.stringify(a) !== JSON.stringify(b)) (s.id < 148 ? changed : changedOther).push(s.id);
      for (const key of ["provBen", "childBen", "benefits", "total", "netTotal", "avg", "marg", "margBy", "invTax"]) {
        delete a[key];
        delete b[key];
      }
      assert.deepEqual(a, b, `unaffected NWT fields, ${year} scenario ${s.id}`);
      if (s.id < 148) maxDelta = Math.max(maxDelta, d);
    }
    assert.deepEqual(changed, affected, `${year} matches #116's 44 scenario IDs`);
    assert.deepEqual(changedOther, [154, 155, 156]);
    near(maxDelta, 652.44, "maximum benefit increase");
  }
  assert.equal(checked, 2528);
});

for (const year of [2025, 2026]) {
  test(`${year}: NWT mixed-age reproduction pays $1,059.50 at $55,000 family net income`, () => {
    const y = loadYear(year);
    const p = y.provinces.find(p => p.code === "NT");
    assert.ok(p);
    const hh: Household = {
      people: [{ ...blank(0), fd: 55000 }],
      active: 0,
      spouse: true,
      adults: 1,
      kids: 3,
      under6: 2,
      useBpa: true,
      whRate: 0,
      useCredits: true,
      homeValue: 0,
      rent: 0,
      monthlySpending: 0,
    };
    const r = compute(y, p, hh);
    assert.equal(r.famNet, 55000);
    assert.equal(r.provBen, 1059.5);
  });
}
