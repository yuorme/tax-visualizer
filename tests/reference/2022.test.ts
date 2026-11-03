// Published 2022 reference values. Official sources are cached in docs/verification/2022/sources/federal-*;
// the combined-rate tables use the same independent secondary publisher as the existing 2025 references.
import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { loadYear } from "../../src/data/load.ts";
import {
  blank,
  ccbOf,
  compute,
  creditsOf,
  type Household,
  payrollOf,
  provincialChildBenefit,
} from "../../src/engine/index.ts";

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

// TaxTips.ca 2022 columns: https://www.taxtips.ca/priortaxrates/tax-rates-2022-2023/<code>.htm
// Cached as reference-rates-<code>.txt. Quebec includes the federal abatement and Ontario includes surtax.
// NT/NU published ordinary rates are 47.05%/44.5%; add the territories' 2% employee payroll tax for this model.
// Dividends and gains are rates per dollar received; the capital-gains inclusion was 50% in 2022.
// Columns: employment income, capital gains, eligible dividends, non-eligible dividends.
const TOP: Record<string, [number, number, number, number]> = {
  BC: [53.5, 26.75, 36.54, 48.89],
  YT: [48, 24, 28.93, 44.04],
  AB: [48, 24, 34.31, 42.31],
  NT: [49.05, 23.53, 28.33, 36.82],
  SK: [47.5, 23.75, 29.64, 42.29],
  MB: [50.4, 25.2, 37.78, 46.67],
  NU: [46.5, 22.25, 33.08, 37.79],
  ON: [53.53, 26.76, 39.34, 47.74],
  QC: [53.31, 26.65, 40.11, 48.7],
  NB: [53.3, 26.65, 33.51, 47.75],
  PE: [51.37, 25.69, 34.22, 47.05],
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

test("2022 payroll caps match T4127 and ESDC's separately published base/additional table", () => {
  for (const [code, base, ei, qpip] of [
    ["ON", 3039.3, 952.74, 0],
    ["QC", 3315.6, 723.6, 434.72],
  ] as const) {
    const p = payrollOf(y.federal, prov(code), blank(100_000));
    near(p.base, base, `${code} base`);
    near(p.enh, 460.5, `${code} additional`);
    near(p.ei, ei, `${code} EI`);
    near(p.qpip, qpip, `${code} QPIP`);
    near(payrollOf(y.federal, prov(code), blank(64_900)).enh, 460.5, `${code} no second band`);
  }
});

test("2022 CCB maxima and second-tier fixed reductions match T4114", () => {
  near(ccbOf(y.federal, 32_797, 1, 1), 6997, "young child");
  near(ccbOf(y.federal, 32_797, 1, 0), 5903, "older child");
  const expected = [
    6997 - 2678 - 8940 * 0.032,
    13994 - 5166 - 8940 * 0.057,
    20991 - 7270 - 8940 * 0.08,
    27988 - 8801 - 8940 * 0.095,
  ];
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

test("2022–23 recurring GST/HST matches the official calculation sheet", () => {
  near(benefits("ON", 20_000, 20_000)["GST/HST credit"], 467, "single maximum");
  near(benefits("ON", 20_000, 20_000, true)["GST/HST credit"], 612, "couple maximum");
  near(benefits("ON", 0, 0, false, 1)["GST/HST credit"], 773, "single parent supplement");
  near(benefits("ON", 39_826, 39_826, true, 2)["GST/HST credit"], 934, "at threshold");
  near(benefits("ON", 41_826, 41_826, true, 2)["GST/HST credit"], 834, "5% of $2000");
});

test("2022 CWB maxima, regional reductions and secondary-earner exemption match Schedule 6", () => {
  for (const [code, one, family] of [
    ["ON", 1428, 2461],
    ["AB", 1531, 2292],
    ["NU", 1418, 2130],
  ] as const) {
    near(benefits(code, 22_000, 22_000)["Canada Workers Benefit"], one, `${code} single`);
    near(benefits(code, 22_000, 22_000, true)["Canada Workers Benefit"], family, `${code} family`);
  }
  near(benefits("QC", 12_000, 12_000)["Canada Workers Benefit"], 3296.57, "QC single");
  near(benefits("QC", 12_000, 12_000, false, 1)["Canada Workers Benefit"], 1767.6, "QC parent");
  near(benefits("QC", 19_000, 19_000, true)["Canada Workers Benefit"], 5146.65, "QC couple");
  near(benefits("QC", 19_000, 19_000, true, 1)["Canada Workers Benefit"], 3297.72, "QC couple with child");
  near(benefits("ON", 24_495, 24_495)["Canada Workers Benefit"], 1278, "standard reduction");
  near(benefits("AB", 23_886, 23_886)["Canada Workers Benefit"], 1381, "AB reduction");
  near(benefits("NU", 24_475, 24_475)["Canada Workers Benefit"], 1378, "NU single reduction");
  near(benefits("NU", 33_307, 33_307, true)["Canada Workers Benefit"], 2050, "NU family reduction");
  near(benefits("QC", 13_589.79, 13_589.79)["Canada Workers Benefit"], 3096.57, "QC reduction");
  // AFNI42141 - published14336 secondary exemption =27805, $1000 over family threshold.
  near(benefits("ON", 42_141, 27_641, true, 0, 14_500)["Canada Workers Benefit"], 2311, "secondary exemption");
});

test("2022 Alberta statutory reductions and minimum match official amounts", () => {
  const ab = (net: number, work: number, kids: number) =>
    provincialChildBenefit(prov("AB").childBenefit, net, work, kids, false);
  const base = [1249.5, 1874.3, 2499.1, 3123.9],
    working = [647, 1236.1, 1588.6, 1705.5];
  for (let kids = 1; kids <= 4; kids++) {
    near(ab(25_467, 0, kids), base[kids - 1], `base ${kids}`);
    near(ab(42_000, 50_000, kids), working[kids - 1], `working ${kids}`);
  }
  near(ab(61_000, 70_000, 1), 10, "positive minimum");
  near(ab(61_100, 70_000, 1), 0, "exhausted working amount");
});

test("2022 BC period minima and NWT age groups match published formulas", () => {
  const bc = (net: number, kids: number) => provincialChildBenefit(prov("BC").childBenefit, net, 0, kids, false);
  near(bc(0, 1), 1775, "nine ordinary and three enhanced months");
  near(bc(50_000, 1), 858.06, "different annual minimum floors");
  near(bc(100_078, 1), 150, "only enhanced period remains");
  near(bc(0, 4), 4900, "additional children");
  const nt = (net: number, kids: number, u6: number) =>
    provincialChildBenefit(prov("NT").childBenefit, net, 0, kids, false, u6);
  near(nt(30_000, 3, 2), 2119, "separate age groups");
  near(nt(55_000, 3, 2), 1059.5, "published midpoint taper");
});
