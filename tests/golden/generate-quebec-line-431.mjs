// Independently reproduce the line-431 fixture without importing the engine or production data.
// Published parameters and derivation: docs/verification/205-qc-line-431.md.
// Usage: node tests/golden/generate-quebec-line-431.mjs <new-output-file>
// Existing files are never overwritten; compare the output with the locked fixture before proposing changes.
import assert from "node:assert/strict";
import fs from "node:fs";

const output = process.argv[2];
assert.ok(output && process.argv.length === 3, "supply one new output file");
// Year, BPA, lowest bracket rate and eligible DTC rate on grossed-up dividends.
const parameters = [
  [2019, 15269, 0.15, 0.1178],
  [2020, 15532, 0.15, 0.117],
  [2021, 15728, 0.15, 0.117],
  [2022, 16143, 0.15, 0.117],
  [2023, 17183, 0.14, 0.117],
  [2024, 18056, 0.14, 0.117],
  [2025, 18571, 0.14, 0.117],
  [2026, 18952, 0.14, 0.117],
];
const round = n => Math.round(n * 1e4) / 1e4;
const cases = [];
for (const [year, bpa, rate, dtc] of parameters) {
  for (const [id, people] of [
    ["dividends", [{ ed: 20000 }, { oth: 40000, ed: 2000 }]],
    ["unused-bpa", [{}, { oth: 40000 }]],
    ["bpa-and-dividends", [{ ed: 2000 }, { oth: 40000 }]],
    ["recipient-cap", [{ ed: 20000 }, { oth: 20000 }]],
    ["both-unused", [{}, {}]],
    ["no-unused", [{ oth: 40000 }, { oth: 40000 }]],
    ["donor-below-zero", [{ oth: bpa - 1 }, { oth: 40000 }]],
    ["donor-at-zero", [{ oth: bpa }, { oth: 40000 }]],
    ["donor-above-zero", [{ oth: bpa + 1 }, { oth: 40000 }]],
  ]) {
    // All inputs stay in the first tax bracket; no payroll, worker deductions or senior credits apply.
    const line430 = people.map(x => ((x.oth ?? 0) + (x.ed ?? 0) * 1.38) * rate - bpa * rate - (x.ed ?? 0) * 1.38 * dtc);
    const transfer = line430.map((_, i) => Math.max(0, -line430[1 - i]));
    const applied = line430.map((v, i) => Math.min(Math.max(0, v), transfer[i]));
    cases.push({
      id: `${year}-${id}`,
      year,
      people,
      expected: {
        prov: round(Math.max(0, line430[0] + line430[1])),
        transfer: transfer.map(round),
        applied: applied.map(round),
      },
    });
  }
}
const fixture = { source: "Independent TP-1 arithmetic; docs/verification/205-qc-line-431.md", cases };
fs.writeFileSync(output, `${JSON.stringify(fixture, null, 2)}\n`, { flag: "wx" });
console.log(`Wrote ${cases.length} independent cases, ${cases.length * 5} numeric expectations to ${output}`);
