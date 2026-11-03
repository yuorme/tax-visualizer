import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { loadYear } from "../src/data/load.ts";
import { provinceSchema } from "../src/data/schema.ts";
import { provincialChildBenefit } from "../src/engine/index.ts";

const fixture = JSON.parse(fs.readFileSync(new URL("./golden/bc-transition-2020.json", import.meta.url), "utf8"));
const province = loadYear(2025).provinces.find(p => p.code === "BC");
const parse = (program: string, params: unknown) =>
  provinceSchema.parse({ ...province, childBenefit: { program, params } }).childBenefit;
const params = {
  early: { ...fixture.early, weight: 0.25 },
  opportunity: { ...fixture.opportunity, weight: 0.75 },
};
const early = parse("bc-early-childhood-benefit", fixture.early);
const transition = parse("bc-child-benefit-transition", params);
const close = (actual: number, expected: number) =>
  assert.ok(Math.abs(actual - expected) < 1e-8, `${actual} != ${expected}`);

test("BC early-childhood formula matches independent golden ages, child-count and taper boundaries", () => {
  for (const c of fixture.earlyCases)
    close(provincialChildBenefit(early, c.income, 0, c.kids, false, c.young), c.expected);
});

test("2020 BC transition matches independent golden periods and each program's separate floors", () => {
  for (const c of fixture.transitionCases)
    close(provincialChildBenefit(transition, c.income, 0, c.kids, false, c.young), c.expected);
});

test("early-childhood reduction scales with young children, while the later period includes older children", () => {
  close(provincialChildBenefit(early, 125000, 0, 3, false, 2), 660); // two reductions, not one family reduction
  close(provincialChildBenefit(early, 0, 0, 3, false, 0), 0);
  close(provincialChildBenefit(transition, 0, 0, 1, false, 0), 1200); // nine months of the under-18 program
  close(provincialChildBenefit(transition, 125000, 0, 1, false, 1), 82.5); // later program exhausted first
  close(provincialChildBenefit(transition, 150000, 0, 5, false, 2), 420); // early program exhausted first
});

test("BC transition weights must be positive shares of one complete year", () => {
  for (const [a, b] of [
    [0, 1],
    [0.5, 0.4],
    [1, 1],
    [-0.25, 1.25],
  ])
    assert.throws(() =>
      parse("bc-child-benefit-transition", {
        early: { ...params.early, weight: a },
        opportunity: { ...params.opportunity, weight: b },
      }),
    );
});
