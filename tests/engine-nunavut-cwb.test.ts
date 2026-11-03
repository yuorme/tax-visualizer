import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { loadYear } from "../src/data/load.ts";
import { federalSchema } from "../src/data/schema.ts";
import { blank, creditsOf } from "../src/engine/index.ts";

const y = loadYear(2025);
const nu = y.provinces.find(p => p.code === "NU");
assert.ok(nu);
const federal = federalSchema.parse({
  ...y.federal,
  workersBenefit: {
    ...y.federal.workersBenefit,
    secondaryEarnerExemption: 0,
    regional: {
      NU: {
        max: [1085, 1630],
        rate: [0.1, 0.14],
        floor: [6000, 6000],
        threshold: [21654, 29551],
        phaseOut: [0.04, 0.08],
      },
    },
  },
});
const cases: {
  id: string;
  work: number;
  net: number;
  couple: boolean;
  kids: number;
  scalar?: number;
  expected: number;
}[] = JSON.parse(fs.readFileSync(new URL("./golden/nunavut-cwb-rates.json", import.meta.url), "utf8"));
for (const c of cases) {
  test(`Nunavut CWB golden: ${c.id}`, () => {
    const fed = structuredClone(federal);
    if (c.scalar !== undefined) fed.workersBenefit.regional.NU.rate = c.scalar;
    const result = creditsOf(fed, nu, {
      famNet: c.net,
      famEmp: c.work,
      couple: c.couple,
      kids: c.kids,
      ppl: c.couple ? [blank(c.work / 2), blank(c.work / 2)] : [blank(c.work)],
      propTax: 0,
      rent: 0,
    });
    const actual = result.find(([name]) => name === "Canada Workers Benefit")?.[1] ?? 0;
    assert.ok(Math.abs(actual - c.expected) < 1e-8, `${actual} vs ${c.expected}`);
  });
}

test("CWB rate pairs are exactly two valid rates while standard rates remain scalar", () => {
  for (const invalid of [[0.1], [0.1, 0.14, 0.2], [-0.1, 0.14], [0.1, 1.1]]) {
    const f = structuredClone(federal);
    assert.equal(
      federalSchema.safeParse({
        ...f,
        workersBenefit: { ...f.workersBenefit, regional: { NU: { ...f.workersBenefit.regional.NU, rate: invalid } } },
      }).success,
      false,
    );
  }
});
