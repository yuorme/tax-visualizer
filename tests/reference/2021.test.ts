// Published 2021 reference values. Official sources are cached in docs/verification/2021/sources/federal-*;
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

// TaxTips.ca 2021 columns: https://www.taxtips.ca/priortaxrates/tax-rates-2021-2021/<code>.htm
// Cached as reference-rates-<code>.txt. Quebec includes the federal abatement and Ontario includes surtax.
// NT/NU published ordinary rates are 47.05%/44.5%; add the territories' 2% employee payroll tax for this model.
// Dividends and gains are rates per dollar received; the capital-gains inclusion was 50% in 2021.
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
  QC: [53.31, 26.65, 40.11, 48.02],
  NB: [53.3, 26.65, 33.51, 47.75],
  PE: [51.37, 25.69, 34.22, 46.21],
  NS: [54, 27, 41.58, 48.28],
  NL: [51.3, 25.65, 42.61, 44.59],
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

test("2021 payroll caps match T4127 and ESDC's separately published base/additional table", () => {
  for (const [code, base, ei, qpip] of [
    ["ON", 2875.95, 889.54, 0],
    ["QC", 3137.4, 664.34, 412.49],
  ] as const) {
    const p = payrollOf(y.federal, prov(code), blank(100_000));
    near(p.base, base, `${code} base`);
    near(p.enh, 290.5, `${code} additional`);
    near(p.ei, ei, `${code} EI`);
    near(p.qpip, qpip, `${code} QPIP`);
    near(payrollOf(y.federal, prov(code), blank(61_600)).enh, 290.5, `${code} no second band`);
  }
});

test("2021 CCB maxima and second-tier fixed reductions match T4114", () => {
  near(ccbOf(y.federal, 32_028, 1, 1), 6833, "young child");
  near(ccbOf(y.federal, 32_028, 1, 0), 5765, "older child");
  const expected = [
    6833 - 2616 - 10605 * 0.032,
    13666 - 5044 - 10605 * 0.057,
    20499 - 7100 - 10605 * 0.08,
    27332 - 8594 - 10605 * 0.095,
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

test("2021–22 recurring GST/HST matches the official calculation sheet", () => {
  near(benefits("ON", 20_000, 20_000)["GST/HST credit"], 456, "single maximum");
  near(benefits("ON", 20_000, 20_000, true)["GST/HST credit"], 598, "couple maximum");
  near(benefits("ON", 0, 0, false, 1)["GST/HST credit"], 755, "single parent supplement");
  near(benefits("ON", 38_892, 38_892, true, 2)["GST/HST credit"], 912, "at threshold");
  near(benefits("ON", 40_892, 40_892, true, 2)["GST/HST credit"], 812, "5% of $2000");
});

test("2021 CWB maxima, regional reductions and secondary-earner exemption match Schedule 6", () => {
  for (const [code, one, family] of [
    ["ON", 1395, 2403],
    ["AB", 1495, 2238],
    ["NU", 1385, 2080],
  ] as const) {
    near(benefits(code, 22_000, 22_000)["Canada Workers Benefit"], one, `${code} single`);
    near(benefits(code, 22_000, 22_000, true)["Canada Workers Benefit"], family, `${code} family`);
  }
  near(benefits("QC", 12_000, 12_000)["Canada Workers Benefit"], 3201.09, "QC single");
  near(benefits("QC", 12_000, 12_000, false, 1)["Canada Workers Benefit"], 1716.4, "QC parent");
  near(benefits("QC", 19_000, 19_000, true)["Canada Workers Benefit"], 5000.44, "QC couple");
  near(benefits("QC", 19_000, 19_000, true, 1)["Canada Workers Benefit"], 3204.03, "QC couple with child");
  near(benefits("ON", 23_944, 23_944)["Canada Workers Benefit"], 1245, "standard reduction");
  near(benefits("AB", 23_350, 23_350)["Canada Workers Benefit"], 1345, "AB reduction");
  near(benefits("NU", 23_925, 23_925)["Canada Workers Benefit"], 1345, "NU single reduction");
  near(benefits("NU", 32_550, 32_550, true)["Canada Workers Benefit"], 2000, "NU family reduction");
  near(benefits("QC", 13_385.8, 13_385.8)["Canada Workers Benefit"], 3001.09, "QC reduction");
  // AFNI41177 - published14000 secondary exemption =27177, $1000 over family threshold.
  near(benefits("ON", 41_177, 26_677, true, 0, 14_500)["Canada Workers Benefit"], 2253, "secondary exemption");
});

test("2021 Alberta statutory reductions and minimum match official amounts", () => {
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

test("2021 historical NS, MB and NWT benefits match published formulas", () => {
  const ns = (net: number, kids: number) => provincialChildBenefit(prov("NS").childBenefit, net, 0, kids, false);
  near(ns(25_999, 3), 2650, "full ordered NS amounts");
  near(ns(26_000, 3), 1787.5, "only later children halved");
  near(ns(34_000, 3), 0, "NS upper boundary");
  const mb = creditsOf(y.federal, prov("MB"), {
    famNet: 0,
    famEmp: 0,
    couple: false,
    kids: 0,
    ppl: [blank(0)],
    propTax: 0,
    rent: 1000,
  });
  near(mb.find(([name]) => name === "Renters tax credit")?.[1] ?? NaN, 150, "20% times75% rental share");
  const nt = (net: number, kids: number, u6: number) =>
    provincialChildBenefit(prov("NT").childBenefit, net, 0, kids, false, u6);
  near(nt(30_000, 3, 2), 2119, "separate age groups");
  near(nt(55_000, 3, 2), 1059.5, "published midpoint taper");
});
