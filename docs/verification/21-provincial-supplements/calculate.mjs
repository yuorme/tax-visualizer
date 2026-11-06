// Independent arithmetic for #21. No engine imports, capture mode or engine-produced expected values.
// Cash constants below are transcribed from the cached government tables, not the application's YAML.
// Existing expectations use the immutable pre-feature commit plus the independently calculated change.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../../..");
const baseline = "1ecf27a";
const r4 = n => Math.round(n * 1e4) / 1e4;
const cents = n => Math.round(n * 100) / 100;
const original = file => JSON.parse(execFileSync("git", ["show", `${baseline}:${file}`], { cwd: root, encoding: "utf8" }));
const maximum = year => ({
  // BC published monthly maxima; AB calculator rounds UP per recipient/month, then twelve months.
  BC: [99.30 * 12, 110.25 * 24, (110.25 + 99.83) * 12],
  AB: year === 2025 ? [322.34 * 12, 241.71 * 24, 483.42 * 12] : [328.84 * 12, 246.59 * 24, 493.17 * 12],
  SK: [360 * 12, 325 * 24, 360 * 12],
  MB: [161.80 * 4, 173.90 * 8, 173.90 * 8],
  ON: year === 2025 ? [87 * 6 + 90 * 6, 87 * 12 + 90 * 12, 87 * 6 + 90 * 6] :
    [90 * 6 + 92 * 6, 90 * 12 + 92 * 12, 90 * 6 + 92 * 6],
  NB: Array(3).fill(year === 2025 ? 616 : 629),
  NT: [196 * 12, 196 * 24, 196 * 24],
  NU: [300 * 12, 300 * 24, 300 * 24],
});
const federalBpa = (year, income) => {
  // CRA federal worksheets, net-income taper; 2025 and 2026 parameters respectively.
  const [max, min, from, to] = year === 2025 ? [16129, 14538, 177882, 253414] : [16452, 14829, 181440, 258482];
  return max - (max - min) * Math.min(1, Math.max(0, (income - from) / (to - from)));
};
const careRate = income => .75 - .02 * (
  Math.ceil(Math.max(0, Math.min(income, 40000) - 20000) / 2500) +
  Math.ceil(Math.max(0, Math.min(income, 60000) - 40000) / 5000) +
  Math.ceil(Math.max(0, Math.min(income, 150000) - 60000) / 3600));

// ITA 180.2 and the CRA line-23500 worksheet: reportable assistance is in line 23400.
// The existing recovery specimens all have zero work/investment income, full-year benefits and a
// nil combined GIS-income proxy (the other spouse's deductions offset private income).
function recoveryChange(c, reporter, assistance) {
  const x = c.household.people[reporter];
  const threshold = c.year === 2025 ? 93454 : 95323;
  if ((x.oth ?? 0) < threshold) return { delta: 0 };
  assert.equal(x.ord ?? 0, 0);
  for (const key of ["cg", "ed", "nd", "fd", "ded", "rrsp", "fhsa"])
    assert.equal(x[key] ?? 0, 0, `${c.id}: recovery specimen ${key}`);
  const oas = x.oas ? (c.year === 2025 ? 8791.14 : 8999.49) : 0;
  const partner = c.household.people[1 - reporter];
  const federal = x.allowance ? (c.year === 2025 ? 16695.09 : 17090.91) : x.gis ?
    partner?.allowance ? (c.year === 2025 ? 7903.95 : 8091.42) : (c.year === 2025 ? 13130.82 : 13441.98) : 0;
  const income = x.oth + oas + federal;
  const before = Math.min(oas + federal, .15 * Math.max(0, income - threshold));
  const after = Math.min(oas + federal, .15 * Math.max(0, income + assistance - threshold));
  const federalDeduction = Math.max(0, federal - Math.max(0, after - oas));
  return { before, after, delta: after - before, deduction: federalDeduction + assistance,
    beforeDeduction: Math.max(0, federal - Math.max(0, before - oas)),
    supplementRecovery: federal - federalDeduction };
}

export function existingChanges() {
  const changes = [];
  for (const name of ["gis-allowance.json", "senior-audit.json"]) {
    const file = `tests/golden/features/${name}`;
    for (const c of original(file).cases) {
      assert.ok(c.year === 2025 || c.year === 2026);
      const suffix = c.id.replace(/^\d{4}-[A-Z]{2}-/, "");
      const kind = ["single", "couple-oas", "allowance"].indexOf(suffix);
      let cash = 0;
      if (name === "gis-allowance.json" && kind >= 0) cash = maximum(c.year)[c.province]?.[kind] ?? 0;
      // Each listed ON historical-income case remains in the maximum GAINS plateau: its GIS-income
      // proxy is zero or, for working mixed-age families, below the published one-pensioner offset.
      const ontario = ["deductions-before-net-floor", "supplement-recovery-cap", "partial-recovery-100000",
        "partial-recovery-150000", "t778-supplements-reverse-claimant", "net-tested-bpa-recovery", "net-tested-cwb",
        "audit-t778-negative-base", "audit-allowance-recovery", "audit-care-income", "audit-cwb-secondary-earner"];
      if (name === "gis-allowance.json" && c.province === "ON" && ontario.includes(suffix)) cash = maximum(c.year).ON[0];
      if (name === "gis-allowance.json" && c.province === "MB" && suffix === "audit-bpa-net") cash = 647.20;
      if (name === "senior-audit.json" && c.province === "ON" && suffix === "allowance-before-childcare") cash = maximum(c.year).ON[0];
      if (!cash) continue;
      assert.ok(c.household.people.some(x => x.age >= 65));
      const expected = structuredClone(c.expected);
      const expectedCredits = structuredClone(c.expectedCredits ?? {});
      const reporter = suffix.includes("allowance-recovery") || suffix === "allowance-before-childcare" ||
        suffix === "audit-t778-negative-base" ? 1 : 0;
      const recovery = recoveryChange(c, reporter, cash);
      const netIncrease = cash - recovery.delta;
      for (const [key, old] of Object.entries(expected)) {
        if (key === "total") expected[key] = r4(old - cash);
        else if (key === "breakdown.left") expected[key] = r4(old + cash);
        else if (key === "famNet") expected[key] = r4(old + netIncrease);
        else if (key === "ccb") expected[key] = r4(old - .07 * netIncrease); // one-child CCB first reduction band
        else if (key === "breakdown.childcareCredit.income") expected[key] = r4(old + cash);
        else if (key === "breakdown.childcareCredit.rate") expected[key] = r4(careRate(c.expected["breakdown.childcareCredit.income"] + cash));
        else if (key === "breakdown.childcareCredit.applied") expected[key] = r4(8000 * careRate(c.expected["breakdown.childcareCredit.income"] + cash));
        else if (key === "list.0.fAmt" || key === "list.0.fBpaFull") {
          const bpa = federalBpa(c.year, c.expected.famNet + netIncrease);
          expected[key] = r4(bpa * (key.endsWith("fBpaFull") ? (c.year === 2025 ? .145 : .14) : 1));
        } else if (key === "list.0.pAmt" || key === "list.0.pBpaFull") {
          const bpa = 15780 * (1 - (c.expected["list.0.breakdown.netIncomeTotal"] + netIncrease - 200000) / 200000);
          expected[key] = r4(bpa * (key.endsWith("pBpaFull") ? .108 : 1));
        } else if ([`list.${reporter}.breakdown.publicPensions.recoveryTax`,
          `list.${reporter}.breakdown.netIncome.oasRecovery`].includes(key) && recovery.after !== undefined)
          expected[key] = r4(recovery.after);
        else if (key === `list.${reporter}.breakdown.supplementRecovery` && recovery.after !== undefined)
          expected[key] = r4(recovery.supplementRecovery);
        else if (key === `list.${reporter}.breakdown.otherPaymentsDeduction`)
          expected[key] = r4(recovery.deduction ?? old + cash);
        else if (key === `list.${reporter}.ti` && recovery.after !== undefined)
          expected[key] = r4(old - recovery.delta + recovery.beforeDeduction -
            (recovery.deduction - cash));
        else if ([`breakdown.incomeBases.beforeChildcareAndRecovery.${reporter}`,
          `list.${reporter}.breakdown.publicPensions.recoveryIncome`].includes(key)) expected[key] = r4(old + cash);
        else if ([`list.${reporter}.breakdown.netIncomeTotal`, `breakdown.incomeBases.beforeChildcare.${reporter}`,
          `breakdown.incomeBases.provincial.${reporter}`].includes(key)) expected[key] = r4(old + netIncrease);
      }
      if (expectedCredits["Canada Workers Benefit"] !== undefined)
        expectedCredits["Canada Workers Benefit"] = r4(expectedCredits["Canada Workers Benefit"] - .15 * netIncrease);
      const fields = Object.keys(expected).filter(k => expected[k] !== c.expected[k]).length +
        Object.keys(expectedCredits).filter(k => expectedCredits[k] !== c.expectedCredits?.[k]).length;
      if (fields) changes.push({ file, id: c.id, year: c.year, province: c.province, expected, expectedCredits, fields });
    }
  }
  return changes;
}

// Change only the independently derived values in each named case. Preserve all other bytes, including
// unrelated numeric formatting. No production calculation is used to choose or fill expectations.
export function writeExisting() {
  for (const c of existingChanges()) {
    const filename = path.join(root, c.file);
    let text = fs.readFileSync(filename, "utf8");
    const start = text.indexOf(`"id": "${c.id}"`);
    assert.ok(start >= 0);
    let end = text.indexOf('\n      "id":', start + 1);
    if (end < 0) end = text.length;
    let section = text.slice(start, end);
    for (const [key, value] of [...Object.entries(c.expected), ...Object.entries(c.expectedCredits)]) {
      assert.ok(Number.isFinite(value), `${c.id}: finite expectation ${key}`);
      const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const pattern = new RegExp(`("${escaped}": )(-?\\d+(?:\\.\\d+)?)`);
      const match = section.match(pattern);
      assert.ok(match, `${c.id}: ${key}`);
      if (Number(match[2]) !== value) section = section.replace(pattern, `$1${value}`);
    }
    text = text.slice(0, start) + section + text.slice(end);
    fs.writeFileSync(filename, text);
  }
}

// Independent examples used by the new feature fixture and direct boundary tests.
export const algebra = {
  ab: (maximum, rate, income, recipients = 1) => {
    const raw = Math.round(Math.max(0, (maximum - rate * income) / 12 / recipients) * 10000) / 10000;
    return raw > 0 ? Math.max(10, Math.ceil(raw * 100 - 1e-9) / 100) : 0;
  },
  qc: (year, income, seniors = 1, couple = false) => {
    const threshold = year === 2025 ? (couple ? 45270 : 27835) : (couple ? 46200 : 28405);
    return Math.max(0, seniors * 2000 - (year === 2025 ? .054 : .0547) * Math.max(0, income - threshold));
  },
  mb: (income, adults, seniors, dependant = 0, children = 0) =>
    Math.max(0, adults * 195 + seniors * 113 + dependant * 195 + children * 26 - .01 * income),
  ns: liability => liability <= 0 ? 0 : Math.min(10000, Math.max(50, liability)),
  nl: (maximum, threshold, income) => Math.max(0, maximum - .1166 * Math.max(0, income - threshold)),
};
assert.equal(algebra.ab(3946, .1552, 10000), 199.50);
assert.equal(algebra.ab(5918, .1717, 0, 2), 246.59);
assert.equal(algebra.ab(3946, .1714, 23022.16), 10);
assert.equal(algebra.ab(3946, .1714, 23022.17), 0);
assert.equal(r4(algebra.qc(2025, 35000)), 1613.09);
assert.equal(r4(algebra.qc(2026, 35000)), 1639.2535);
assert.equal(algebra.mb(35000, 2, 2), 266);
assert.equal(algebra.ns(.01), 50);
assert.equal(r4(algebra.nl(1882, 30409, 46210)), 39.6034);
assert.equal(cents(99.30 * 12), 1191.60);

export function newFixture() {
  const cases = [];
  const defaults = { active: 0, spouse: false, adults: 1, kids: 0, under6: 0, useBpa: true,
    whRate: 0, useCredits: false, homeValue: 0, rent: 0, monthlySpending: 0 };
  const old = (oth = 0, extra = {}) => ({ age: 70, birthMonth: 6, oas: true, gis: true, oth, ...extra });
  const allowance = { age: 62, birthMonth: 6, allowance: true };
  const cashCase = (year, province, suffix, people, cash, reported = cash, extra = {}) => {
    const c = { id: `${year}-${province}-${suffix}`, year, province,
      household: { people, adults: people.length, spouse: people.length === 2, ...extra },
      cash: cash.map(cents), reported: reported.map(cents) };
    cases.push(c);
    return c;
  };
  const creditCase = (year, province, suffix, people, name, credit, extra = {}) => {
    cases.push({ id: `${year}-${province}-${suffix}`, year, province,
      household: { people, adults: people.length, spouse: people.length === 2, useCredits: true, ...extra },
      expectedCredits: { [name]: cents(credit) } });
  };
  // Manitoba's enacted dollar rows are parsed independently from the original amendment, including its tail.
  const mb = fs.readFileSync(path.join(here, "sources/mbqc-phase2-senior-original-128-2008.txt"), "utf8");
  const sections = [...mb.matchAll(/^2\(([1-5])\) The/gm)];
  const mbTables = sections.map((start, i) => [...mb.slice(start.index, sections[i + 1]?.index ?? mb.length)
    .matchAll(/^\$\s*([\d,]+\.\d\d)\s*-\s*\$\s*([\d,]+\.\d\d)\s*\$\s*([\d,]+\.\d\d)/gm)]
    .map(row => row.slice(1).map(n => Number(n.replaceAll(",", "")))));
  const mbQuarter = (index, income) => mbTables[index].find(([lo, hi]) => income >= lo && income <= hi)?.[2] ?? 0;
  const sourceFiles = fs.readdirSync(path.join(here, "sources"));
  const oas = Object.fromEntries([2025, 2026].map(year => [year, ["jan", "apr", "jul", "oct"].map(quarter => {
    const file = sourceFiles.find(name => name.startsWith(`on-${quarter}`) && name.includes(String(year)) && name.includes("single"));
    assert.ok(file);
    const row = fs.readFileSync(path.join(here, "sources", file), "utf8").split("\n").find(line => /^0,/.test(line));
    assert.ok(row);
    return Number(row.split(",")[4]); // single-table column 3 is combined OAS/GIS, column 4 is OAS
  })]));
  for (const year of [2025, 2026]) {
    for (const [province, amounts] of Object.entries(maximum(year))) {
      const single = province === "NB" ? [amounts[0]] : [amounts[0]];
      cashCase(year, province, "maximum-single", [old()], single);
      const per = province === "NB" ? [amounts[1], 0] : [amounts[1] / 2, amounts[1] / 2];
      cashCase(year, province, "maximum-two-pensioners", [old(), old()], per);
    }
    cashCase(year, "BC", "reporting-five-months", [old(0, { age: 65, birthMonth: 7 })], [496.50], [0]);
    cashCase(year, "BC", "reporting-six-months", [old(0, { age: 65, birthMonth: 6 })], [595.80]);
    cashCase(year, "BC", "reduced-exempt-series", [old(1800)], [24.30 * 12], [0]);
    cashCase(year, "BC", "positive-minimum", [old(2256)], [12], [0]);
    cashCase(year, "BC", "first-zero", [old(2280)], [0]);
    cashCase(year, "BC", "allowance-protection", [old(4800), allowance], [102.25 * 12, 0], [102.25 * 12, 0]);
    // In a tie, each named recipient keeps their T5007 amount; higher-income spouse reports both otherwise.
    cashCase(year, "BC", "higher-reporter", [old(0), old(48)], [109.25 * 12, 109.25 * 12], [0, 109.25 * 24]);
    cashCase(year, "AB", "below-minimum-age", [old(0, { age: 64, birthMonth: 6 })], [0]);
    cashCase(year, "AB", "birthday-month-start", [old(0, { age: 65, birthMonth: 6 })],
      [(year === 2025 ? 322.34 : 328.84) * 7]);
    cashCase(year, "SK", "first-gis-month", [old(0, { age: 65, birthMonth: 7 })], [360 * 5]);
    cashCase(year, "ON", "first-gis-month", [old(0, { age: 65, birthMonth: 7 })], [(year === 2025 ? 90 : 92) * 5]);
    cashCase(year, "NT", "one-month-reportable", [old(0, { age: 65, birthMonth: 11 })], [196]);
    cashCase(year, "NU", "one-month-reportable", [old(0, { age: 65, birthMonth: 11 })], [300]);
    for (const category of ["married-1penn", "married-spouse"]) {
      const cash = Array.from({ length: 12 }, (_, month) => {
        const quarter = ["jan", "apr", "jul", "oct"][Math.floor(month / 3)];
        const prefix = month === 0 ? "on-" : "phase2-on75-";
        const file = sourceFiles.find(name => name.startsWith(prefix + quarter) && name.includes(String(year)) && name.includes(category));
        assert.ok(file);
        const rows = fs.readFileSync(path.join(here, "sources", file), "utf8").split("\n")
          .filter(line => /^\d[\d.]*,/.test(line)).map(line => line.split(",").map(Number));
        return rows.find(([lo, hi]) => 9300 >= lo && 9300 <= hi)?.[2] ?? 0;
      }).reduce((a, b) => a + b, 0);
      cashCase(year, "ON", `turning-75-${category}`, [old(9300, { age: 75, birthMonth: 1 }),
        category === "married-spouse" ? allowance : { age: 55, birthMonth: 6 }], [cash, 0]);
    }
    const periods = year === 2025 ? [[3868, .1589], [3868, .1522]] : [[3946, .1552], [3946, .1714]];
    for (const income of [10000, 23022.16, 23022.17, 25425.25, 25425.26]) {
      const annual = periods.reduce((s, [maximum, rate]) => s + algebra.ab(maximum, rate, income) * 6, 0);
      cashCase(year, "AB", `oracle-income-${income}`, [old(income)], [annual]);
    }
    cashCase(year, "AB", "employment-exemption", [old(0, { ord: 3600 })], [maximum(year).AB[0]]);
    cashCase(year, "AB", "rrsp-deduction", [old(10000, { rrsp: 10000, gis: false })], [maximum(year).AB[0]]);
    cashCase(year, "AB", "oas-receipt-required", [old(0, { oas: false, gis: false })], [0]);
    const abIncome = periods.reduce((sum, [maximum, rate]) => sum + algebra.ab(maximum, rate, 10000) * 6, 0);
    const abNoGis = cashCase(year, "AB", "net-income-without-gis", [old(10000, { gis: false })], [abIncome]);
    abNoGis.expected = { "breakdown.incomeBases.provincial.0": r4(10000 + (year === 2025 ? 8791.14 : 8999.49) + abIncome),
      "list.0.breakdown.netIncomeTotal": r4(10000 + (year === 2025 ? 8791.14 : 8999.49) + abIncome),
      "list.0.ti": r4(10000 + (year === 2025 ? 8791.14 : 8999.49)) };
    // Both return incomes BEFORE childcare/recovery are exactly OAS + $10,000. Age 71 pays no CPP;
    // the age-59 spouse deducts $65 enhanced CPP. A tie retains ASB on its sole cash recipient.
    // Assistance then makes the spouse the lower-income T778 claimant; each has $10,000 eligible wages.
    const oasAnnual = year === 2025 ? 8791.14 : 8999.49;
    const otherIncome = oasAnnual + 65;
    const asbIncome = 10000 + otherIncome + 10000 - 3600 * 2;
    const couplePeriods = year === 2025 ? [[5801, .1592], [5801, .1524]] : [[5918, .1554], [5918, .1717]];
    const tiedCash = couplePeriods.reduce((sum, [maximum, rate]) => sum + 6 * algebra.ab(maximum, rate, asbIncome), 0);
    const tie = cashCase(year, "AB", "tied-reporters-assistance-t778", [
      { age: 71, birthMonth: 6, oas: true, ord: 10000 },
      { age: 59, birthMonth: 6, ord: 10000, oth: otherIncome }], [tiedCash, 0], [tiedCash, 0],
      { childcare: { mode: "automatic", children: [{ age: 4, expenses: 6000 }], earnedIncome: [10000, 10000] } });
    tie.expected = { "childcare.claimant": 1, "childcare.claims.0": 0, "childcare.claims.1": 6000,
      "breakdown.incomeBases.beforeChildcareAndRecovery.0": r4(10000 + oasAnnual + tiedCash),
      "breakdown.incomeBases.beforeChildcareAndRecovery.1": r4(10000 + oasAnnual) };
    cashCase(year, "AB", "generic-deduction-not-rrsp", [old(10000, { ded: 10000 })],
      [periods.reduce((s, [maximum, rate]) => s + algebra.ab(maximum, rate, 10000) * 6, 0)]);
    cashCase(year, "AB", "negative-adult-income-floor", [old(-5000), old(10000)],
      [year === 2025 ? (175.38 + 178.21) * 6 : (181.84 + 175.05) * 6,
        year === 2025 ? (175.38 + 178.21) * 6 : (181.84 + 175.05) * 6],
      [0, year === 2025 ? (175.38 + 178.21) * 12 : (181.84 + 175.05) * 12]);
    cashCase(year, "SK", "single-first-reduction", [old(24)], [358.10 * 12]);
    cashCase(year, "SK", "couple-first-reduction", [old(48), old()], [322.90 * 12, 322.90 * 12], [322.90 * 24, 0]);
    cashCase(year, "SK", "neither-first-topup-reduction", [old(4096), { age: 55, birthMonth: 6 }], [360 * 12, 0]);
    cashCase(year, "SK", "allowance-first-reduction", [old(48), allowance], [358.10 * 12, 0]);
    // Preserve the old case inputs/ids: these expose the former premature total-GIS taper.
    cashCase(year, "SK", "positive-minimum", [old(3696)], [(360 - 154 * 1.9) * 12]);
    cashCase(year, "SK", "first-zero", [old(3720)], [(360 - 155 * 1.9) * 12]);
    for (const income of [4000, 4367.99, 4368, 4536, 4559.99, 4560]) {
      const raw = 360 - 1.9 * Math.floor(income / 24);
      cashCase(year, "SK", `single-admin-tail-${income}`, [old(income)], [raw > 0 ? Math.max(15, raw) * 12 : 0]);
    }
    for (const income of [7439.99, 7440]) {
      const raw = 325 - 2.1 * Math.floor(income / 48);
      const cash = raw > 0 ? Math.max(15, raw) * 12 : 0;
      cashCase(year, "SK", `couple-admin-tail-${income}`, [old(income), old()], [cash, cash], [cash * 2, 0]);
    }
    for (const income of [9119.99, 9120]) {
      const raw = 360 - 1.9 * Math.floor(income / 48);
      cashCase(year, "SK", `allowance-admin-tail-${income}`, [old(income), allowance], [raw > 0 ? Math.max(15, raw) * 12 : 0, 0]);
    }
    const neitherCutoff = year === 2025 ? 11568 : 11808;
    for (const income of [neitherCutoff - .01, neitherCutoff]) {
      const cash = oas[year].reduce((sum, monthly) => {
        const offset = 12 * Math.ceil(monthly / 4) * 4;
        const raw = 360 - 6.55 * Math.floor(Math.max(0, income - offset) / 48);
        return sum + (raw > 0 ? Math.max(15, raw) * 3 : 0);
      }, 0);
      cashCase(year, "SK", `neither-admin-tail-${income}`, [old(income), { age: 55, birthMonth: 6 }], [cash, 0]);
    }
    cashCase(year, "NT", "gis-in-reporter-comparison", [old(), { age: 59, birthMonth: 6, oth: 12000 }], [2352, 0]);
    const gains = maximum(year).ON[0];
    const federalGis = year === 2025 ? 7903.95 : 8091.42;
    const recoveryIncome = 100000 + oasAnnual + federalGis + gains;
    const recovery = .15 * (recoveryIncome - (year === 2025 ? 93454 : 95323));
    const partial = cashCase(year, "ON", "assistance-partial-recovery", [old(100000), { ...allowance, ded: 100000 }], [gains, 0]);
    partial.expected = { "list.0.breakdown.publicPensions.recoveryTax": r4(recovery),
      "list.0.breakdown.publicPensions.recoveryIncome": r4(recoveryIncome),
      "list.0.breakdown.netIncomeTotal": r4(recoveryIncome - recovery),
      "list.0.ti": r4(100000 + oasAnnual - recovery) };
    for (const income of [23.99, 24, 816, 839.99, 840]) {
      const cash = mbQuarter(0, income) * 4;
      cashCase(year, "MB", `single-band-${income}`, [old(income)], [cash]);
    }
    for (const income of [47.99, 48, 1560, 1823.99, 1824]) {
      const cash = mbQuarter(1, income) * 4;
      cashCase(year, "MB", `two-pensioner-band-${income}`, [old(income), old()], [cash, cash], [cash * 2, 0]);
    }
    for (const income of [3600, 3647.99, 3648]) {
      const cash = mbQuarter(3, income) * 4;
      cashCase(year, "MB", `allowance-band-${income}`, [old(income), allowance], [cash, cash], [cash * 2, 0]);
    }
    // Full-quarter offset examples avoid a fabricated linear taper between the published statutory rows.
    for (const income of [0, 9000, 9400]) {
      const cash = oas[year].reduce((sum, monthly) => sum + mbQuarter(2, Math.max(0, income - 12 * Math.ceil(monthly / 4) * 4 - 47.99)), 0);
      cashCase(year, "MB", `nonpensioner-offset-${income}`, [old(income), { age: 50, birthMonth: 6 }], [cash, 0]);
    }
    for (const [income, cash] of [[8930.40, 647.20], [9722.40, 73.20], [9722.41, 55.60], [9746.40, 55.60], [9746.41, 0]])
      cashCase(year, "MB", `junior-terminal-${income}`, [{ age: 60, birthMonth: 1, oth: income }], [cash]);
    const juniorText = fs.readFileSync(path.join(here, "sources/mbqc-phase2-junior-original-129-2008.txt"), "utf8");
    const coupleText = juniorText.slice(juniorText.indexOf("4(2) Where"));
    const coupleRows = [...coupleText.matchAll(/^\$\s*([\d,]+\.\d\d)\s*-\s*\$\s*([\d,]+\.\d\d)\s*\$\s*([\d,]+\.\d\d)/gm)]
      .map(row => row.slice(1).map(n => Number(n.replaceAll(",", ""))));
    for (const income of [14479.20, 14479.21, 16207.20, 16207.21, 16255.20, 16255.21]) {
      const cash = coupleRows.find(([lo, hi]) => income >= lo && income <= hi)?.[2] ?? 0;
      cashCase(year, "MB", `junior-couple-${income}`, [{ age: 60, birthMonth: 1, oth: income }, { age: 60, birthMonth: 1 }],
        [cash, cash], [cash * 2, 0]);
    }
    cashCase(year, "MB", "junior-one-age-eligible", [{ age: 60, birthMonth: 1 }, { age: 54, birthMonth: 1 }], [695.60, 0]);
    for (const [age, birthMonth, quarters] of [[54, 1, 0], [55, 1, 4], [55, 6, 3], [55, 12, 1], [56, 12, 4], [64, 12, 4], [65, 12, 0]])
      cashCase(year, "MB", `junior-age-${age}-${birthMonth}`, [{ age, birthMonth }], [647.20 * quarters / 4]);
    cashCase(year, "MB", "junior-employment-expenses", [{ age: 60, birthMonth: 1, ord: 9490 }], [647.20]);
    // $10,500 - $346.50 base CPP - $70 enhanced CPP - $172.20/$171.15 EI - $500 =
    // $9,411.30/$9,412.35, inside the enacted $9,410.41–$9,434.40 row paying $282 annually.
    cashCase(year, "MB", "junior-base-cpp-deduction", [{ age: 60, birthMonth: 1, ord: 10500 }], [282]);
    const juniorNet = cashCase(year, "MB", "junior-income-breakdown", [{ age: 60, birthMonth: 1, oth: 5000 }], [647.20]);
    juniorNet.expected = { "breakdown.incomeBases.provincial.0": 5647.20, "list.0.breakdown.netIncomeTotal": 5647.20,
      "list.0.ti": 5000 };
    cashCase(year, "MB", "junior-cash-dividends", [{ age: 60, birthMonth: 1, ed: 9000 }], [595.20], [595.20]);
    cashCase(year, "MB", "junior-rrsp-not-deducted", [{ age: 60, birthMonth: 1, oth: 9000, rrsp: 5000 }], [595.20]);
    cashCase(year, "MB", "junior-capital-loss", [{ age: 60, birthMonth: 1, oth: 10000, cg: -1000 }], [595.20]);
    cashCase(year, "MB", "junior-mixed-oas-unsupported", [old(), { age: 60, birthMonth: 1 }], [647.20, 0]);
    const mbName = "Manitoba personal tax credit (senior household)";
    creditCase(year, "MB", "personal-single", [{ age: 65, birthMonth: 1, oth: 25000 }], mbName, 58);
    creditCase(year, "MB", "personal-one-senior", [{ age: 65, birthMonth: 1, oth: 20000 }, { age: 50, birthMonth: 1, oth: 15000 }], mbName, 153);
    creditCase(year, "MB", "personal-two-seniors", [{ age: 65, birthMonth: 1, oth: 20000 }, { age: 70, birthMonth: 1, oth: 15000 }], mbName, 266);
    creditCase(year, "MB", "personal-dependant", [{ age: 65, birthMonth: 1, oth: 25000 }], mbName, 279,
      { kids: 2, under6: 0, childAges: [10, 16] });
    creditCase(year, "MB", "personal-age-18-child", [{ age: 65, birthMonth: 1, oth: 25000 }], mbName, 84,
      { kids: 0, childAges: [18] });
    creditCase(year, "MB", "personal-derived-age-18-child", [{ age: 65, birthMonth: 1, oth: 25000 }], mbName, 84,
      { kids: 0, childcare: { mode: "automatic", children: [{ age: 18, expenses: 0 }] } });
    const qcName = "Quebec Senior Assistance";
    for (const [age, income] of [[69, 35000], [70, 35000], [70, year === 2025 ? 27835 : 28405], [70, 70000]])
      creditCase(year, "QC", `assistance-${age}-${income}`, [{ age, birthMonth: 6, oth: income }], qcName,
        age < 70 ? 0 : algebra.qc(year, income));
    for (const ages of [[70, 69], [70, 70]]) creditCase(year, "QC", `assistance-couple-${ages.join('-')}`,
      ages.map(age => ({ age, birthMonth: 6, oth: 30000 })), qcName, algebra.qc(year, 60000, ages.filter(age => age >= 70).length, true));
    for (const [age, birthMonth, cash] of [[65, 1, 0], [66, 12, 0], [66, 11, year === 2025 ? 616 : 629]])
      cashCase(year, "NB", `prior-receipt-${age}-${birthMonth}`, [old(0, { age, birthMonth })], [cash]);
    creditCase(year, "NS", "refund-independent-liability", [old()], "Nova Scotia GIS tax refund",
      (year === 2025 ? 8791.14 : 8999.49) * .0879, { useBpa: false });
    creditCase(year, "NS", "no-gis-no-refund", [old(0, { gis: false })], "Nova Scotia GIS tax refund", 0, { useBpa: false });
    const nlName = "Newfoundland and Labrador Seniors' Benefit";
    const schedules = year === 2025 ? [[1516, 29402], [1551, 30078]] : [[1551, 30078], [1882, 30409]];
    for (const age of [64, 65, 66]) {
      const expected = (age >= 66 ? algebra.nl(...schedules[0], 35000) / 2 : 0) +
        (age >= 65 ? algebra.nl(...schedules[1], 35000) / 2 : 0);
      creditCase(year, "NL", `reference-age-${age}`, [{ age, birthMonth: 12, oth: 35000 }], nlName, expected);
    }
    if (year === 2026) {
      creditCase(year, "NL", "quarterly-above-ten", [{ age: 70, birthMonth: 1, oth: 46200 }], nlName, 20.3847);
      creditCase(year, "NL", "accelerated-below-ten", [{ age: 70, birthMonth: 1, oth: 46210 }], nlName, 39.6034);
      creditCase(year, "NL", "combined-not-senior-only", [{ age: 70, birthMonth: 1, oth: 46300 }, { age: 60, birthMonth: 1 }], nlName, 3.5547);
      creditCase(year, "NL", "combined-derived-child", [{ age: 70, birthMonth: 1, oth: 46300 }], nlName, 14.5547,
        { kids: 0, childcare: { mode: "automatic", children: [{ age: 10, expenses: 0 }] } });
    }
    for (const province of ["PE", "YT"]) cashCase(year, province, "explicit-no-supported-cash-path", [old()], [0]);
  }
  const monthlyCases = [];
  // All encoded Ontario quarterly/category/age offsets are checked against the actual downloaded CSVs.
  // First reduction, last positive and first zero are separate published rows; no engine-derived snapshot.
  for (const file of sourceFiles.filter(name => /^(on-|phase2-on75-)/.test(name) && /\d{4}.*(single|married)/.test(name))) {
    const year = Number(file.match(/202[56]/)?.[0]);
    if (!year) continue;
    const quarter = ["jan", "apr", "jul", "oct"].findIndex(month => file.includes(`-${month}`));
    if (quarter < 0) continue;
    const category = file.includes("single") ? "single" : file.includes("married-couple") ? "spouse-oas" :
      file.includes("1penn") ? "spouse-neither" : "spouse-allowance";
    const rows = fs.readFileSync(path.join(here, "sources", file), "utf8").split("\n")
      .filter(line => /^\d[\d.]*,/.test(line)).map(line => line.split(",").map(Number));
    const firstReduced = rows.findIndex(row => row[2] < rows[0][2]);
    const firstZero = rows.findIndex(row => row[2] === 0);
    for (const index of new Set([0, firstReduced - 1, firstReduced, firstZero - 1, firstZero])) {
      if (index < 0) continue;
      const row = rows[index];
      monthlyCases.push({ id: `${file}-${index}`, year, quarter, category, age: file.startsWith("phase2-on75-") ? 76 : 70,
        income: row[0], upper: row[1], expected: row[2], source: file });
    }
  }
  return { description: "Independent tables/form arithmetic in docs/verification/21-provincial-supplements/calculate.mjs",
    defaults, cases, monthlyCases };
}

if (process.argv.includes("--write-new")) fs.writeFileSync(path.join(root, "tests/golden/features/senior-supplements.json"), JSON.stringify(newFixture(), null, 2) + "\n");

if (process.argv.includes("--write-existing")) writeExisting();
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const changes = existingChanges();
  const counts = {};
  for (const c of changes) {
    const key = `${c.year}-${c.province}`;
    counts[key] ??= { cases: 0, fields: 0 };
    counts[key].cases++;
    counts[key].fields += c.fields;
  }
  console.log(JSON.stringify({ cases: changes.length, fields: changes.reduce((s, c) => s + c.fields, 0), counts }, null, 2));
}
