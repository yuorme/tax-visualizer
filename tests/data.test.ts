// Every year's data files must pass the schema, and a few cross-checks the schema can't express.
import assert from "node:assert/strict";
import test from "node:test";
import { listYears, loadYear } from "../src/data/load.ts";

for (const year of listYears()) {
  test(`data/years/${year} is valid`, () => {
    const y = loadYear(year);
    assert.deepEqual([...y.provinces.map(p => p.code)].sort(), [
      "AB",
      "BC",
      "MB",
      "NB",
      "NL",
      "NS",
      "NT",
      "NU",
      "ON",
      "PE",
      "QC",
      "SK",
      "YT",
    ]);
    for (const code of Object.keys(y.federal.workersBenefit.regional))
      assert.ok(
        y.provinces.some(p => p.code === code),
        `workersBenefit.regional.${code} is not a province`,
      );
  });
}
