import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { loadYear } from "../src/data/load.ts";
import { blank, compute, type Driving, type FuelRate, type Household, ratePeriods } from "../src/engine/index.ts";

const fixture: {
  year: number;
  cases: {
    id: string;
    province: string;
    driving: Driving | null;
    useCredits: boolean;
    expected: Record<string, number>;
  }[];
} = JSON.parse(fs.readFileSync(new URL("./golden/features/fuel-2025.json", import.meta.url), "utf8"));
const rounded = (n: number) => Math.round(n * 1e4) / 1e4;
function atPath(value: unknown, path: string): unknown {
  for (const key of path.split(".")) {
    assert.ok(value !== null && typeof value === "object" && key in value, `missing ${path}`);
    value = (value as Record<string, unknown>)[key];
  }
  return value;
}

for (const c of fixture.cases) {
  test(`2025 fuel golden: ${c.id}`, () => {
    const y = loadYear(fixture.year);
    const p = y.provinces.find(p => p.code === c.province);
    assert.ok(p);
    const hh: Household = {
      people: [{ ...blank(0), oth: 60000 }],
      active: 0,
      adults: 1,
      spouse: false,
      kids: 0,
      under6: 0,
      useBpa: true,
      useCredits: c.useCredits,
      whRate: 0,
      homeValue: 0,
      rent: 0,
      monthlySpending: 0,
      driving: c.driving ?? undefined,
    };
    const result = compute(y, p, hh);
    // Isolate only the added ordinary fuel component. Retain real 2025 carbon and all income-tax/benefit data.
    const beforeData = structuredClone(y);
    delete beforeData.federal.fuelTax;
    for (const province of beforeData.provinces) delete province.fuelTax;
    const beforeProvince = beforeData.provinces.find(p => p.code === c.province);
    assert.ok(beforeProvince);
    const before = compute(beforeData, beforeProvince, hh);
    const observed = {
      ...result,
      delta: {
        gross: result.gross - before.gross,
        total: result.total - before.total,
        left: result.breakdown.left - before.breakdown.left,
      },
    };
    for (const [path, expected] of Object.entries(c.expected)) {
      const value = atPath(observed, path);
      assert.equal(typeof value, "number");
      assert.ok(Number.isFinite(value));
      assert.equal(rounded(value as number), expected, `${c.id}: ${path}`);
    }
    for (const key of ["fed", "prov", "payroll", "sales", "property", "benefits", "marg", "invTax"] as const)
      assert.equal(result[key], before[key], `${c.id}: unchanged ${key}`);
    assert.deepEqual(result.carbon, before.carbon, "ordinary fuel must not replace or duplicate carbon");
    assert.deepEqual(result.credits, before.credits, "fuel does not change carbon rebates or other credits");
  });
}

test("2025 ordinary fuel schedules cover the full year without applying 2026 suspensions", () => {
  const y = loadYear(2025);
  assert.equal(y.federal.fuelTax?.gasoline, 0.1);
  for (const p of y.provinces) {
    assert.ok(p.fuelTax);
    const schedules: (FuelRate | undefined)[] = [
      y.federal.fuelTax.gasoline,
      p.fuelTax.gasoline,
      p.fuelTax.regional?.gasoline,
    ];
    for (const schedule of schedules) {
      if (schedule === undefined) continue;
      assert.deepEqual(ratePeriods(schedule, 2025), [
        { from: "2025-01-01", to: "2026-01-01", rate: schedule, share: 1 },
      ]);
    }
  }
});
