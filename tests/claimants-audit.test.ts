import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { loadYear } from "../src/data/load.ts";
import type { Province, YearData } from "../src/data/schema.ts";
import { household } from "../src/engine/household.ts";
import type { Household } from "../src/engine/types.ts";
import { type Scenario, toHousehold } from "./golden/adapter.ts";
import { SCENARIOS } from "./golden/scenarios.mjs";

const close = (a: number, b: number, label: string) => assert.ok(Math.abs(a - b) < 1e-7, `${label}: ${a} != ${b}`);
// Independent return-line arithmetic. Neutral results supply ONLY unchanged income, payroll, bracket tax,
// spouse amounts and federal FTC. No claimant, child-credit or reduction output is used as an expectation.
function independent(y: YearData, p: Province, hh: Household) {
  const neutral = { ...p, claimants: undefined, childAmount: undefined, lowIncomeReduction: undefined };
  const n = household(y, neutral, hh),
    rs = n.list,
    couple = hh.spouse && rs.length === 2,
    rate = p.brackets[0][1];
  const c = rs.length === 2 && rs[1].ti > rs[0].ti ? 1 : 0;
  const tax = rs.map(r => Math.max(0, r.pr.tax - r.pBpaFull - r.pSpFull - r.pEmpFull));
  // The return limits the initial claim to the lower income. With equal bases, neither spouse is
  // excluded: compare the two algebraic household outcomes, including the NS reduction interaction.
  const incomes = rs.map(r => (p.code === "SK" ? r.tiP : r.ti));
  const owners =
    !couple || !p.childAmount
      ? [c]
      : Math.abs(incomes[0] - incomes[1]) < 1e-9
        ? [0, 1]
        : [incomes[0] < incomes[1] ? 0 : 1];
  const forOwner = (owner: number) => {
    const child = rs.map(() => 0),
      transfer = rs.map(() => 0);
    if (p.childAmount) {
      child[owner] = (p.childAmount.ages === "all" ? hh.kids : hh.under6) * p.childAmount.perChild;
      if (couple && (p.code === "SK" || p.code === "NU")) {
        // SK(S2)/NU(S2) line 6 minus line 12: no spouse, dividend or foreign credits in capacity.
        const needed = Math.max(0, rs[owner].pr.tax / rate - rs[owner].pBpaFull / rate - rs[owner].pEmpFull / rate);
        transfer[1 - owner] = Math.max(0, child[owner] - needed);
      }
    }
    const beforeForeign = tax.map((t, i) => Math.max(0, t - (child[i] + transfer[i]) * rate - rs[i].pDtcFull));
    const afterForeign = beforeForeign.map(
      (t, i) => t - Math.min(rs[i].wh - rs[i].fFtc, rs[i].ti ? (t * rs[i].x.fd) / rs[i].ti : 0),
    );
    const q = p.lowIncomeReduction?.params as Record<string, number> | undefined;
    const expected = afterForeign;
    if (q) {
      const single = rs.length === 1 && hh.adults === 1,
        fam = couple || (single && hh.kids > 0);
      const reduction = (fn: number, k: number) => {
        const amount =
          p.code === "NL"
            ? Math.max(
                0,
                q.individual +
                  (fam ? q.family : 0) -
                  q.rate * Math.max(0, fn - (fam ? q.thresholdFamily : q.thresholdIndividual)),
              )
            : p.code === "NB"
              ? Math.max(0, q.amount * (fam ? 2 : 1) - q.rate * Math.max(0, fn - q.threshold))
              : Math.max(0, q.individual + (fam ? q.spouse : 0) + q.child * k - q.rate * Math.max(0, fn - q.threshold));
        return amount;
      };
      const amount = reduction(n.famNet, hh.kids - (single && hh.kids > 0 ? 1 : 0));
      if (!couple)
        return afterForeign.reduce(
          (sum, t, i) =>
            sum + Math.max(0, t - reduction(rs[i].ti, i === c ? hh.kids - (single && hh.kids > 0 ? 1 : 0) : 0)),
          0,
        );
      // Without transfer the greatest individual tax capacity determines the household saving.
      // With transfer the family can exhaust the sum of both capacities, but never refund a balance.
      const capacity = p.code === "NS" ? Math.max(...afterForeign) : afterForeign.reduce((a, b) => a + b, 0);
      return afterForeign.reduce((a, b) => a + b, 0) - Math.min(capacity, amount);
    }
    return expected.reduce((a, b) => a + b, 0);
  };
  return Math.min(...owners.map(forOwner));
}
const otherIncomeScenarios: Scenario[] = JSON.parse(
  fs.readFileSync(new URL("./golden/other-income-original.json", import.meta.url), "utf8"),
).scenarios;

test("claimants: independent return-line arithmetic for locked scenarios and counterfactuals", () => {
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
        for (const v of variants) {
          const result = household(y, p, v);
          close(result.prov, independent(y, p, v), `${year}/${p.code}/${s.id}`);
          checked++;
        }
      }
  }
  assert.equal(checked, 15168);
});
