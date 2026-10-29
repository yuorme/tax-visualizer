// Regression test: the engine must reproduce the locked results in tests/golden/<year>.json for every scenario
// and every province, to the hundredth of a cent. A difference means a calculation changed. If the change is
// intended (a data correction or a rule fix), say so in the commit and re-capture the fixture.
import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { loadYear } from "../src/data/load.ts";
import { computeAll } from "../src/engine/index.ts";
import { toHousehold, type Scenario } from "./golden/adapter.ts";
import { SCENARIOS } from "./golden/scenarios.mjs";
import { snapshot } from "./golden/snapshot.mjs";

const year = 2026;
const fixture = JSON.parse(fs.readFileSync(new URL(`./golden/${year}.json`, import.meta.url), "utf8"));
const data = loadYear(year);

test(`${year}: engine matches locked results for ${SCENARIOS.length} households × 13 provinces`, () => {
  let checked = 0;
  for (const s of SCENARIOS as Scenario[]) {
    const expected = fixture.scenarios.find((f: { id: number }) => f.id === s.id).results;
    for (const { p, r } of computeAll(data, toHousehold(s))) {
      assert.deepStrictEqual(snapshot(r), expected[p.code], `scenario ${s.id} (${JSON.stringify(s)}), ${p.code}`);
      checked++;
    }
  }
  assert.equal(checked, SCENARIOS.length * 13);
});
