import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { loadYear } from "../src/data/load.ts";
import { computeAll } from "../src/engine/index.ts";
import { type Scenario, toHousehold } from "./golden/adapter.ts";
import { snapshot } from "./golden/snapshot.mjs";

const original: { scenarios: Scenario[] } = JSON.parse(
  fs.readFileSync(new URL("./golden/other-income-original.json", import.meta.url), "utf8"),
);
interface CarbonExpectation {
  gasoline: number;
  heating: number;
  charges: number;
  rebate: number;
  credits: [string, number][];
  marginal: Record<"ord" | "oth" | "cg" | "ed" | "nd" | "fd", number>;
  investmentTaxChange: number;
}
const fixture: { years: Record<string, Record<string, Record<string, CarbonExpectation>>> } = JSON.parse(
  fs.readFileSync(new URL("./golden/other-income-carbon.json", import.meta.url), "utf8"),
);
const round = (n: number) => Math.round(n * 10000) / 10000 || 0;

for (const [year, cases] of Object.entries(fixture.years)) {
  test(`${year}: every original other-income specimen reconciles to independently calculated active carbon`, () => {
    const active = loadYear(Number(year));
    const frozen = structuredClone(active);
    for (const p of frozen.provinces) delete p.carbon;
    let count = 0;
    for (const s of original.scenarios) {
      const hh = toHousehold(s);
      const old = computeAll(frozen, hh);
      for (const { p, r } of computeAll(active, hh)) {
        const before = old.find(row => row.p.code === p.code)?.r;
        assert.ok(before);
        const expected = cases[s.id][p.code];
        const at = `${year}/${s.id}/${p.code}`;
        assert.equal(round(r.carbon?.gasoline ?? 0), expected.gasoline, `${at}: gasoline`);
        assert.equal(round(r.carbon?.heating ?? 0), expected.heating, `${at}: heating`);
        assert.equal(round(r.gross - before.gross), expected.charges, `${at}: gross change`);
        assert.equal(round(r.refund - before.refund), expected.rebate, `${at}: rebate`);
        assert.equal(round(r.benefits - before.benefits), expected.rebate, `${at}: benefit change`);
        assert.equal(round(r.total - before.total), round(expected.charges - expected.rebate), `${at}: total`);
        assert.equal(round(r.netTotal - before.netTotal), round(-expected.rebate), `${at}: net tax`);
        assert.deepEqual(
          r.credits.slice(before.credits.length).map(([name, amount]) => [name, round(amount)]),
          expected.credits,
          `${at}: named payments`,
        );
        for (const key of ["ord", "cg", "ed", "nd", "fd"] as const)
          assert.equal(round(r.margBy[key] - before.margBy[key]), expected.marginal[key], `${at}: ${key} marginal`);
        assert.equal(
          round(r.breakdown.margOther - before.breakdown.margOther),
          expected.marginal.oth,
          `${at}: other marginal`,
        );
        assert.equal(round(r.invTax - before.invTax), expected.investmentTaxChange, `${at}: investment change`);
        assert.equal(round((r.avg - before.avg) * r.base), round(expected.charges - expected.rebate), `${at}: average`);
        assert.equal(round((r.grossAvg - before.grossAvg) * r.base), expected.charges, `${at}: gross average`);
        const changed = new Set([
          "gross",
          "total",
          "refund",
          "benefits",
          "netTotal",
          "marg",
          "margBy",
          "invTax",
          "avg",
          "grossAvg",
          "credits",
        ]);
        const unchanged = (result: typeof r) =>
          Object.fromEntries(Object.entries(snapshot(result)).filter(([key]) => !changed.has(key)));
        assert.deepEqual(unchanged(r), unchanged(before), `${at}: non-carbon results`);
        count++;
      }
    }
    assert.equal(count, 130);
  });
}
