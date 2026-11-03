// Published 2019 reference values. Official sources are cached in docs/verification/2019/sources/federal-*;
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

// TaxTips.ca 2019 columns: https://www.taxtips.ca/priortaxrates/tax-rates-2019-2020/<code>.htm
// Cached as reference-rates-<code>.txt. Quebec includes the federal abatement and Ontario includes surtax.
// NT/NU published ordinary rates are 47.05%/44.5%; add the territories' 2% employee payroll tax for this model.
// Dividends and gains are rates per dollar received; the capital-gains inclusion was 50% in 2019.
// BC noneligible44.63% comes from Deloitte; Quebec eligible40.00% comes from Richter's July2019 card.
// Older TaxTips entries44.64%/39.99% disagree with exact official credit arithmetic; tolerances are unchanged.
// Columns: employment income, capital gains, eligible dividends, non-eligible dividends.
const TOP: Record<string, [number, number, number, number]> = {
  BC: [49.8, 24.9, 31.44, 44.63],
  YT: [48, 24, 28.93, 42.17],
  AB: [48, 24, 31.71, 42.31],
  NT: [49.05, 23.53, 28.33, 36.82],
  SK: [47.5, 23.75, 29.64, 40.37],
  MB: [50.4, 25.2, 37.78, 46.67],
  NU: [46.5, 22.25, 33.08, 37.79],
  ON: [53.53, 26.76, 39.34, 47.4],
  QC: [53.31, 26.65, 40, 46.25],
  NB: [53.3, 26.65, 33.51, 47.75],
  PE: [51.37, 25.69, 34.22, 45.22],
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

test("2019 payroll caps match T4127 and ESDC's separately published base/additional table", () => {
  for (const [code, base, ei, qpip] of [
    ["ON", 2668.05, 860.22, 0],
    ["QC", 2910.6, 663.75, 402.39],
  ] as const) {
    const p = payrollOf(y.federal, prov(code), blank(100_000));
    near(p.base, base, `${code} base`);
    near(p.enh, 80.85, `${code} additional`);
    near(p.ei, ei, `${code} EI`);
    near(p.qpip, qpip, `${code} QPIP`);
    near(payrollOf(y.federal, prov(code), blank(57_400)).enh, 80.85, `${code} no second band`);
  }
});

test("2019 CCB maxima and second-tier fixed reductions match the CRA calculation sheet", () => {
  near(ccbOf(y.federal, 31_120, 1, 1), 6639, "young child");
  near(ccbOf(y.federal, 31_120, 1, 0), 5602, "older child");
  const expected = [
    6639 - 2541 - 12574 * 0.032,
    13278 - 4901 - 12574 * 0.057,
    19917 - 6898 - 12574 * 0.08,
    26556 - 8351 - 12574 * 0.095,
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

test("2019–20 recurring GST/HST matches Finance amounts and CRA thresholds", () => {
  near(benefits("ON", 20_000, 20_000)["GST/HST credit"], 443, "single maximum");
  near(benefits("ON", 20_000, 20_000, true)["GST/HST credit"], 580, "couple maximum");
  near(benefits("ON", 0, 0, false, 1)["GST/HST credit"], 733, "single parent supplement");
  near(benefits("ON", 37_789, 37_789, true, 2)["GST/HST credit"], 886, "at threshold");
  near(benefits("ON", 39_789, 39_789, true, 2)["GST/HST credit"], 786, "5% of $2000");
});

test("2019 CWB matches Schedule6 before the secondary-earner exemption and with NU family rates", () => {
  for (const [code, one, family] of [
    ["ON", 1355, 2335],
    ["AB", 1453, 2175],
    ["NU", 1065, 1600],
  ] as const) {
    near(benefits(code, 12000, 22000)["Canada Workers Benefit"], one, `${code} single maximum`);
    near(benefits(code, 12000, 22000, true)["Canada Workers Benefit"], family, `${code} family maximum`);
  }
  near(benefits("NU", 7000, 7000)["Canada Workers Benefit"], 100, "NU single10% phase-in");
  near(benefits("NU", 7000, 7000, false, 1)["Canada Workers Benefit"], 140, "NU parent14% phase-in");
  near(benefits("NU", 22250, 30000)["Canada Workers Benefit"], 1025, "NU single4% reduction");
  near(benefits("NU", 30000, 40000, true)["Canada Workers Benefit"], 1520, "NU family8% reduction");
  near(benefits("ON", 13820, 22000)["Canada Workers Benefit"], 1235, "standard12% reduction");
  near(benefits("AB", 14200, 22000)["Canada Workers Benefit"], 1333, "AB12% reduction");
  near(benefits("QC", 12000, 12000)["Canada Workers Benefit"], 2279.68, "QC single maximum");
  near(benefits("QC", 12000, 12000, false, 1)["Canada Workers Benefit"], 1248, "QC parent maximum");
  near(benefits("QC", 18000, 18000, true)["Canada Workers Benefit"], 3557.62, "QC couple maximum");
  near(benefits("QC", 18000, 18000, true, 1)["Canada Workers Benefit"], 1817.76, "QC family maximum");
  near(benefits("QC", 13060, 15000)["Canada Workers Benefit"], 2079.68, "QC20% reduction");
  near(benefits("ON", 20000, 10000, true, 0, 10000)["Canada Workers Benefit"], 1978, "no secondary-earner exemption");
});

test("2019 historical programs match their official parameter tables", () => {
  const child = (code: string, net: number, work: number, kids: number, u6 = 0) =>
    provincialChildBenefit(prov(code).childBenefit, net, work, kids, true, u6);
  near(child("BC", 100000, 0, 3, 2), 1320, "BC only under-six children");
  near(child("BC", 125000, 0, 3, 2), 660, "BC each young child's taper");
  near(child("AB", 0, 0, 4), 2886, "AB ACB maximum");
  near(child("AB", 26769, 50000, 4), 4999, "AB separate ACB plus AFETC");
  near(child("AB", 50000, 50000, 1), 533.08, "AB4% working reduction");
  near(child("NS", 18000, 0, 3), 2349.96, "NS ordered maxima");
  near(child("NS", 19000, 0, 3), 2056.26, "NS third-child statutory taper");
  near(child("QC", 0, 0, 3, 3), 6809, "QC ordinal maxima plus parent supplement");
  near(child("QC", 200000, 0, 3, 3), 2322, "QC ordinal floors plus parent floor");
});
