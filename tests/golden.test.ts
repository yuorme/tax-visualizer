// Regression test: the engine must reproduce the locked results in tests/golden/<year>.json for every scenario
// and every province, to the hundredth of a cent. A difference means a calculation changed. If the change is
// intended (a data correction or a rule fix), say so in the commit and re-capture the fixture.
// Runs for every year in data/years/. A year without a fixture fails: capture it with
// `npm run golden:capture -- <year>` once the year's data is verified.
import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { listYears, loadYear } from "../src/data/load.ts";
import { computeAll } from "../src/engine/index.ts";
import { type Scenario, toHousehold } from "./golden/adapter.ts";
import { SCENARIOS } from "./golden/scenarios.mjs";
import { snapshot } from "./golden/snapshot.mjs";

const dir = new URL("./golden/", import.meta.url);
const fixtures = fs
  .readdirSync(dir)
  .filter(f => /^\d{4}\.json$/.test(f))
  .map(f => Number(f.slice(0, 4)));

test("every data year has golden results and every golden file has data", () => {
  const years = listYears();
  const missing = years.filter(y => !fixtures.includes(y));
  assert.deepEqual(missing, [], `no tests/golden/<year>.json for ${missing}: run npm run golden:capture -- <year>`);
  const orphaned = fixtures.filter(y => !years.includes(y));
  assert.deepEqual(orphaned, [], `tests/golden/<year>.json for ${orphaned} has no data/years/<year>/`);
});

for (const year of fixtures.filter(y => listYears().includes(y))) {
  test(`${year}: engine matches locked results for ${SCENARIOS.length} households × 13 provinces`, () => {
    const fixture = JSON.parse(fs.readFileSync(new URL(`${year}.json`, dir), "utf8"));
    assert.equal(fixture.year, year, `tests/golden/${year}.json says year ${fixture.year}`);
    assert.equal(fixture.scenarios.length, SCENARIOS.length, "fixture and scenarios.mjs have different lengths");
    const data = loadYear(year);
    let checked = 0;
    for (const s of SCENARIOS as unknown as Scenario[]) {
      const expected = fixture.scenarios.find((f: { id: number }) => f.id === s.id)?.results;
      assert.ok(expected, `scenario ${s.id} missing from tests/golden/${year}.json`);
      for (const { p, r } of computeAll(data, toHousehold(s))) {
        assert.deepStrictEqual(snapshot(r), expected[p.code], `scenario ${s.id} (${JSON.stringify(s)}), ${p.code}`);
        checked++;
      }
    }
    assert.equal(checked, SCENARIOS.length * 13);
  });
}
