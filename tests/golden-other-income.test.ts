// Preserve PR #90's original feature snapshots separately from the locked shared scenario universe.
// The fixture was migrated byte-for-value from 9ab632a, not recaptured from the reconciled engine.
import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { loadYear } from "../src/data/load.ts";
import { computeAll } from "../src/engine/index.ts";
import { type Scenario, toHousehold } from "./golden/adapter.ts";
import { snapshot } from "./golden/snapshot.mjs";

const fixture: {
  scenarios: Scenario[];
  years: Record<string, Record<string, Record<string, unknown>>>;
} = JSON.parse(fs.readFileSync(new URL("./golden/other-income-original.json", import.meta.url), "utf8"));

for (const [year, expected] of Object.entries(fixture.years)) {
  test(`${year}: original other-income golden results for 10 households × 13 provinces`, () => {
    assert.equal(fixture.scenarios.length, 10);
    assert.equal(Object.keys(expected).length, 10);
    let checked = 0;
    for (const s of fixture.scenarios) {
      for (const { p, r } of computeAll(loadYear(Number(year)), toHousehold(s))) {
        assert.deepStrictEqual(snapshot(r), expected[s.id][p.code], `scenario ${s.id}, ${p.code}`);
        checked++;
      }
    }
    assert.equal(checked, 130);
  });
}
