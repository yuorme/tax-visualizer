// The year-over-year diff (scripts/year-diff.ts): what it reports as changed, suspiciously unchanged, exempt,
// opted out, added and removed, and that it would have caught the Nunavut child benefit carried over into 2025.
import assert from "node:assert/strict";
import test from "node:test";
import {
  classify,
  defaultBase,
  diffTrees,
  diffYears,
  formatReport,
  parseTree,
  readYearFiles,
  splitPath,
} from "../scripts/year-diff.ts";
import { DATA_DIR } from "../src/data/load.ts";

const diff = (before: string, after: string, laterYear = 2026, threshold = 15) =>
  diffTrees("XX", parseTree(before), parseTree(after), { threshold, laterYear });
const flagged = (d: ReturnType<typeof diff>) => d.unchanged.filter(u => !u.optOut).map(u => u.path);
const optedOut = (d: ReturnType<typeof diff>) =>
  Object.fromEntries(d.unchanged.filter(u => u.optOut).map(u => [u.path, u.optOut]));

test("changed values carry the percentage change, and those over the threshold are large", () => {
  const d = diff("bpa: 10000\nmax: 200\nlabel: 5% GST\n", "bpa: 10200\nmax: 250\nlabel: 5% GST (new)\n");
  assert.deepEqual(
    d.changed.map(c => [c.path, c.pct === undefined ? undefined : Math.round(c.pct * 10) / 10, c.large]),
    [
      ["bpa", 2, false],
      ["max", 25, true],
      ["label", undefined, false],
    ],
  );
  assert.equal(diff("max: 200\n", "max: 250\n", 2026, 30).changed[0].large, false, "threshold is configurable");
  // From zero, or between a limit and no limit, there's no percentage, and the change counts as large.
  const z = diff("a: 0\nb: .inf\n", "a: 5\nb: 200000\n");
  assert.deepEqual(
    z.changed.map(c => [c.path, c.pct, c.large]),
    [
      ["a", undefined, true],
      ["b", undefined, true],
    ],
  );
});

test("unchanged amounts, thresholds and bracket limits are flagged", () => {
  const src = "brackets:\n  - [50000, 0.1]\n  - [.inf, 0.2]\nbpa: 12000\nchildBenefit:\n  params: {perChild: 696.5}\n";
  assert.deepEqual(flagged(diff(src, src)), ["brackets[0].limit", "bpa", "childBenefit.params.perChild"]);
});

test("rates, zeros, unlimited brackets and bookkeeping fields are exempt", () => {
  const src = [
    "year: 2026",
    "order: 3",
    "brackets: [[.inf, 0.15]]",
    "rate: 0.05",
    "investment: {grossUp: {eligible: 1.38}, capitalGainsInclusion: 0.5}",
    "spouseAmount: {max: 0, threshold: 0}",
    "credit: {maxChildren: 2, rateOneChild: 1}",
    "",
  ].join("\n");
  assert.deepEqual(flagged(diff(src, src)), []);
  assert.deepEqual(diff(src, src).changed, [], "year is not reported as a change");
  assert.equal(classify(["investment", "grossUp", "eligible"], 1.38), "rate");
  assert.equal(classify(["brackets", 0, "rate"], 0.15), "rate");
  assert.equal(classify(["childBenefit", "params", "under6", 1], 814.92), "amount", "cents are still amounts");
  assert.equal(classify(["order"], 3), "other");
});

test("bracketsFrozenSince opts bracket limits out, from that year on", () => {
  const src = (frozen: string) => `${frozen}brackets:\n  - [47000, 0.108]\n  - [.inf, 0.174]\nbpa: 15780\n`;
  const frozen = diff(src("bracketsFrozenSince: 2025\n"), src("bracketsFrozenSince: 2025\n"), 2026);
  assert.deepEqual(optedOut(frozen), { "brackets[0].limit": "bracketsFrozenSince: 2025" });
  assert.deepEqual(flagged(frozen), ["bpa"], "only the bracket limits are covered");
  assert.deepEqual(flagged(diff(src("bracketsFrozenSince: 2027\n"), src("bracketsFrozenSince: 2027\n"))), [
    "brackets[0].limit",
    "bpa",
  ]);
  assert.deepEqual(flagged(diff(src(""), src(""))), ["brackets[0].limit", "bpa"]);
});

test("a 'not indexed' comment opts out its line, the key it's on, or the key below it", () => {
  const src = [
    "bpa: 12000      # not indexed since 2020",
    "lift: {max: 875, threshold: 32500}   # Not indexed",
    "payroll:",
    "  # Ontario Health Premium (not indexed): [above, base, rate, cap]",
    "  # second line of the same comment",
    "  healthPremium:",
    "    - [20000, 0, 0.06, 300]",
    "  other: 500",
    "credits:",
    "  - name: A",
    "    program: a",
    "    params: {max: 100}",
    "  # this one is not indexed",
    "  - name: B",
    "    program: b",
    "    params: {max: 200}",
    'label: {text: "# not indexed", amount: 40}',
    "spouse: 9000   # indexed every year",
    "",
  ].join("\n");
  const d = diff(src, src);
  assert.deepEqual(Object.keys(optedOut(d)), [
    "bpa",
    "lift.max",
    "lift.threshold",
    "payroll.healthPremium[0][0]",
    "payroll.healthPremium[0][3]",
    "credits[b].params.max",
  ]);
  // The comment above healthPremium doesn't spread to its sibling, a '#' in a string isn't a comment, and a
  // comment that doesn't say "not indexed" opts nothing out.
  assert.deepEqual(flagged(d), ["payroll.other", "credits[a].params.max", "label.amount", "spouse"]);
  // A marker in either year's file counts.
  assert.deepEqual(flagged(diff("bpa: 1000   # not indexed\n", "bpa: 1000\n")), []);
});

test("added and removed fields are listed, and program lists are matched by program", () => {
  const before = [
    "estimated: true",
    "brackets: [[100, 0.1], [.inf, 0.2]]",
    "credits:",
    "  - {name: Old, program: old-credit, params: {max: 110}}",
    "  - {name: Kept, program: kept, params: {max: 50}}",
    "",
  ].join("\n");
  const after = [
    "brackets: [[100, 0.1], [200, 0.2], [.inf, 0.25]]",
    "credits:",
    "  - {name: Kept, program: kept, params: {max: 51, floor: 3}}",
    "  - {name: New, program: new-credit, params: {single: 310}}",
    "",
  ].join("\n");
  const d = diff(before, after);
  assert.deepEqual(
    d.structural.map(s => [s.path, s.type]),
    [
      ["brackets[2]", "added"],
      ["credits[kept].params.floor", "added"],
      ["credits[new-credit]", "added"],
      ["credits[old-credit]", "removed"],
      ["estimated", "removed"],
    ],
  );
  assert.deepEqual(
    d.changed.map(c => c.path),
    ["brackets[1].limit", "credits[kept].params.max"],
    "matched by program, not position",
  );
});

test("a field whose program changed is replaced, not compared parameter by parameter", () => {
  const d = diff(
    "childBenefit:\n  program: a\n  params: {perChild: 100}\n",
    "childBenefit:\n  program: b\n  params: {perChild: 100}\n",
  );
  assert.deepEqual(
    d.structural.map(s => [s.path, s.type]),
    [["childBenefit", "replaced"]],
  );
  assert.deepEqual(d.unchanged, []);
  assert.deepEqual(d.changed, []);
});

test("sources lists are skipped", () => {
  const d = diff("sources:\n  - {label: A, url: x}\n", "sources:\n  - {label: B, url: y}\n  - {label: C, url: z}\n");
  assert.deepEqual([d.changed, d.unchanged, d.structural], [[], [], []]);
});

test("paths split into the object and the field for grouping", () => {
  assert.deepEqual(splitPath(["credits", "[x]", "params", "adult"]), { group: "credits[x].params", field: "adult" });
  assert.deepEqual(splitPath(["childBenefit", "params", "under6", 1]), {
    group: "childBenefit.params",
    field: "under6[1]",
  });
  assert.deepEqual(splitPath(["brackets", 2, "limit"]), { group: "brackets", field: "[2].limit" });
  assert.deepEqual(splitPath(["bpa"]), { group: "", field: "bpa" });
});

test("the default base is the previous year, or the nearest one with data", () => {
  assert.equal(defaultBase(2026, [2025, 2026]), 2025);
  assert.equal(defaultBase(2025, [2025, 2026]), 2026);
  assert.equal(defaultBase(2026, [2024, 2026, 2027, 2028]), 2027);
  assert.equal(defaultBase(2026, [2025, 2026, 2027]), 2025);
  assert.equal(defaultBase(2026, [2026]), undefined);
});

test("the 2025 Nunavut child benefit carried over from 2026 would have been flagged", () => {
  const later = readYearFiles(DATA_DIR, 2026);
  const earlier = readYearFiles(DATA_DIR, 2025);
  const nu = earlier.get("NU") ?? "";
  assert.match(nu, /perChild: 348,/);
  earlier.set("NU", nu.replace("perChild: 348,", "perChild: 696,"));
  const report = diffYears(2025, earlier, 2026, later);
  const hit = report.unchanged.find(u => u.file === "NU" && u.path === "childBenefit.params.perChild");
  assert.deepEqual(hit && [hit.value, hit.optOut], [696, undefined]);
  assert.match(formatReport(report), /\| NU \| `childBenefit\.params` \| `perChild` 696/);
  // With the corrected data it's a change instead.
  const fixed = diffYears(2025, readYearFiles(DATA_DIR, 2025), 2026, later);
  const change = fixed.changed.find(c => c.file === "NU" && c.path === "childBenefit.params.perChild");
  assert.deepEqual(change && [change.before, change.after, change.large], [348, 696, true]);
});

test("the report renders every section", () => {
  const report = diffYears(
    2026,
    new Map([["XX", "bpa: 1000\nmax: 300\nnew: 1\nlift: 5\n"]]),
    2025,
    new Map([["XX", "bpa: 1000\nmax: 200\nold: 1\nlift: 5   # not indexed\n"]]),
  );
  const md = formatReport(report);
  for (const heading of ["## Data diff: 2026 against 2025", "### Suspiciously unchanged (1)", "### Large changes"]) {
    assert.ok(md.includes(heading), heading);
  }
  assert.match(md, /\| XX \| `max` \| 200 \| 300 \| \+50\.0% \|/);
  assert.match(md, /\| XX \| `new` \| added \| 1 \|/);
  assert.match(md, /1 unchanged value opted out/);
});
