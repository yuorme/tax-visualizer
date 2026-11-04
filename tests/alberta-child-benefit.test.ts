import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { loadYear } from "../src/data/load.ts";
import { blank, compute, type Household, provincialChildBenefit } from "../src/engine/index.ts";
import {
  type AlbertaPerson,
  type AlbertaYear,
  albertaAnnual,
  albertaIncome,
  published,
} from "./alberta-child-benefit-reference.ts";
import { type Scenario, toHousehold } from "./golden/adapter.ts";
import { SCENARIOS } from "./golden/scenarios.mjs";
import { snapshot } from "./golden/snapshot.mjs";

interface Feature {
  id: string;
  year: AlbertaYear;
  net: number;
  earned: number;
  kids: number;
  person: AlbertaPerson;
  calculation: { base: number; working: number };
  expected: number;
}
const fixture: { defaults: Omit<Household, "people">; cases: Feature[] } = JSON.parse(
  fs.readFileSync(new URL("./golden/features/alberta-child-benefit.json", import.meta.url), "utf8"),
);
const years = new Map(([2025, 2026] as const).map(year => [year, loadYear(year)]));
const data = (year: AlbertaYear) => {
  const y = years.get(year);
  assert.ok(y);
  const p = y.provinces.find(p => p.code === "AB");
  assert.ok(p);
  return { y, p };
};
const near = (actual: number, expected: number, label: string) =>
  assert.ok(Math.abs(actual - expected) < 1e-7, `${label}: ${actual} != ${expected}`);

test("Alberta feature IDs are unique and published schedules reproduce independent Decimal expectations", () => {
  assert.equal(new Set(fixture.cases.map(c => c.id)).size, fixture.cases.length);
  assert.equal(fixture.cases.length, 177);
  for (const c of fixture.cases) {
    const income = albertaIncome(c.year, [c.person], true);
    near(income.net, c.net, c.id);
    near(income.earned, c.earned, c.id);
    near(albertaAnnual(c.year, c.net, c.earned, c.kids), c.expected, c.id);
    const total = c.calculation.base + c.calculation.working;
    near(total > 0 ? Math.max(10, total) : 0, c.expected, `${c.id}: combined minimum`);
  }
});

for (const c of fixture.cases) {
  test(`Alberta feature golden: ${c.id}`, () => {
    const { y, p } = data(c.year);
    near(provincialChildBenefit(p.childBenefit, c.net, c.earned, c.kids, true), c.expected, "direct benefit");
    const hh: Household = { ...fixture.defaults, kids: c.kids, people: [{ ...blank(0), ...c.person }] };
    const result = compute(y, p, hh);
    near(result.famNet, c.net, "family net income");
    near(result.provBen, c.expected, "integrated benefit");
  });
}

test("Alberta corrected data selects the existing statutory program without estimated parameters", () => {
  for (const year of [2025, 2026] as const) {
    const b = data(year).p.childBenefit;
    assert.equal(b?.program, "alberta-child-family-benefit-by-child");
    assert.equal(b?.estimated, undefined);
    assert.deepEqual(b?.params, {
      base: published[year].base,
      baseRate: [0.0805, 0.1207, 0.1609, 0.2011],
      baseThreshold: published[year].baseStart,
      working: published[year].work,
      workingRate: 0.15,
      workingFloor: 2760,
      workingThreshold: published[year].workStart,
      workingPhaseOut: [0.034, 0.0649, 0.0834, 0.0895],
      minAnnual: 10,
    });
  }
});

test("Alberta negative controls distinguish approximate base rates and the incorrect 15% phase-out", () => {
  for (const year of [2025, 2026] as const)
    for (const kids of [1, 2, 3, 4, 5]) {
      const base = fixture.cases.find(c => c.id === `ab-${year}-${kids}-base-reduction`);
      const work = fixture.cases.find(c => c.id === `ab-${year}-${kids}-working-survives`);
      assert.ok(base && work);
      assert.notEqual(albertaAnnual(year, base.net, base.earned, kids, true), base.expected);
      assert.equal(albertaAnnual(year, work.net, work.earned, kids, true), 0);
      assert.ok(work.expected > 250, "statutory working benefit remains material after the old rule extinguishes it");
    }
});

test("Alberta minimum applies once to the combined amount, and never creates a zero-entitlement payment", () => {
  for (const year of [2025, 2026] as const) {
    const { p } = data(year);
    for (const kids of [1, 2, 3, 4, 5]) {
      for (const label of ["combined-minimum", "combined-above-minimum"]) {
        const c = fixture.cases.find(c => c.id === `ab-${year}-${kids}-${label}`);
        assert.ok(c);
        assert.ok(c.calculation.base > 0 && c.calculation.base < 10);
        assert.ok(c.calculation.working > 0 && c.calculation.working < 10);
        assert.ok(c.expected < 20, "separate component minima incorrectly pay $20");
        if (label === "combined-minimum") assert.equal(c.expected, 10);
        else assert.ok(c.expected > 10, "the unrounded combined amount must exceed the minimum");
        near(provincialChildBenefit(p.childBenefit, c.net, c.earned, kids, true), c.expected, c.id);
      }
      assert.equal(provincialChildBenefit(p.childBenefit, 100000, 20000, kids, true), 0);
    }
  }
});

test("Alberta low earnings can reduce the working component when a fourth child raises its reduction rate", () => {
  for (const year of [2025, 2026] as const) {
    const { y, p } = data(year);
    const results = [3, 4].map(kids => {
      const c = fixture.cases.find(c => c.id === `ab-${year}-${kids}-low-earnings-reduction`);
      assert.ok(c);
      assert.equal(c.calculation.base, 0);
      const result = compute(y, p, { ...fixture.defaults, kids, people: [{ ...blank(0), ...c.person }] });
      near(result.provBen, c.expected, c.id);
      return result;
    });
    assert.ok(results[1].provBen < results[0].provBen, "larger child-count reduction exceeds unchanged phase-in");
    assert.ok(results[1].benefits > results[0].benefits, "CCB offsets this specific provincial decline");
  }
});

test("Alberta independent audit reconciles legacy benefit, tax, marginal and investment changes", () => {
  const other: { scenarios: Scenario[] } = JSON.parse(
    fs.readFileSync(new URL("./golden/other-income-original.json", import.meta.url), "utf8"),
  );
  let checked = 0;
  for (const year of [2025, 2026] as const) {
    const { y, p } = data(year);
    const q = published[year];
    const inherited = {
      ...p,
      childBenefit: {
        program: "alberta-child-family-benefit" as const,
        params: {
          base: q.base,
          baseRate: [0.08, 0.12, 0.16, 0.2],
          baseThreshold: q.baseStart,
          working: q.work,
          workingRate: 0.15,
          workingFloor: 2760,
          workingThreshold: q.workStart,
          workingPhaseOut: 0.15,
        },
      },
    };
    for (const s of [...(SCENARIOS as unknown as Scenario[]), ...other.scenarios]) {
      const hh = toHousehold(s);
      const before = compute(y, inherited, hh),
        after = compute(y, p, hh);
      const difference = (people: AlbertaPerson[]) => {
        const { net, earned } = albertaIncome(year, people, hh.spouse);
        return albertaAnnual(year, net, earned, hh.kids) - albertaAnnual(year, net, earned, hh.kids, true);
      };
      const d = difference(hh.people);
      const verify = (people: typeof hh.people) => {
        const { net, earned } = albertaIncome(year, people, hh.spouse);
        const actual = compute(y, p, { ...hh, people });
        near(actual.famNet, net, "independent family net income");
        near(actual.provBen, albertaAnnual(year, net, earned, hh.kids), "independent ACFB");
        checked++;
      };
      verify(hh.people);
      const { net, earned } = albertaIncome(year, hh.people, hh.spouse);
      near(before.provBen, albertaAnnual(year, net, earned, hh.kids, true), "inherited ACFB");
      for (const key of ["provBen", "childBen", "benefits"] as const) near(after[key] - before[key], d, key);
      for (const key of ["total", "netTotal"] as const) near(after[key] - before[key], -d, key);
      near(after.avg - before.avg, before.cash > 0 ? -d / before.cash : 0, "average tax rate");
      for (const key of ["ord", "oth", "cg", "ed", "nd", "fd"] as const) {
        const people = hh.people.map((p, i) => (i === hh.active ? { ...p, [key]: (p[key] ?? 0) + 100 } : p));
        verify(people);
        const actual =
          key === "oth"
            ? after.breakdown.margOther - before.breakdown.margOther
            : after.margBy[key] - before.margBy[key];
        near(actual, (d - difference(people)) / 100, `${key} marginal change`);
      }
      const zero = hh.people.map(p => ({ ...p, cg: 0, ed: 0, nd: 0, fd: 0 }));
      verify(zero);
      near(after.invTax - before.invTax, difference(zero) - d, "investment-tax change");
      const a = snapshot(before),
        b = snapshot(after);
      for (const key of ["provBen", "childBen", "benefits", "total", "netTotal", "avg", "marg", "margBy", "invTax"]) {
        delete a[key];
        delete b[key];
      }
      assert.deepEqual(a, b, `${year}/${s.id}: unrelated fields remain identical`);
    }
  }
  assert.equal(checked, 2528);
});
