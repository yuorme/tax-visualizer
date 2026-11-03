import assert from "node:assert/strict";
import { test } from "node:test";
import {
  displayDistance,
  displayEfficiency,
  distanceText,
  efficiencyText,
  metricDistance,
  metricEfficiency,
} from "../src/ui/driving-units.ts";

test("distance uses international miles, including fractional distances", () => {
  assert.equal(metricDistance(10000, "us"), 16093.44);
  assert.equal(displayDistance(16093.44, "us"), 10000);
  assert.equal(metricDistance(0.5, "us"), 0.804672);
  assert.equal(metricDistance(12345.678, "metric"), 12345.678);
  assert.equal(displayDistance(0, "us"), 0);
  assert.equal(distanceText(displayDistance(16200, "us")), "10,066.213");
});

test("30 US mpg consumes 7.840486111111111 litres per 100 km, not the imperial-gallon value", () => {
  // Independent dimensional calculation: 100 km / (30 miles × 1.609344 km/mile) × 3.785411784 L.
  assert.ok(Math.abs(metricEfficiency(30, "us") - 7.840486111111111) < 1e-12);
  assert.ok(Math.abs(displayEfficiency(7.840486111111111, "us") - 30) < 1e-12);
  assert.equal(metricEfficiency(9.5, "metric"), 9.5);
  assert.equal(efficiencyText(displayEfficiency(9, "us")), "26.134954");
});

test("no gasoline is infinite mpg and stays zero consumption in either unit", () => {
  assert.equal(displayEfficiency(0, "us"), Infinity);
  assert.equal(efficiencyText(displayEfficiency(0, "us")), "∞");
  assert.equal(metricEfficiency(Infinity, "us"), 0);
  assert.equal(metricEfficiency(0, "us"), 0);
  assert.equal(efficiencyText(displayEfficiency(0, "metric")), "0.0");
});
