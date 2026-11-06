// Compare complete fixtures with independently derived proposals. No engine imports or capture mode.
import assert from "node:assert/strict";
import fs from "node:fs";
import { execFileSync } from "node:child_process";
import { existingChanges, newFixture } from "./calculate.mjs";
const at = (ref, file) => JSON.parse(execFileSync("git", ["show", `${ref}:${file}`], { encoding: "utf8", maxBuffer: 20e6 }));
const current = file => JSON.parse(fs.readFileSync(file, "utf8"));
const changes = existingChanges();
const counts = {};
let reviewCases = 0, reviewValues = 0;
for (const file of new Set(changes.map(c => c.file))) {
  const before = at("1ecf27a", file);
  const proposed = structuredClone(before);
  const reviewed = at("4f6227b", file);
  for (const c of changes.filter(c => c.file === file)) {
    const item = proposed.cases.find(x => x.id === c.id);
    assert.ok(item.year === 2025 || item.year === 2026);
    assert.ok(item.household.people.some(x => x.age >= 65));
    assert.deepEqual(Object.keys(item.expected), Object.keys(c.expected));
    for (const [key, value] of Object.entries(item.expected))
      if (key.startsWith("breakdown.gisAllowance")) assert.equal(c.expected[key], value, `${item.id}: GIS unchanged`);
    item.expected = c.expected;
    if (item.expectedCredits) item.expectedCredits = c.expectedCredits;
    const key = `${c.year}-${c.province}`;
    counts[key] ??= { cases: 0, values: 0 };
    counts[key].cases++;
    counts[key].values += c.fields;
    const prior = reviewed.cases.find(x => x.id === c.id);
    const moved = Object.keys(c.expected).filter(k => c.expected[k] !== prior.expected[k]).length +
      Object.keys(c.expectedCredits).filter(k => c.expectedCredits[k] !== prior.expectedCredits?.[k]).length;
    if (moved) reviewCases++;
    reviewValues += moved;
  }
  assert.deepEqual(current(file), proposed, `${file}: no unrelated inputs, keys, values or cases changed`);
}
const featureFile = "tests/golden/features/senior-supplements.json";
const feature = current(featureFile);
assert.deepEqual(feature, newFixture(), "new fixture agrees with independent calculator");
const reviewedFeature = at("4f6227b", featureFile);
let correctedFeatureCases = 0, correctedFeatureValues = 0;
for (const before of reviewedFeature.cases) {
  const after = feature.cases.find(c => c.id === before.id);
  assert.ok(after, `${before.id}: existing feature case retained`);
  assert.deepEqual(after.household, before.household, `${before.id}: inputs unchanged`);
  assert.deepEqual(Object.keys(after), Object.keys(before), `${before.id}: assertion shape unchanged`);
  let moved = 0;
  for (const key of ["cash", "reported"]) {
    assert.equal(after[key]?.length, before[key]?.length);
    for (let i = 0; i < (before[key]?.length ?? 0); i++) if (after[key][i] !== before[key][i]) moved++;
  }
  assert.deepEqual(after.expectedCredits, before.expectedCredits);
  if (moved) {
    assert.ok(before.household.people.some(x => x.age >= 65));
    assert.ok(before.year === 2025 || before.year === 2026);
    assert.equal(before.province, "SK");
    correctedFeatureCases++;
    correctedFeatureValues += moved;
  }
}
assert.deepEqual(feature.monthlyCases, reviewedFeature.monthlyCases, "published Ontario rows unchanged");
for (const year of [2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026]) {
  const file = `tests/golden/${year}.json`;
  assert.equal(fs.readFileSync(file, "utf8"), execFileSync("git", ["show", `1ecf27a:${file}`],
    { encoding: "utf8", maxBuffer: 20e6 }), `${year}: annual golden byte-identical`);
}
console.log(JSON.stringify({ legacyCases: changes.length, legacyValues: changes.reduce((sum, c) => sum + c.fields, 0),
  counts, reviewLegacyCases: reviewCases, reviewLegacyValues: reviewValues,
  correctedFeatureCases, correctedFeatureValues, newHouseholdCases: feature.cases.length,
  addedThisReview: feature.cases.length - reviewedFeature.cases.length, monthlyRows: feature.monthlyCases.length }, null, 2));
