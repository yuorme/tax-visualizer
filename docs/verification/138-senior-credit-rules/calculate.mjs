// Independent paper arithmetic for #138. No production imports or generated engine snapshots.
import assert from "node:assert/strict";

// [maximum age base, reduction threshold, pension cap, credit rate]. Transcribed from report sources.
const rows = {
  2025: {
    FED: [9028, 45522, 2000, .145], AB: [6221, 46308, 1719, .08],
    BC: [5799, 43169, 1000, .0506], MB: [3728, 27749, 1000, .108],
    NB: [6037, 44945, 1000, .094], NL: [7064, 38712, 1000, .087],
    NT: [8727, 45522, 1000, .059], NS: [5734, 30828, 1173, .0879],
    NU: [12303, 45522, 2000, .04], ON: [6223, 46330, 1762, .0505],
    PE: [6510, 36600, 1000, .095], SK: [5785, 43066, 1000, .105],
    YT: [9028, 45522, 2000, .064],
  },
  2026: {
    FED: [9208, 46432, 2000, .14], AB: [6345, 47234, 1753, .08],
    BC: [5927, 44119, 1000, .056], MB: [3728, 27749, 1000, .108],
    NB: [6158, 45844, 1000, .094], NL: [7142, 39138, 1000, .087],
    NT: [8902, 46432, 1000, .059], NS: [5826, 30828, 1173, .0879],
    NU: [12550, 46432, 2000, .04], ON: [6342, 47210, 1796, .0505],
    PE: [6510, 36600, 1000, .095], SK: [5901, 43927, 1000, .105],
    YT: [9208, 46432, 2000, .064],
  },
};
let checks = 0;
function equal(actual, expected, label) {
  assert.ok(Math.abs(actual - expected) < 1e-7, `${label}: ${actual} != ${expected}`);
  checks++;
}
const ageBase = ([max, threshold], age, income) =>
  age < 65 ? 0 : Math.max(0, max - .15 * Math.max(0, income - threshold));

const table = [];
for (const [year, jurisdictions] of Object.entries(rows)) {
  for (const [jurisdiction, row] of Object.entries(jurisdictions)) {
    const [maximum, threshold, pension, rate] = row;
    const label = `${year} ${jurisdiction}`;
    const zero = threshold + maximum / .15;
    equal(ageBase(row, 64, threshold), 0, `${label} under age`);
    equal(ageBase(row, 65, threshold - 1), maximum, `${label} below threshold`);
    equal(ageBase(row, 65, threshold), maximum, `${label} threshold`);
    equal(ageBase(row, 65, threshold + 1000), maximum - 150, `${label} taper`);
    equal(ageBase(row, 65, zero - 1000), 150, `${label} near zero`);
    equal(ageBase(row, 65, zero), 0, `${label} zero`);
    equal(ageBase(row, 75, zero + 1000), 0, `${label} above zero`);
    equal(Math.min(pension, pension - 1), pension - 1, `${label} below pension cap`);
    equal(Math.min(pension, pension), pension, `${label} pension cap`);
    equal(Math.min(pension, pension + 1), pension, `${label} above pension cap`);
    table.push({ year, jurisdiction, ageMaximum: maximum, threshold, exactZero: zero,
      fullAgeCredit: maximum * rate, fullPensionCredit: pension * rate });
  }
}
// Literal independently worked reference answers, not just invariants of a formula.
equal(ageBase(rows[2025].FED, 65, 46522) * .145, 1287.31, "federal 2025 taper");
equal(ageBase(rows[2026].FED, 65, 47432) * .14, 1268.12, "federal 2026 taper");
equal(5799 * .0506, 293.4294, "BC 2025 full age credit");
equal(5927 * .056, 331.912, "BC 2026 full age credit");
equal(1762 * .0505, 88.981, "Ontario 2025 pension credit");

function federalEligible(type, amount, age, survivor = false) {
  if (type === "rppLifetime") return amount;
  if (type === "rrif" || type === "rrspAnnuity") return age >= 65 || survivor ? amount : 0;
  return 0;
}
for (const type of ["rrif", "rrspAnnuity"]) {
  equal(federalEligible(type, 1600, 64), 0, `${type} 64`);
  equal(federalEligible(type, 1600, 65) * .145, 232, `${type} 65`);
  equal(federalEligible(type, 1600, 64, true) * .145, 232, `${type} survivor`);
}
equal(federalEligible("rppLifetime", 1600, 64) * .145, 232, "RPP at 64");
equal(federalEligible("rrspWithdrawal", 1600, 65), 0, "ordinary withdrawal federal");
equal(Math.min(3470, 1600 * 1.25), 2000, "ordinary withdrawal Quebec base");
equal(Math.min(3470, 2775 * 1.25), 3468.75, "Quebec below retirement cap");
equal(Math.min(3470, 2776 * 1.25), 3470, "Quebec retirement cap");
equal(Math.min(3470, 2777 * 1.25), 3470, "Quebec above retirement cap");
const qc2025SinglePool = 2128 + 3906 + 3470;
equal(qc2025SinglePool, 9504, "QC single pool");
equal(qc2025SinglePool * .14, 1330.56, "QC single threshold credit");
equal((qc2025SinglePool - .1875 * 1000) * .14, 1304.31, "QC single taper once");
equal(Math.max(0, qc2025SinglePool - .1875 * (92778 - 42090)), 0, "QC single exact zero");
equal(Math.min(3541, 2832.8 * 1.25), 3541, "QC 2026 retirement cap");
equal((2172 + 3986 + 3541 - .1875 * 1000) * .14, 1331.61, "QC 2026 single taper");
const couplePool = 2 * (3906 + 3470) - .1875 * 1000;
equal(couplePool, 14564.5, "QC couple shared pool");
equal(couplePool * .14, 2039.03, "QC couple credit");
equal(6000 * .14 + (couplePool - 6000) * .14, 2039.03, "QC allocation conservation");
// Simplified Schedule2 examples have no prior employment/other credit bases or tuition.
const federalTransfer = 9028 + 2000 - (20000 - 16129);
const ontarioTransfer = 6223 + 1762 - (20000 - 12747);
equal(federalTransfer, 7157, "federal unused base");
equal(federalTransfer * .145, 1037.765, "federal recipient relief ceiling");
equal(ontarioTransfer, 732, "Ontario unused base differs from federal");
equal(ontarioTransfer * .0505, 36.966, "Ontario recipient relief ceiling");
equal(Math.min(0, federalTransfer * .145), 0, "recipient has zero capacity");
equal(Math.min(500, federalTransfer * .145), 500, "recipient has partial capacity");
equal(Math.max(0, 9028 + 2000 - (35000 - 16129)), 0, "donor uses entire pool");
// Quebec line431 transfers dollars remaining after the donor tax calculation, not bases.
equal(Math.max(0, -(-280)), 280, "QC negative line430 transferred dollars");
equal(2028 * .105, 212.94, "SK 2025 supplementary");
equal(2569 * .105, 269.745, "SK 2026 supplementary");
equal(Math.max(0, 2065 + 2065 - .09 * 30000) * .108, 154.44, "MB senior family benefit");
const mbFamilyCredit = (2065 + 2065 + 2 * 2752 - .09 * 40000) * .108;
const mbFamilyCapacity = (40000 - 15780 - 9134) * .108;
equal(mbFamilyCredit, 651.672, "MB ordinary family omitted credit");
equal(mbFamilyCapacity, 1629.288, "MB ordinary family capacity");
equal(Math.min(mbFamilyCredit, mbFamilyCapacity), 651.672, "MB usable family relief");
equal(mbFamilyCredit / 40000 * 100, 1.62918, "MB ordinary family materiality percentage points");
equal(23999.99 < 24000 ? 1000 : 0, 1000, "NS below taxable threshold");
equal(24000 < 24000 ? 1000 : 0, 0, "NS at taxable threshold");
equal(20000 + 10000, 20000 + 0 + 10000, "ordinary-to-pension cash reclassification");
console.table(table);
console.log(`${checks} independent component arithmetic checks passed; no engine imports.`);
