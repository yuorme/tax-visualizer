import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { loadCpi, loadYear } from "../src/data/load.ts";
import { historyComparison, scaleHousehold } from "../src/engine/history.ts";
import { blank, type Household } from "../src/engine/index.ts";

const input: Household = {
  people: [{ ...blank(0), oth: 100000 }],
  active: 0,
  spouse: false,
  adults: 1,
  kids: 0,
  under6: 0,
  useBpa: false,
  useCredits: false,
  whRate: 0,
  homeValue: 200000,
  rent: 0,
  monthlySpending: 1000,
};

test("CPI scaling preserves missing other income and scales explicit zero and amounts without mutation", () => {
  const household: Household = {
    ...input,
    people: [{ ord: 20000, cg: 0, ed: 0, nd: 0, fd: 0, ded: 0 }, { ...blank(0), oth: 40000 }, blank(0)],
  };
  const before = structuredClone(household);
  const scaled = scaleHousehold(household, 0.5);
  assert.equal(Object.hasOwn(scaled.people[0], "oth"), false);
  assert.equal(scaled.people[0].ord, 10000);
  assert.equal(scaled.people[1].oth, 20000);
  assert.equal(scaled.people[2].oth, 0);
  assert.deepEqual(household, before);
});

test("other-income history goldens: CPI, itemized deductions and childcare preserve their separate bases", () => {
  // Synthetic 10%/20% progressive tax, zero provincial tax and no child benefits/carbon programs.
  // Real-year labels exercise conversion only; these are deliberately not historical Canadian tax returns.
  const data = loadYear(2025);
  const ab = data.provinces.find(p => p.code === "AB");
  assert.ok(ab);
  const specimen = {
    ...data,
    federal: {
      ...data.federal,
      brackets: [
        [50000, 0.1],
        [Infinity, 0.2],
      ] as [number, number][],
      childBenefit: { ...data.federal.childBenefit, perChildUnder6: 0, perChild6to17: 0 },
    },
    provinces: [
      {
        ...ab,
        brackets: [[Infinity, 0]] as [number, number][],
        childBenefit: undefined,
        carbon: undefined,
        propertyTax: { ...ab.propertyTax, rate: 0.01 },
      },
    ],
  };
  const years = [2019, 2025, 2026].map(year => ({ ...specimen, year }));
  const cpi = { ...loadCpi(), values: { 2019: 50, 2025: 100 } };
  const fixture: { cases: { id: string; earned?: number; realOldTax: number; nominalTax: number }[] } = JSON.parse(
    fs.readFileSync(new URL("./golden/features/history-other-income.json", import.meta.url), "utf8"),
  );
  for (const c of fixture.cases) {
    const household = structuredClone(input);
    if (c.id === "itemized") Object.assign(household.people[0], { rrsp: 5000, fhsa: 12000, ded: 3000 });
    if (c.earned !== undefined)
      household.childcare = {
        mode: "automatic",
        children: [{ age: 3, expenses: 12000 }],
        earnedIncome: [c.earned],
        declaredAnnualExpenses: 12000,
      };
    const real = historyComparison(years, cpi, household, ["AB"], "real");
    const nominal = historyComparison(years, cpi, household, ["AB"], "nominal");
    assert.deepEqual(real.omittedYears, [2026]);
    assert.equal(real.rows.length, 2);
    assert.equal(nominal.rows.length, 3);
    const rounded = (n: number) => Math.round(n * 10000) / 10000;
    assert.equal(rounded(real.rows[0].provinces[0].tax), c.realOldTax, `${c.id}: real old tax`);
    assert.equal(rounded(real.rows[1].provinces[0].tax), c.nominalTax, `${c.id}: real base tax`);
    for (const row of nominal.rows) assert.equal(rounded(row.provinces[0].tax), c.nominalTax, `${c.id}: nominal`);
    for (const row of [...real.rows, ...nominal.rows]) {
      assert.equal(row.provinces[0].income, 100000, `${c.id}: displayed income`);
      assert.equal(rounded(row.provinces[0].rate), rounded(row.provinces[0].tax / 100000), `${c.id}: tax rate`);
    }
  }
});
