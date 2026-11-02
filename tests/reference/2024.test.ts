// Published 2024 reference values. Official sources are cached in docs/verification/2024/sources/federal-*;
// the combined-rate tables use the same independent secondary publisher as the existing 2025 references.
import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { loadYear } from "../../src/data/load.ts";
import { blank, ccbOf, compute, creditsOf, type Household, payrollOf } from "../../src/engine/index.ts";

const year = Number(path.basename(import.meta.filename, ".test.ts"));
const y = loadYear(year);
const prov = (code: string) => {
  const p = y.provinces.find(p => p.code === code);
  if (!p) throw new Error(`no province ${code}`);
  return p;
};
const single = (ord: number, extra: Partial<Household> = {}): Household => ({
  people: [blank(ord)],
  active: 0,
  spouse: true,
  adults: 1,
  kids: 0,
  under6: 0,
  useBpa: true,
  whRate: 0.15,
  useCredits: true,
  homeValue: 0,
  rent: 0,
  monthlySpending: 0,
  ...extra,
});
const near = (actual: number, expected: number, message: string) =>
  assert.ok(Math.abs(actual - expected) < 0.005, `${message}: ${actual} vs ${expected}`);

// TaxTips.ca 2024 columns: https://www.taxtips.ca/priortaxrates/tax-rates-2024-2025/<code>.htm
// Cached as reference-rates-<code>.txt. Quebec includes the federal abatement and Ontario includes surtax.
// NT/NU published ordinary rates are 47.05%/44.5%; add the territories' 2% employee payroll tax for this model.
// Dividends and gains are rates per dollar received; the capital-gains proposal did not take effect in 2024.
// Columns: employment income, capital gains, eligible dividends, non-eligible dividends.
const TOP: Record<string, [number, number, number, number]> = {
  BC: [53.5, 26.75, 36.54, 48.89],
  YT: [48, 24, 28.93, 44.04],
  AB: [48, 24, 34.31, 42.31],
  NT: [49.05, 23.53, 28.33, 36.82],
  SK: [47.5, 23.75, 29.64, 41.34],
  MB: [50.4, 25.2, 37.78, 46.67],
  NU: [46.5, 22.25, 33.08, 37.79],
  ON: [53.53, 26.76, 39.34, 47.74],
  QC: [53.31, 26.65, 40.11, 48.7],
  NB: [52.5, 26.25, 32.4, 46.83],
  PE: [51.75, 25.88, 36.2, 47.63],
  NS: [54, 27, 41.58, 48.28],
  NL: [54.8, 27.4, 46.2, 48.96],
};

test(`${year} top marginal rates in all jurisdictions match published tables`, () => {
  for (const [code, expected] of Object.entries(TOP)) {
    const actual = compute(y, prov(code), single(2_000_000)).margBy;
    for (const [i, kind] of (["ord", "cg", "ed", "nd"] as const).entries()) {
      // Published percentages are rounded to two places; avoid floating-point tie-breaking at .005.
      assert.ok(Math.abs(actual[kind] * 100 - expected[i]) <= 0.0051, `${code} ${kind}: ${actual[kind] * 100}`);
    }
  }
});

test("2024 payroll maximums match T4127 tables 8.4–8.10, including the first CPP2/QPP2 year", () => {
  const cpp = payrollOf(y.federal, prov("ON"), blank(100_000));
  near(cpp.base, 3217.5, "CPP base");
  near(cpp.enh, 838, "CPP enhanced: $650 first additional plus $188 second additional");
  near(cpp.ei, 1049.12, "EI maximum");
  const qpp = payrollOf(y.federal, prov("QC"), blank(100_000));
  near(qpp.base, 3510, "QPP base");
  near(qpp.enh, 838, "QPP enhanced");
  near(qpp.ei, 834.24, "Quebec EI maximum");
  near(qpp.qpip, 464.36, "QPIP maximum");
  near(payrollOf(y.federal, prov("ON"), blank(68_500)).enh, 650, "CPP at YMPE before CPP2 starts");
  near(payrollOf(y.federal, prov("ON"), blank(73_200)).enh, 838, "CPP at YAMPE");
});

test("2024 CCB maximums and reductions match T4114 July 2024–June 2025", () => {
  near(ccbOf(y.federal, 36_502, 1, 1), 7787, "under-6 maximum");
  near(ccbOf(y.federal, 36_502, 1, 0), 6570, "age 6–17 maximum");
  // At $80,000 AFNI, use the guide's published fixed reductions and the second-tier reduction of $913.
  // These detect mistakenly using 2025 values, or deriving rounded fixed reductions from the thresholds.
  const expected = [7787 - 2981 - 913 * 0.032, 15574 - 5749 - 913 * 0.057, 23361 - 8091 - 913 * 0.08];
  expected.push(31148 - 9795 - 913 * 0.095);
  for (let kids = 1; kids <= 4; kids++)
    near(ccbOf(y.federal, 80_000, kids, kids), expected[kids - 1], `${kids} children`);
});

const benefits = (code: string, net: number, work: number, couple = false, kids = 0, second = 0) =>
  Object.fromEntries(
    creditsOf(y.federal, prov(code), {
      famNet: net,
      famEmp: work + second,
      couple,
      kids,
      ppl: couple ? [blank(work), blank(second)] : [blank(work)],
      propTax: 0,
      rent: 0,
    }),
  );

test("2024–25 GST/HST credit matches CRA's calculation sheet and single-parent supplement", () => {
  near(benefits("ON", 25_000, 25_000)["GST/HST credit"], 519, "single maximum");
  near(benefits("ON", 25_000, 25_000, true)["GST/HST credit"], 680, "couple maximum");
  near(benefits("ON", 0, 0, false, 1)["GST/HST credit"], 859, "single parent with one child at zero income");
  near(benefits("ON", 44_324, 44_324, true, 2)["GST/HST credit"], 1038, "couple with two children at threshold");
  near(benefits("ON", 46_324, 46_324, true, 2)["GST/HST credit"], 938, "5% reduction on $2,000");
});

test("2024 Canada Workers Benefit standard and regional schedules give their published maxima", () => {
  // Schedule 6 line 21; QC supplies four separate family types. Working income chosen below phase-out bases.
  for (const [code, singleMax, familyMax] of [
    ["ON", 1590, 2739],
    ["AB", 1704, 2551],
    ["NU", 1578, 2371],
  ] as const) {
    near(benefits(code, 25_000, 25_000)["Canada Workers Benefit"], singleMax, `${code} single`);
    near(benefits(code, 25_000, 25_000, true)["Canada Workers Benefit"], familyMax, `${code} family`);
  }
  near(benefits("QC", 13_000, 13_000)["Canada Workers Benefit"], 3705.38, "QC single");
  near(benefits("QC", 13_000, 13_000, false, 1)["Canada Workers Benefit"], 1986.8, "QC single parent");
  near(benefits("QC", 20_000, 20_000, true)["Canada Workers Benefit"], 5778.52, "QC couple");
  near(benefits("QC", 20_000, 20_000, true, 1)["Canada Workers Benefit"], 3702.59, "QC couple with child");
});

test("2024 CWB reduction thresholds, regional rates and secondary-earner exemption match Schedule 6", () => {
  near(benefits("ON", 27_149, 27_149)["Canada Workers Benefit"], 1440, "standard: $1,590 less 15% of $1,000");
  near(benefits("AB", 26_472, 26_472)["Canada Workers Benefit"], 1554, "AB: $1,704 less 15% of $1,000");
  near(benefits("NU", 27_127, 27_127)["Canada Workers Benefit"], 1538, "NU single: $1,578 less 4% of $1,000");
  near(benefits("NU", 36_957, 36_957, true)["Canada Workers Benefit"], 2291, "NU family: $2,371 less 8% of $1,000");
  near(benefits("QC", 14_829.82, 14_829.82)["Canada Workers Benefit"], 3505.38, "QC: maximum less 20% of $1,000");
  // Line 14 exempts up to $15,955 of the secondary earner's income: AFNI 46,788 - 15,955 = 30,833.
  near(benefits("ON", 46_788, 30_788, true, 0, 16_000)["Canada Workers Benefit"], 2589, "secondary-earner exemption");
});
