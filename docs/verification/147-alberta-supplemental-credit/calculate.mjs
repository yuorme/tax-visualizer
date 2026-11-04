// Independent worksheet arithmetic for #147. Node 26; default mode has no production imports. No file writes.
// Sources and model boundaries are documented in ../147-alberta-supplemental-credit.md.
// Annual rules: AB PITA ss4,7,8-10,19,20.1,20.2,42,44.2; parameters: AB428, TD1AB, T4127.
// The cached consolidation omits 2026 c3 s2; its effect/commencement remains unverified.
import assert from "node:assert/strict";

const years = {
  2025: {
    bpa: 22323, age: 6221, ageThreshold: 46308, pension: 1719,
    firstBracket: 60000, secondBracket: 151234, supplementalOffset: 4800,
    ympe: 71300, yampe: 81200, eiMaxIncome: 65700, eiRate: 0.0164,
    rrsp: 9814, targetIncome: 62527,
  },
  2026: {
    bpa: 22769, age: 6345, ageThreshold: 47234, pension: 1753,
    firstBracket: 61200, secondBracket: 154259, supplementalOffset: 4896,
    ympe: 74600, yampe: 85000, eiMaxIncome: 68900, eiRate: 0.0163,
    rrsp: 11762, targetIncome: 63880,
  },
};
let checks = 0;
function equal(actual, expected, label) {
  assert.ok(Math.abs(actual - expected) < 1e-7, `${label}: ${actual} != ${expected}`);
  checks++;
}
const positive = n => Math.max(0, n);
const ageBase = (q, age, net) => age < 65 ? 0 : positive(q.age - 0.15 * positive(net - q.ageThreshold));
// Section 20.2 indexes its own dollar offset via s44.2; do not infer it from bracket indexation.
const supplemental = (q, base, tuition = 0) => positive(0.08 * (base - tuition) - q.supplementalOffset) * 0.25;
// Published 2026 TD1AB/T4127 amounts establish the 2% adjustment; s44.2(4) rounds to whole dollars.
for (const key of ["bpa", "age", "ageThreshold", "pension", "firstBracket", "secondBracket", "supplementalOffset"]) {
  equal(Math.round(years[2025][key] * 1.02), years[2026][key], `2026 statutory indexation: ${key}`);
}
equal(years[2026].supplementalOffset / 0.08, 61200, "2026 qualifying base threshold");
function payroll(q, employment) {
  const contributory = positive(Math.min(employment, q.ympe) - 3500);
  return {
    base: contributory * 0.0495,
    enhanced: contributory * 0.01 + positive(Math.min(employment, q.yampe) - q.ympe) * 0.04,
    ei: Math.min(employment, q.eiMaxIncome) * q.eiRate,
  };
}
function bracketTax(q, taxable) {
  // Every concrete example and positive-relief upper-bound point is in these two brackets.
  assert.ok(taxable <= q.secondBracket);
  return 0.08 * Math.min(taxable, q.firstBracket) + 0.10 * positive(taxable - q.firstBracket);
}
function adult(q, input, seniors) {
  const { age = 40, employment = 0, pension = 0, other = 0, rrsp = 0, cg = 0 } = input;
  const pay = payroll(q, employment);
  const net = positive(employment + pension + other + positive(cg) * 0.5 - pay.enhanced - rrsp);
  return {
    net, taxable: net, cash: employment + pension + other + cg, ...pay,
    ageBase: seniors ? ageBase(q, age, net) : 0,
    pensionBase: seniors ? Math.min(pension, q.pension) : 0,
  };
}
function household(q, people, { seniors = true, dependant = false } = {}) {
  const adults = people.map(p => adult(q, p, seniors));
  const results = adults.map((a, i) => {
    const spouse = adults[1 - i];
    const spouseBase = spouse ? positive(q.bpa - spouse.net) : dependant ? q.bpa : 0;
    // AB(S2) lines 5-11, with no disability, adoption or tuition. No pension income splitting.
    const spouseAdjusted = spouse
      ? positive(bracketTax(q, spouse.taxable) / 0.08 - q.bpa - spouse.base - spouse.ei)
      : 0;
    const transfer = spouse ? positive(spouse.ageBase + spouse.pensionBase - spouseAdjusted) : 0;
    const base = q.bpa + spouseBase + a.base + a.ei + a.ageBase + a.pensionBase + transfer;
    const tax = bracketTax(q, a.taxable);
    const capacity = positive(tax - 0.08 * base);
    const nominal = supplemental(q, base);
    const usable = Math.min(nominal, capacity);
    return { ...a, spouseBase, transfer, creditBase: base, bracketTax: tax, capacity, nominal, usable };
  });
  const gross = adults.reduce((s, a) => s + a.cash, 0);
  const usable = results.reduce((s, a) => s + a.usable, 0);
  assert.ok(gross > 0);
  return { adults: results, gross, usable, ownRateDropPP: 100 * usable / gross,
    // Signed AB-minus-other-province gap shrinks by exactly the same amount.
    gapChangePP: -100 * usable / gross };
}

const bounds = [];
const cases = [];
for (const [year, q] of Object.entries(years)) {
  const maxPayroll = payroll(q, q.ympe);
  const currentBaseCeiling = 2 * q.bpa + maxPayroll.base + maxPayroll.ei;
  const seniorBaseCeiling = currentBaseCeiling + 2 * (q.age + q.pension);
  const intercept = seniorBaseCeiling + 0.15 * q.ageThreshold;
  const intersection = intercept / 1.15;
  const dollarCeiling = 0.02 * (intersection - q.firstBracket);
  assert.ok(currentBaseCeiling < q.firstBracket);
  assert.ok(seniorBaseCeiling - q.age < q.firstBracket); // Positive relief requires own age amount.
  assert.ok(q.ageThreshold < q.firstBracket && intersection < q.ageThreshold + q.age / 0.15);
  // See the report's proof: only one spouse can have a usable supplement.
  assert.ok(q.bpa + 2 * (q.age + q.pension) + maxPayroll.base + maxPayroll.ei < q.firstBracket);
  const rateCeilingPP = 100 * dollarCeiling / (q.firstBracket + 50 * dollarCeiling);
  assert.ok(rateCeilingPP < 0.1); // Conditional on no negative capital gain cash component.
  bounds.push({ year, currentBaseCeiling, seniorBaseCeiling, intersection, dollarCeiling, rateCeilingPP });

  const claimant = { age: 65, employment: q.ympe, pension: q.pension, rrsp: q.rrsp };
  const donor = { age: 65, pension: q.pension, rrsp: q.pension };
  const inputs = [
    ["current worker + zero-income spouse", [{ employment: q.ympe }, {}], { seniors: false }],
    ["current single parent", [{ employment: q.ympe }], { seniors: false, dependant: true }],
    ["single senior pensioner", [{ age: 65, pension: 65000 }], {}],
    ["senior credits but zero capacity", [
      { ...claimant, rrsp: q.ympe + q.pension - maxPayroll.enhanced - 45000 }, donor,
    ], {}],
    ["senior usable relief, no capital loss", [claimant, donor], {}],
    ["senior partial remaining capacity", [{ ...claimant, rrsp: q.rrsp + 27 }, donor], {}],
    ["senior usable relief, capital loss 50000", [{ ...claimant, cg: -50000 }, donor], {}],
    // An extra $10,000 of ordinary taxable receipts per adult, matched by unused RRSP deduction room.
    // This is an input sensitivity, NOT an invented OAS entitlement or an annual benefit estimate.
    ["loss case + other income 10000 each", [
      { ...claimant, cg: -50000, other: 10000, rrsp: q.rrsp + 10000 },
      { ...donor, other: 10000, rrsp: q.pension + 10000 },
    ], {}],
    ["donor pension without RRSP deduction", [claimant, { ...donor, rrsp: 0 }], {}],
  ];
  for (const [name, people, options] of inputs) {
    const result = household(q, people, options);
    cases.push({ year, name, inputs: people, ...result });
    if (name.startsWith("current") || name === "single senior pensioner") equal(result.usable, 0, name);
    if (name === "senior credits but zero capacity") {
      assert.ok(result.adults[0].creditBase > q.firstBracket);
      assert.ok(result.adults[0].nominal > 0);
      equal(result.usable, 0, `${year} non-refundability`);
    }
    if (name === "senior usable relief, no capital loss") {
      equal(result.adults[0].net, q.targetIncome, `${year} claimant taxable income`);
      equal(result.adults[1].net, 0, `${year} donor net income`);
      assert.ok(result.ownRateDropPP < 0.1);
    }
    if (name === "senior partial remaining capacity") {
      assert.ok(result.adults[0].capacity > 0 && result.adults[0].capacity < result.adults[0].nominal);
      equal(result.usable, result.adults[0].capacity, `${year} partial remaining capacity`);
    }
    if (name.includes("capital loss 50000") || name.startsWith("loss case")) {
      assert.ok(result.ownRateDropPP >= 0.1);
    }
    equal(result.gapChangePP, -result.ownRateDropPP, `${year} ${name} gap effect`);
  }
  // Synthetic formula checks only: arbitrary bases do not establish household materiality.
  equal(supplemental(q, q.firstBracket - 1), 0, `${year} below subtotal threshold`);
  equal(supplemental(q, q.firstBracket), 0, `${year} at subtotal threshold`);
  equal(supplemental(q, q.firstBracket + 1), 0.02, `${year} above subtotal threshold`);
  equal(supplemental(q, q.firstBracket + 10000, 10000), 0, `${year} tuition excluded`);
}

// Hand-worked worksheet answers, recorded independently in the report, lock the concrete cases.
const expected = {
  2025: { base: 62526.73, tax: 5052.70, capacity: 50.5616, relief: 50.5346, gross: 24738 },
  2026: { base: 63879.62, tax: 5164.00, capacity: 53.6304, relief: 53.5924, gross: 28106 },
};
for (const [year, e] of Object.entries(expected)) {
  const c = cases.find(c => c.year === year && c.name === "senior usable relief, capital loss 50000");
  equal(c.adults[0].creditBase, e.base, `${year} independent subtotal`);
  equal(c.adults[0].bracketTax, e.tax, `${year} independent bracket tax`);
  equal(c.adults[0].capacity, e.capacity, `${year} independent capacity`);
  equal(c.usable, e.relief, `${year} independent relief`);
  equal(c.gross, e.gross, `${year} loss-inclusive denominator`);
  equal(c.ownRateDropPP, 100 * e.relief / e.gross, `${year} effective-rate change`);
  const noLoss = cases.find(c => c.year === year && c.name === "senior usable relief, no capital loss");
  equal(c.usable, noLoss.usable, `${year} loss changes denominator only`);
}
equal(bounds[0].currentBaseCeiling, 49079.58, "2025 current bound");
equal(bounds[1].currentBaseCeiling, 50180.52, "2026 current bound");
equal(cases.find(c => c.year === "2025" && c.name === "senior partial remaining capacity").usable,
  47.5376, "2025 independently calculated partial capacity");
equal(cases.find(c => c.year === "2026" && c.name === "senior partial remaining capacity").usable,
  50.6064, "2026 consolidated-law partial capacity");
equal(supplemental(years[2025], 70000), 200, "2025 hypothetical 70000 (not a household)");

// Optional reachability audit is separate from the independent tax arithmetic above.
// It executes the actual current input handler bodies and production engine without modifying either.
let modelReachability;
if (process.argv.includes("--verify-model")) {
  const { readFileSync } = await import("node:fs");
  const { runInNewContext } = await import("node:vm");
  const { transformSync } = await import("esbuild");
  const app = readFileSync(new URL("../../../src/ui/app.ts", import.meta.url), "utf8");
  const html = readFileSync(new URL("../../../src/ui/index.html", import.meta.url), "utf8");
  const sliderTag = html.match(/<input[^>]*id="cg-range"[^>]*>/)?.[0];
  assert.ok(sliderTag?.includes('min="-50000"') && sliderTag.includes('max="50000"'));
  function runHandler(marker, value) {
    const start = app.indexOf(marker);
    assert.ok(start >= 0, `missing handler marker: ${marker}`);
    const body = app.slice(start).match(/el\.addEventListener\("input", \(\) => \{([\s\S]*?)\n  \}\);/)?.[1];
    assert.ok(body, "input handler must be found in actual page source");
    const person = { cg: 0 };
    runInNewContext(transformSync(body, { loader: "ts" }).code, {
      el: { value }, k: "cg", me: () => person,
      syncRange: () => {}, render: () => {}, $: () => ({ value: "" }),
    });
    return person.cg;
  }
  const typed = runHandler('document.querySelectorAll<HTMLInputElement>("input.inv")', "-50,000");
  const unicodeMinus = runHandler('document.querySelectorAll<HTMLInputElement>("input.inv")', "−50,000");
  const slider = runHandler('document.querySelectorAll<HTMLInputElement>("input.inv-range")', "-50000");
  equal(typed, -50000, "actual page typed negative entry");
  equal(unicodeMinus, -50000, "actual page Unicode minus entry");
  equal(slider, -50000, "actual page slider negative entry");

  const { register } = await import("tsx/esm/api");
  register();
  const { loadYear } = await import("../../../src/data/load.ts");
  const { blank, compute } = await import("../../../src/engine/index.ts");
  modelReachability = [];
  for (const [year, q] of Object.entries(years)) {
    const data = loadYear(Number(year));
    const province = data.provinces.find(p => p.code === "AB");
    assert.ok(province);
    // Pension receipts are currently entered as oth; #17 reclassifies them without changing cash.
    const people = [
      { ...blank(q.ympe), oth: q.pension, rrsp: q.rrsp, cg: typed },
      { ...blank(0), oth: q.pension, rrsp: q.pension },
    ];
    const input = { people, active: 0, spouse: true, adults: 2, kids: 0, under6: 0,
      useBpa: true, useCredits: false, whRate: 0, homeValue: 0, rent: 0, monthlySpending: 0 };
    const withLoss = compute(data, province, input);
    const withoutLoss = compute(data, province, { ...input, people: people.map(p => ({ ...p, cg: 0 })) });
    equal(withLoss.me.ti, q.targetIncome, `${year} actual engine claimant taxable income`);
    equal(withLoss.me.breakdown.netIncome.cg, 0, `${year} actual engine taxable capital loss`);
    equal(withLoss.cash, expected[year].gross, `${year} actual engine signed cash denominator`);
    equal(withoutLoss.cash - withLoss.cash, 50000, `${year} actual engine loss cash effect`);
    equal(withLoss.total, withoutLoss.total, `${year} actual engine tax unaffected by loss`);
    equal(withLoss.avg, withLoss.total / withLoss.cash, `${year} actual engine effective-rate denominator`);
    modelReachability.push({ year, pageEntry: typed, taxable: withLoss.me.ti,
      taxableCapitalGain: withLoss.me.breakdown.netIncome.cg, cash: withLoss.cash,
      cashWithoutLoss: withoutLoss.cash, unchangedTax: withLoss.total });
  }
}
console.log(JSON.stringify({
  status: "Annual structure verified from Act; 2026 amounts reconcile to TD1AB/T4127; 2026 c3 s2 applicability unresolved",
  bounds, cases, checks, ...(modelReachability ? { modelReachability } : {}),
}, null, 2));
