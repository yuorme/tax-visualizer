import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { loadYear } from "../src/data/load.ts";
import { household } from "../src/engine/household.ts";
import { blank, type Household, type Person } from "../src/engine/types.ts";
import { type AuditedProvince, formReturns } from "./claimants-forms.ts";
import { type Scenario, toHousehold } from "./golden/adapter.ts";
import { SCENARIOS } from "./golden/scenarios.mjs";

function verify(
  year: number,
  code: AuditedProvince,
  hh: Household,
  result: ReturnType<typeof household>,
  label: string,
) {
  const legalReturns = formReturns(year, code, hh);
  const expectedTax = legalReturns[0].reduce((sum, r) => sum + r.prov, 0);
  assert.ok(Math.abs(result.prov - expectedTax) < 1e-7, `${label} provincial tax: ${result.prov} != ${expectedTax}`);
  const actual = result.list.map(r => ({
    ti: r.ti,
    pBpaFull: r.pBpaFull,
    pSpFull: r.pSpFull,
    pEmpFull: r.pEmpFull,
    fFtc: r.fFtc,
    kidAmt: r.kidAmt,
    pKid: r.pKid,
    transferBase: r.breakdown.childTransfer.base,
    childTransferApplied: r.breakdown.childTransfer.applied,
    lowFull: r.breakdown.lowIncomeReduction.calculated,
    lowRed: r.lowRed,
    unused: r.breakdown.lowIncomeReduction.unused,
    pFtc: r.pFtc,
    prov: r.prov,
  }));
  // On equal household tax either legal whole election is valid; all person lines must match that SAME election.
  const differences = legalReturns.map(rs =>
    actual.flatMap((r, i) =>
      Object.entries(r).flatMap(([key, value]) => {
        const expected = rs[i][key as keyof typeof r];
        return Math.abs(value - expected) < 1e-7 ? [] : [`person ${i} ${key}: ${value} != ${expected}`];
      }),
    ),
  );
  assert.ok(
    differences.some(ds => ds.length === 0),
    `${label}\n${JSON.stringify(differences)}`,
  );
}

const otherIncomeScenarios: Scenario[] = JSON.parse(
  fs.readFileSync(new URL("./golden/other-income-original.json", import.meta.url), "utf8"),
).scenarios;

test("claimants: independent form constants and return lines for locked scenarios and counterfactuals", () => {
  let checked = 0;
  for (const year of [2025, 2026]) {
    const y = loadYear(year);
    for (const p of y.provinces.filter(p => p.claimants))
      for (const s of [...(SCENARIOS as unknown as Scenario[]), ...otherIncomeScenarios]) {
        const hh = toHousehold(s),
          variants = [hh];
        for (const key of ["ord", "oth", "cg", "ed", "nd", "fd"] as const)
          variants.push({
            ...hh,
            people: hh.people.map((x, i) => (i === hh.active ? { ...x, [key]: (x[key] ?? 0) + 100 } : x)),
          });
        variants.push({ ...hh, people: hh.people.map(x => ({ ...x, cg: 0, ed: 0, nd: 0, fd: 0 })) });
        for (const [index, v] of variants.entries()) {
          verify(year, p.code as AuditedProvince, v, household(y, p, v), `${year}/${p.code}/${s.id}/${index}`);
          checked++;
        }
      }
  }
  assert.equal(checked, 15168);
});

const fixture: {
  defaults: Omit<Household, "people">;
  cases: {
    id: string;
    year: number;
    province: string;
    household: Omit<Partial<Household>, "people"> & { people: Partial<Person>[] };
  }[];
} = JSON.parse(fs.readFileSync(new URL("./golden/features/claimants.json", import.meta.url), "utf8"));

test("claimants: independent return lines for feature goldens and reversed spouses", () => {
  for (const c of fixture.cases) {
    if (c.province === "ON") continue; // Existing Ontario behavior is outside this six-province worksheet.
    const y = loadYear(c.year),
      p = y.provinces.find(p => p.code === c.province);
    assert.ok(p);
    const hh = { ...fixture.defaults, ...c.household, people: c.household.people.map(x => ({ ...blank(0), ...x })) };
    verify(c.year, c.province as AuditedProvince, hh, household(y, p, hh), c.id);
    if (hh.spouse && hh.people.length === 2) {
      const reversed = { ...hh, people: [...hh.people].reverse() };
      verify(c.year, c.province as AuditedProvince, reversed, household(y, p, reversed), `${c.id}/reversed`);
    }
  }
});

test("claimants: audit rejects reversed PE order even when household tax is unchanged", () => {
  const y = loadYear(2025),
    p = y.provinces.find(p => p.code === "PE");
  assert.ok(p?.claimants?.lowIncomeReduction);
  p.claimants.lowIncomeReduction.order = "after-foreign-tax-credit";
  const hh = { ...fixture.defaults, spouse: false, adults: 1, whRate: 0.4, people: [{ ...blank(0), fd: 20000 }] };
  const wrong = household(y, p, hh);
  assert.equal(wrong.prov, 0); // Both orders give zero here; the individual form lines distinguish them.
  assert.throws(() => verify(2025, "PE", hh, wrong, "deliberately reversed PE order"), /pFtc/);
});
