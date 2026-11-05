import assert from "node:assert/strict";
import type { YearData } from "../src/data/schema.ts";
import { gisMonthly } from "../src/engine/index.ts";

// ESDC quarterly Tables 1–4, cached as gis-table-q1..q4. These are published monthly
// maximums and Table 4's final nonzero Allowance row, not an annualized December amount.
const rows: Record<number, number[][]> = {
  2025: [
    [1086.88, 654.23, 1381.9, 40752, 250.99, 0.53],
    [1086.88, 654.23, 1381.9, 40752, 250.99, 0.53],
    [1097.75, 660.78, 1395.73, 41136, 254.11, 0.6],
    [1105.43, 665.41, 1405.5, 41424, 256.31, 0.89],
  ],
  2026: [
    [1108.74, 667.41, 1409.72, 41568, 256.26, 0.74],
    [1109.85, 668.08, 1411.13, 41616, 256.58, 0.36],
    [1123.17, 676.09, 1428.06, 42096, 259.41, 0.79],
    [1138.9, 685.56, 1448.06, 42720, 262.92, 0.57],
  ],
};
export function assertGisPublishedFigures(y: YearData) {
  const q = y.federal.gisAllowance?.params;
  assert.ok(q);
  rows[y.year].forEach(([single, couple, allowance, income, protectedGis, lastAllowance], quarter) => {
    assert.equal(q.quarterly[quarter].singleMaximum, single);
    assert.equal(q.quarterly[quarter].coupleMaximum, couple);
    assert.equal(gisMonthly(y.federal, quarter, 0, "spouse-allowance").allowance, allowance);
    const last = gisMonthly(y.federal, quarter, income, "spouse-allowance");
    assert.equal(last.gis, protectedGis);
    assert.equal(last.allowance, lastAllowance);
    assert.equal(gisMonthly(y.federal, quarter, income + 48, "spouse-allowance").allowance, 0);
  });
}
