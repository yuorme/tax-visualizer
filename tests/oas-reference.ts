import assert from "node:assert/strict";
import type { YearData } from "../src/data/schema.ts";
import { blank, publicPensionReceipts } from "../src/engine/index.ts";

/** ESDC quarterly Table 5, cached as verification/<year>/sources/oas-q1 through q4.
 * Annual amounts are calendar receipts, independently summed from the twelve published monthly payments. */
export function assertOasPublishedFigures(y: YearData) {
  const monthly =
    y.year === 2025
      ? [
          [727.67, 800.44],
          [727.67, 800.44],
          [734.95, 808.45],
          [740.09, 814.1],
        ]
      : [
          [742.31, 816.54],
          [743.05, 817.36],
          [751.97, 827.17],
          [762.5, 838.75],
        ];
  const annual = y.year === 2025 ? [8791.14, 9670.29] : [8999.49, 9899.46];
  assert.deepEqual(y.federal.publicPensions?.params.quarterlyMonthly, monthly);
  assert.equal(y.federal.publicPensions?.params.recoveryThreshold, y.year === 2025 ? 93454 : 95323);
  assert.equal(y.federal.publicPensions?.params.recoveryRate, 0.15);
  for (const [i, age] of [74, 76].entries()) {
    const r = publicPensionReceipts(y.federal, { ...blank(0), age, birthMonth: 6, oas: true });
    assert.equal(r.oas, annual[i]);
    assert.notEqual(r.oas, monthly[3][i] * 12, "December's annualized rate is not calendar-year receipts");
  }
}
