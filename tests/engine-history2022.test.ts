import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { loadYear } from "../src/data/load.ts";
import { provinceSchema } from "../src/data/schema.ts";
import { provincialChildBenefit } from "../src/engine/index.ts";

const fixture = JSON.parse(fs.readFileSync(new URL("./golden/bc-periods-2022.json", import.meta.url), "utf8"));
const province = loadYear(2025).provinces.find(p => p.code === "BC");
const parse = (params: unknown) =>
  provinceSchema.parse({ ...province, childBenefit: { program: fixture.program, params } }).childBenefit;
const benefit = parse(fixture.params);
const close = (actual: number, expected: number) =>
  assert.ok(Math.abs(actual - expected) < 1e-8, `${actual} != ${expected}`);

test("2022 BC periods match independently calculated golden cases at material boundaries", () => {
  for (const c of fixture.cases) {
    close(provincialChildBenefit(benefit, c.income, 0, c.kids, c.single), c.expected);
  }
});

test("BC periods apply each annual minimum and zero floor before weighting", () => {
  // At 50,000, baseline is already at its $700 minimum; enhancement still pays $1332.24.
  close(provincialChildBenefit(benefit, 50000, 0, 1, false), 0.75 * 700 + 0.25 * 1332.24);
  // At 100,078, baseline is exhausted; enhancement still pays $600 annually.
  close(provincialChildBenefit(benefit, 100078, 0, 1, false), 150);
  const single = parse({ periods: fixture.params.periods.map((p: object) => ({ ...p, singleParent: 200 })) });
  close(provincialChildBenefit(single, 0, 0, 1, true), 1975);
  close(provincialChildBenefit(single, 0, 0, 1, false), 1775);
});

test("BC period weights must cover exactly one benefit year", () => {
  for (const weights of [[], [0.5, 0.4], [1, 1], [0, 1], [-0.25, 1.25]]) {
    assert.throws(() => parse({ periods: weights.map((weight, i) => ({ ...fixture.params.periods[i], weight })) }));
  }
});
