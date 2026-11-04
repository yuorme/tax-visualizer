import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { loadYear } from "../src/data/load.ts";
import { blank, creditsOf, type Household, household, type Person } from "../src/engine/index.ts";

const cases: {
  id: string;
  year: number;
  province: string;
  people: Partial<Person>[];
  childcare?: Household["childcare"];
  expectedNets: number[];
  expectedCwb: number;
}[] = JSON.parse(fs.readFileSync(new URL("./golden/features/cwb-secondary-cap.json", import.meta.url), "utf8")).cases;

function input(people: Person[]): Household {
  return {
    people,
    active: 0,
    adults: people.length,
    spouse: true,
    kids: 0,
    under6: 0,
    useBpa: true,
    useCredits: true,
    whRate: 0,
    homeValue: 0,
    rent: 0,
    monthlySpending: 0,
  };
}

// Values were calculated independently from Schedule 6; derivations are in verification/102-cwb-secondary-cap.md.
// Reverse both people and per-person childcare earnings, so input order cannot select the exemption's owner.
for (const c of cases) {
  for (const reverse of [false, true]) {
    test(`CWB secondary cap golden: ${c.id}, ${reverse ? "reversed" : "original"} partners`, () => {
      const y = loadYear(c.year);
      const p = y.provinces.find(p => p.code === c.province);
      assert.ok(p);
      const people = c.people.map(person => ({ ...blank(0), ...person }));
      const nets = [...c.expectedNets];
      const childcare = structuredClone(c.childcare);
      if (reverse) {
        people.reverse();
        nets.reverse();
        childcare?.earnedIncome?.reverse();
      }
      const hh = { ...input(people), childcare };
      const r = household(y, p, hh);
      assert.deepEqual(r.breakdown.incomeBases.federal, nets);
      const cwb = r.credits.find(([name]) => name === "Canada Workers Benefit")?.[1] ?? 0;
      assert.ok(Math.abs(cwb - c.expectedCwb) < 1e-8, `${cwb} vs ${c.expectedCwb}`);
      if (childcare) {
        assert.deepEqual(r.childcare.claims, reverse ? [8000, 0] : [0, 8000]);
      } else {
        // Public credit callers without allocated childcare can derive the same net incomes from Person.
        const direct = creditsOf(y.federal, p, {
          famNet: r.famNet,
          famEmp: people.reduce((sum, person) => sum + person.ord, 0),
          couple: true,
          kids: 0,
          ppl: people,
          propTax: 0,
          rent: 0,
        });
        assert.equal(direct.find(([name]) => name === "Canada Workers Benefit")?.[1] ?? 0, cwb);
      }
    });
  }
}

for (const year of [2025, 2026]) {
  test(`${year}: CWB caps the secondary earner exemption at their net income`, () => {
    const y = loadYear(year);
    const p = y.provinces.find(p => p.code === "ON");
    assert.ok(p);
    const r = household(y, p, input([blank(45_000), { ...blank(15_000), ded: 14_000 }]));
    assert.equal(r.famNet, 45_470);
    const actual = r.credits.find(([name]) => name === "Canada Workers Benefit")?.[1] ?? 0;
    assert.ok(Math.abs(actual - (year === 2025 ? 721.1 : 868.9)) < 1e-8, `CWB ${actual}`);
  });
  test(`${year}: the secondary cap does not alter single or unrelated-adult CWB`, () => {
    const y = loadYear(year);
    const p = y.provinces.find(p => p.code === "ON");
    assert.ok(p);
    for (const people of [[blank(30_000)], [blank(30_000), { ...blank(15_000), ded: 14_000 }]]) {
      const r = household(y, p, { ...input(people), spouse: false });
      const cwb = r.credits.find(([name]) => name === "Canada Workers Benefit")?.[1] ?? 0;
      assert.ok(Math.abs(cwb - (year === 2025 ? 1201 : 1313.55)) < 1e-8);
    }
  });
}
