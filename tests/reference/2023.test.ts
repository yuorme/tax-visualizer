// Published 2023 reference values. Official sources are cached in docs/verification/2023/sources/federal-*;
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

// TaxTips.ca 2023 columns: https://www.taxtips.ca/priortaxrates/tax-rates-2023-2024/<code>.htm
// Cached as reference-rates-<code>.txt. Quebec includes the federal abatement and Ontario includes surtax.
// NT/NU published ordinary rates are 47.05%/44.5%; add the territories' 2% employee payroll tax for this model.
// Dividends and gains are rates per dollar received; the capital-gains inclusion was 50% in 2023.
// Columns: employment income, capital gains, eligible dividends, non-eligible dividends.
const TOP: Record<string, [number, number, number, number]> = {
  BC: [53.5, 26.75, 36.54, 48.89],
  YT: [48, 24, 28.93, 44.04],
  AB: [48, 24, 34.31, 42.31],
  NT: [49.05, 23.53, 28.33, 36.82],
  SK: [47.5, 23.75, 29.64, 41.82],
  MB: [50.4, 25.2, 37.78, 46.67],
  NU: [46.5, 22.25, 33.08, 37.79],
  ON: [53.53, 26.76, 39.34, 47.74],
  QC: [53.31, 26.65, 40.11, 48.7],
  NB: [52.5, 26.25, 32.4, 46.83],
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

test("2023 payroll maximums match T4127 tables 8.3–8.7 with no second additional contribution", () => {
  const cpp = payrollOf(y.federal, prov("ON"), blank(100_000));
  near(cpp.base, 3123.45, "CPP base");
  near(cpp.enh, 631, "CPP first additional only");
  near(cpp.ei, 1002.45, "EI maximum");
  const qpp = payrollOf(y.federal, prov("QC"), blank(100_000));
  near(qpp.base, 3407.4, "QPP base");
  near(qpp.enh, 631, "QPP first additional only");
  near(qpp.ei, 781.05, "Quebec EI maximum");
  near(qpp.qpip, 449.54, "QPIP maximum");
  near(payrollOf(y.federal, prov("ON"), blank(66_600)).enh, 631, "no enhancement beyond YMPE");
});

test("2023 CCB maximums and reductions match T4114 July 2023–June 2024", () => {
  near(ccbOf(y.federal, 34_863, 1, 1), 7437, "under-6 maximum");
  near(ccbOf(y.federal, 34_863, 1, 0), 6275, "age 6–17 maximum");
  // Published fixed reductions; $80,000 AFNI exceeds the second threshold by $4,463.
  const expected = [
    7437 - 2847 - 4463 * 0.032,
    14874 - 5491 - 4463 * 0.057,
    22311 - 7728 - 4463 * 0.08,
    29748 - 9355 - 4463 * 0.095,
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

test("2023–24 recurring GST/HST credit matches CRA calculation sheet", () => {
  near(benefits("ON", 20_000, 20_000)["GST/HST credit"], 496, "single maximum");
  near(benefits("ON", 20_000, 20_000, true)["GST/HST credit"], 650, "couple maximum");
  near(benefits("ON", 0, 0, false, 1)["GST/HST credit"], 821, "single parent at zero income");
  near(benefits("ON", 42_335, 42_335, true, 2)["GST/HST credit"], 992, "two children at threshold");
  near(benefits("ON", 44_335, 44_335, true, 2)["GST/HST credit"], 892, "5% reduction on $2,000");
});

test("2023 Canada Workers Benefit maxima and secondary-earner exemption match Schedule 6", () => {
  for (const [code, singleMax, familyMax] of [
    ["ON", 1518, 2616],
    ["AB", 1627, 2436],
    ["NU", 1508, 2264],
  ] as const) {
    near(benefits(code, 24_000, 24_000)["Canada Workers Benefit"], singleMax, `${code} single`);
    near(benefits(code, 24_000, 24_000, true)["Canada Workers Benefit"], familyMax, `${code} family`);
  }
  near(benefits("QC", 13_000, 13_000)["Canada Workers Benefit"], 3521.87, "QC single");
  near(benefits("QC", 13_000, 13_000, false, 1)["Canada Workers Benefit"], 1888.4, "QC parent");
  near(benefits("QC", 20_000, 20_000, true)["Canada Workers Benefit"], 5497.27, "QC couple");
  near(benefits("QC", 20_000, 20_000, true, 1)["Canada Workers Benefit"], 3522.38, "QC couple with child");
  near(benefits("ON", 25_975, 25_975)["Canada Workers Benefit"], 1368, "standard reduction");
  near(benefits("AB", 25_328, 25_328)["Canada Workers Benefit"], 1477, "AB reduction");
  near(benefits("NU", 25_954, 25_954)["Canada Workers Benefit"], 1468, "NU single reduction");
  near(benefits("NU", 35_343, 35_343, true)["Canada Workers Benefit"], 2184, "NU family reduction");
  near(benefits("QC", 14_294.87, 14_294.87)["Canada Workers Benefit"], 3321.87, "QC reduction");
  // $44,733 AFNI less $15,239 exemption = $29,494, or $1,000 above the family threshold.
  near(benefits("ON", 44_733, 29_333, true, 0, 15_400)["Canada Workers Benefit"], 2466, "secondary-earner exemption");
});

test("2023 Alberta reductions and NL half-year periods match published statutory figures", () => {
  const ab = (net: number, work: number, kids: number) =>
    provincialChildBenefit(prov("AB").childBenefit, net, work, kids, false);
  const base = [1329.5, 1994.3, 2659.1, 3323.9],
    working = [688, 1314.1, 1688.6, 1812.5];
  for (let kids = 1; kids <= 4; kids++) {
    near(ab(26_935, 0, kids), base[kids - 1], `base reduction ${kids}`);
    near(ab(44_460, 50_000, kids), working[kids - 1], `working reduction ${kids}`);
  }
  near(ab(64_600, 70_000, 1), 10, "minimum positive annual entitlement");
  near(ab(64_700, 70_000, 1), 0, "exhausted entitlement");
  // NL's official poverty plan publishes $447 before January 2024 and $1,788 from January.
  const nl = (net: number) => provincialChildBenefit(prov("NL").childBenefit, net, 0, 1, false);
  near(nl(0), 1117.5, "six months of each published annual maximum");
  near(nl(27_000), 120.9585, "first period exhausted; second period weighted after flooring");
});
