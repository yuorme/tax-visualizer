// Literal published parameters from the reviewed #138 source table. No production-data-derived expectations.
import assert from "node:assert/strict";
import type { YearData } from "../src/data/schema.ts";

const rows: Record<number, Record<string, number[]>> = {
  2025: {
    FED: [9028, 45522, 2000, 0.145],
    AB: [6221, 46308, 1719, 0.08],
    BC: [5799, 43169, 1000, 0.0506],
    MB: [3728, 27749, 1000, 0.108],
    NB: [6037, 44945, 1000, 0.094],
    NL: [7064, 38712, 1000, 0.087],
    NT: [8727, 45522, 1000, 0.059],
    NS: [5734, 30828, 1173, 0.0879],
    NU: [12303, 45522, 2000, 0.04],
    ON: [6223, 46330, 1762, 0.0505],
    PE: [6510, 36600, 1000, 0.095],
    SK: [5785, 43066, 1000, 0.105],
    YT: [9028, 45522, 2000, 0.064],
  },
  2026: {
    FED: [9208, 46432, 2000, 0.14],
    AB: [6345, 47234, 1753, 0.08],
    BC: [5927, 44119, 1000, 0.056],
    MB: [3728, 27749, 1000, 0.108],
    NB: [6158, 45844, 1000, 0.094],
    NL: [7142, 39138, 1000, 0.087],
    NT: [8902, 46432, 1000, 0.059],
    NS: [5826, 30828, 1173, 0.0879],
    NU: [12550, 46432, 2000, 0.04],
    ON: [6342, 47210, 1796, 0.0505],
    PE: [6510, 36600, 1000, 0.095],
    SK: [5901, 43927, 1000, 0.105],
    YT: [9208, 46432, 2000, 0.064],
  },
};

/** 2025 T1/428/worksheets; 2026 TD1(-WS), with BC's annual Budget 2026 rate (not July withholding). */
export function assertSeniorPublishedParameters(y: YearData) {
  for (const [code, [maximum, threshold, pension, rate]] of Object.entries(rows[y.year])) {
    const data = code === "FED" ? y.federal : y.provinces.find(p => p.code === code);
    assert.ok(data);
    const rule = data.seniorCredits;
    assert.ok(rule && !("program" in rule));
    const age = rule.age.program === "federal-age-copy" ? y.federal.seniorCredits?.age : rule.age;
    assert.ok(age);
    assert.deepEqual(age.params, { minimumAge: 65, maximum, threshold, reductionRate: 0.15 }, `${y.year} ${code}`);
    assert.equal(rule.pension.params.maximum, pension);
    assert.equal(data.brackets[0][1], rate);
    assert.equal(rule.provisionalRules, y.year === 2026);
  }
  const qc = y.provinces.find(p => p.code === "QC")?.seniorCredits;
  assert.ok(qc && "program" in qc);
  assert.deepEqual(qc.params, {
    minimumAge: 65,
    ageAmount: y.year === 2025 ? 3906 : 3986,
    retirementMaximum: y.year === 2025 ? 3470 : 3541,
    retirementMultiplier: 1.25,
    livingAlone: y.year === 2025 ? 2128 : 2172,
    familyThreshold: y.year === 2025 ? 42090 : 42955,
    reductionRate: 0.1875,
    creditRate: 0.14,
  });
}
