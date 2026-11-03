// Independent sizing arithmetic, not production tax code. Sources and deliberate omissions are in ../16-seniors-sizing.md.
// Run: node docs/verification/16-seniors-sizing/calculate.mjs
import assert from 'node:assert/strict';

const positive = value => Math.max(0, value);
const age = (income, maximum, threshold) => positive(maximum - .15 * positive(income - threshold));
function bracket(income, bands) {
  let tax = 0;
  let previous = 0;
  for (const [limit, rate] of bands) {
    tax += positive(Math.min(income, limit) - previous) * rate;
    previous = limit;
  }
  return tax;
}
// CRA 2025 T1 / BC428 / ON428, plus the corresponding age-amount worksheets.
const federalBands = [[57375, .145], [114750, .205], [177882, .26], [253414, .29], [Infinity, .33]];
const bcBands = [[49279, .0506], [98560, .077], [113158, .105], [137407, .1229],
  [186306, .147], [259829, .168], [Infinity, .205]];
const onBands = [[52886, .0505], [105775, .0915], [150000, .1116], [220000, .1216], [Infinity, .1316]];
function health(income) {
  if (income > 200000) return Math.min(900, 750 + .25 * (income - 200000));
  if (income > 72000) return Math.min(750, 600 + .25 * (income - 72000));
  if (income > 48000) return Math.min(600, 450 + .25 * (income - 48000));
  if (income > 36000) return Math.min(450, 300 + .06 * (income - 36000));
  return Math.min(300, .06 * positive(income - 20000));
}
function tax(income, province, { ageCredit = true, pensionCredit = true } = {}) {
  // Every modeled taxable pension exceeds the relevant pension-credit cap. Income never reaches BPA phase-out.
  const federal = positive(bracket(income, federalBands) - .145 *
    (16129 + (ageCredit ? age(income, 9028, 45522) : 0) + (pensionCredit ? 2000 : 0)));
  let provincial;
  if (province === 'BC') {
    provincial = positive(bracket(income, bcBands) - .0506 *
      (12932 + (ageCredit ? age(income, 5799, 43169) : 0) + (pensionCredit ? 1000 : 0)));
    provincial = positive(provincial - positive(562 - .0356 * positive(income - 25020)));
  } else {
    provincial = positive(bracket(income, onBands) - .0505 *
      (12747 + (ageCredit ? age(income, 6223, 46330) : 0) + (pensionCredit ? 1762 : 0)));
    provincial += .20 * positive(provincial - 5710) + .36 * positive(provincial - 7307);
    provincial = positive(provincial - positive(2 * 294 - provincial));
    provincial += health(income);
  }
  return federal + provincial;
}
const oas = 740.09 * 12;
const olderOas = 814.10 * 12;
const gisSingle = 1105.43 * 12;
const gisAllowanceSpouse = 665.41 * 12;
const allowance = 1405.50 * 12;
const results = [];
function record(feature, income, bc, on) {
  results.push({ feature, denominator: income, BC: bc, ON: on,
    BC_points: 100 * bc / income, ON_points: 100 * on / income,
    gap_points: 100 * Math.abs(bc - on) / income });
}
const eachProvince = fn => ['BC', 'ON'].map(fn);
record('Age credits, single age 68', 35000,
  ...eachProvince(p => tax(35000, p, {ageCredit:false}) - tax(35000, p)));
record('Pension credits, single age 68', 35000,
  ...eachProvince(p => tax(35000, p, {pensionCredit:false}) - tax(35000, p)));
record('Income tax on OAS added to private income', 35000,
  ...eachProvince(p => tax(35000, p) - tax(35000 - oas, p)));
record('Income tax on age 75 OAS increase', 35000,
  ...eachProvince(p => tax(35000 + olderOas - oas, p) - tax(35000, p)));
const repayment = .15 * (100000 - 93454);
record('OAS recovery cost net of line 23500 deduction', 100000,
  ...eachProvince(p => repayment + tax(100000 - repayment, p) - tax(100000, p)));
record('GIS, single with zero private income', oas, gisSingle, gisSingle);
const allowanceNet = allowance + gisAllowanceSpouse - gisSingle;
record('Allowance with spouse GIS interaction', oas,
  allowanceNet, allowanceNet);
const split = eachProvince(p => {
  const before = tax(100000, p) + tax(40000, p);
  const after = tax(70000, p) + tax(70000, p);
  return {province:p, before, after, saving:before-after};
});
record('Eligible pension split: 100k/40k to 70k/70k', 140000, ...split.map(x=>x.saving));
record('Senior property relief: BC additional / Ontario grant', 35000, 275, 500);
const supplements = { BC:99.30*12, SK:360*12 };
const mbProperty = 235;
assert(Math.abs(repayment - 981.9) < 1e-9);
assert(Math.abs(allowanceNet - 11585.76) < 1e-8);
assert(split.every(x => x.saving > 140));
assert(Math.abs(100 * (supplements.SK - supplements.BC) / oas - 35.225446) < .00001);
console.log(JSON.stringify({results, split,
  supplements:{...supplements,denominator:oas,
    BC_points:100*supplements.BC/oas, SK_points:100*supplements.SK/oas,
    gap_points:100*(supplements.SK-supplements.BC)/oas},
  mbProperty:{amount:mbProperty, denominator:35000, points:100*mbProperty/35000}},null,2));
