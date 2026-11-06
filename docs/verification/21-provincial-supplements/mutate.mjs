// Bounded, reversible mutation check. Run with Node 26 from the repository root, with no other checks running.
import assert from "node:assert/strict";
import fs from "node:fs";
import { spawnSync } from "node:child_process";
const supplement = "src/engine/senior-supplements.ts";
const mutants = [
  ["BC single maximum", supplement, "? q.single : q.couple", "? q.couple : q.couple"],
  ["AB effective half-year", supplement, ".findLast(row => month >= row.from)", ".find(row => month >= row.from)"],
  ["AB positive minimum", supplement, "Math.max(q.minimum, rounded)", "rounded"],
  ["AB individual loss floor", supplement, "Math.max(0, gross -", "Math.max(-Infinity, gross -"],
  ["AB RRSP deduction (review survivor)", supplement, "(x.rrsp ?? 0)", "0"],
  ["AB OAS receipt gate (review survivor)", supplement, "!!x.oas && reached", "reached"],
  ["SK couple multiplier", supplement, "q.coupleMultiplier", "q.singleMultiplier"],
  ["SK total-GIS premature cutoff", supplement,
    "gisBasicMonthly(fed, quarter, 0, row.category);\n            const basic = gisBasicMonthly",
    "gisMonthly(fed, quarter, 0, row.category);\n            const basic = gisMonthly"],
  ["MB restored table tail", supplement, "income >= from", "Math.min(income, 1535.99) >= from"],
  ["MB junior employment expenses", supplement, "Math.min(q.employmentExpenseMax, x.ord * q.employmentExpenseRate)", "0"],
  ["MB junior application quarter", supplement, ".filter(month => reached(x, q.minimumAge, month))", ".filter(() => true)"],
  ["MB junior capital losses", supplement, "x.cg +", "Math.max(0, x.cg) +"],
  ["MB junior base CPP (review survivor)", supplement, "pay.base", "0"],
  ["MB479 age-18 child (review survivor)", supplement, "age <= q.childThrough", "age < q.childThrough"],
  ["MB allowance recipient", supplement, "amounts[1 - i] += payment", "amounts[1 - i] += 0"],
  ["ON 75+ offset", supplement, "older ? period.olderOffsets : period.youngerOffsets", "older ? period.youngerOffsets : period.youngerOffsets"],
  ["ON inclusive band", supplement, "const bands = Math.floor(", "const bands = Math.ceil("],
  ["NB previous-year age", supplement, "age: x.age - 1", "age: x.age"],
  ["territorial tiny entitlement", supplement, "row.gis + row.allowance > 0", "row.gis + row.allowance >= 1"],
  ["BC reporting boundary", supplement, "n > rule.reporting.exemptThrough", "n >= rule.reporting.exemptThrough"],
  ["full reportable series", supplement, "? n : 0", "? n - rule.reporting.exemptThrough : 0"],
  ["QC two senior maxima", supplement, "eligible * q.maximum", "q.maximum"],
  ["MB spouse senior term", supplement, "q.senior * seniors", "q.senior"],
  ["NS minimum refund", supplement, "Math.max(q.minimum, provincialTax[i])", "provincialTax[i]"],
  ["NL combined small-payment test", supplement, "(senior + ordinary) / 4 < q.smallPayment", "senior / 4 < q.smallPayment"],
  ["NL historical age", supplement, "half === 0 ? q.firstHalfAge : q.secondHalfAge", "q.secondHalfAge"],
  ["line 25000 deduction", "src/engine/personal.ts", "federalSupplementsDeduction + (ctx.provincialAssistance ?? 0)", "federalSupplementsDeduction"],
  ["GIS in reporter comparison (review survivor)", supplement, "gis.adults[i].gis + gis.adults[i].allowance", "0"],
  ["assistance in T778 (review survivor)", "src/engine/household.ts", "n + (assistance?.[i] ?? 0)", "n"],
  ["assistance in OAS recovery", "src/engine/payroll.ts", "netIncomeTotal(parts));", "netIncomeTotal(parts) - (provincialAssistance ?? 0));"],
  ["resolved child profile (review)", "src/engine/household.ts", "{ kids, ages: familyAges }", "{ kids: hh.kids, ages: hh.childAges }"],
  ["no-GIS assistance breakdown (review)", "src/engine/personal.ts",
    "ctx.netFederalSupplements !== undefined || ctx.provincialAssistance !== undefined", "ctx.netFederalSupplements !== undefined"],
];
const originals = new Map(mutants.map(([, file]) => [file, fs.readFileSync(file, "utf8")]));
const started = Date.now();
const budget = 120000;
let killed = 0;
const survivors = [];
try {
  for (const [name, file, before, after] of mutants) {
    if (Date.now() - started > budget) throw Error("Mutation budget exhausted");
    const source = originals.get(file);
    assert.equal(source.split(before).length - 1, 1, `${name}: unique mutation target`);
    fs.writeFileSync(file, source.replace(before, after));
    const run = spawnSync(process.execPath, ["--import", "tsx", "--test", "tests/senior-supplements.test.ts"],
      { encoding: "utf8", timeout: Math.min(15000, budget - (Date.now() - started)) });
    fs.writeFileSync(file, source);
    if (run.error || !run.stdout.includes("ℹ fail") || /TransformError|SyntaxError/.test(run.stderr))
      throw Error(`${name}: invalid/incomplete mutation run: ${run.error ?? run.stderr}`);
    if (run.status === 0) survivors.push(name);
    else killed++;
  }
} finally {
  for (const [file, source] of originals) fs.writeFileSync(file, source);
}
console.log(JSON.stringify({ attempted: killed + survivors.length, killed, survivors,
  budgetSeconds: budget / 1000, elapsedSeconds: Math.round((Date.now() - started) / 100) / 10 }, null, 2));
if (survivors.length) process.exitCode = 1;
