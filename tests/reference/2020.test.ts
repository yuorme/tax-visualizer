// Published 2020 reference values. Official sources are cached in docs/verification/2020/sources/federal-*;
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

// TaxTips.ca 2020 columns: https://www.taxtips.ca/priortaxrates/tax-rates-2020-2020/<code>.htm
// Cached as reference-rates-<code>.txt. Quebec includes the federal abatement and Ontario includes surtax.
// NT/NU published ordinary rates are 47.05%/44.5%; add the territories' 2% employee payroll tax for this model.
// Dividends and gains are rates per dollar received; the capital-gains inclusion was 50% in 2020.
// Quebec eligible dividends use Richter's July2020 rate card (reference-qc-richter.txt):40.11%;
// the older TaxTips edition prints40.10%, which is inconsistent with the sourced exact credit rates.
// Columns: employment income, capital gains, eligible dividends, non-eligible dividends.
const TOP: Record<string, [number, number, number, number]> = {
  BC: [53.5, 26.75, 36.54, 48.89],
  YT: [48, 24, 28.93, 42.17],
  AB: [48, 24, 31.71, 42.31],
  NT: [49.05, 23.53, 28.33, 36.82],
  SK: [47.5, 23.75, 29.64, 40.37],
  MB: [50.4, 25.2, 37.78, 46.67],
  NU: [46.5, 22.25, 33.08, 37.79],
  ON: [53.53, 26.76, 39.34, 47.74],
  QC: [53.31, 26.65, 40.11, 47.14],
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

test("2020 payroll caps match T4127 and ESDC's separately published base/additional table", () => {
  for (const [code, base, ei, qpip] of [
    ["ON", 2732.4, 856.36, 0],
    ["QC", 2980.8, 650.4, 387.79],
  ] as const) {
    const p = payrollOf(y.federal, prov(code), blank(100_000));
    near(p.base, base, `${code} base`);
    near(p.enh, 165.6, `${code} additional`);
    near(p.ei, ei, `${code} EI`);
    near(p.qpip, qpip, `${code} QPIP`);
    near(payrollOf(y.federal, prov(code), blank(58_700)).enh, 165.6, `${code} no second band`);
  }
});

test("2020 CCB maxima and second-tier fixed reductions match T4114", () => {
  near(ccbOf(y.federal, 31_711, 1, 1), 6765, "young child");
  near(ccbOf(y.federal, 31_711, 1, 0), 5708, "older child");
  const expected = [
    6765 - 2590 - 11292 * 0.032,
    13530 - 4995 - 11292 * 0.057,
    20295 - 7029 - 11292 * 0.08,
    27060 - 8509 - 11292 * 0.095,
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

test("2020–21 recurring GST/HST matches the official calculation sheet", () => {
  near(benefits("ON", 20_000, 20_000)["GST/HST credit"], 451, "single maximum");
  near(benefits("ON", 20_000, 20_000, true)["GST/HST credit"], 592, "couple maximum");
  near(benefits("ON", 0, 0, false, 1)["GST/HST credit"], 747, "single parent supplement");
  near(benefits("ON", 38_507, 38_507, true, 2)["GST/HST credit"], 902, "at threshold");
  near(benefits("ON", 40_507, 40_507, true, 2)["GST/HST credit"], 802, "5% of $2000");
});

test("2020 Alberta statutory reductions and minimum match official amounts", () => {
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

test("2020 CWB matches Schedule6 before the secondary-earner exemption and with NU family rates", () => {
  for (const [code, one, family] of [
    ["ON", 1381, 2379],
    ["AB", 1481, 2216],
    ["NU", 1085, 1630],
  ] as const) {
    near(benefits(code, 12000, 22000)["Canada Workers Benefit"], one, `${code} single maximum`);
    near(benefits(code, 12000, 22000, true)["Canada Workers Benefit"], family, `${code} family maximum`);
  }
  near(benefits("NU", 7000, 7000)["Canada Workers Benefit"], 100, "NU single10% phase-in");
  near(benefits("NU", 7000, 7000, false, 1)["Canada Workers Benefit"], 140, "NU parent14% phase-in");
  near(benefits("NU", 22654, 30000)["Canada Workers Benefit"], 1045, "NU single4% reduction");
  near(benefits("NU", 30551, 40000, true)["Canada Workers Benefit"], 1550, "NU family8% reduction");
  near(benefits("ON", 14064, 22000)["Canada Workers Benefit"], 1261, "standard12% reduction");
  near(benefits("AB", 14451, 22000)["Canada Workers Benefit"], 1361, "AB12% reduction");
  near(benefits("QC", 12000, 12000)["Canada Workers Benefit"], 2319.14, "QC single maximum");
  near(benefits("QC", 12000, 12000, false, 1)["Canada Workers Benefit"], 1269.6, "QC parent maximum");
  near(benefits("QC", 18000, 18000, true)["Canada Workers Benefit"], 3620.09, "QC couple maximum");
  near(benefits("QC", 18000, 18000, true, 1)["Canada Workers Benefit"], 1849.68, "QC family maximum");
  near(benefits("QC", 13308.41, 15000)["Canada Workers Benefit"], 2119.14, "QC20% reduction");
  near(
    benefits("ON", 20000, 10000, true, 0, 10000)["Canada Workers Benefit"],
    2060.76,
    "no secondary-earner exemption",
  );
});

test("2020 BC separate-age periods and MB rental percentage match official publications", () => {
  const bc = (net: number, kids: number, u6: number) =>
    provincialChildBenefit(prov("BC").childBenefit, net, 0, kids, false, u6);
  near(bc(0, 1, 0), 1200, "older child gets nine months");
  near(bc(0, 1, 1), 1365, "young child gets both programs");
  near(bc(0, 3, 2), 2880, "mixed ages");
  near(bc(125000, 1, 1), 82.5, "only young-child program remains");
  near(bc(150000, 5, 2), 420, "only opportunity benefit remains");
  const mb = creditsOf(y.federal, prov("MB"), {
    famNet: 0,
    famEmp: 0,
    couple: false,
    kids: 0,
    ppl: [blank(0)],
    propTax: 0,
    rent: 1000,
  });
  near(mb.find(([name]) => name === "Education property tax credit")?.[1] ?? NaN, 200, "20% of annual rent");
  const nb = compute(y, prov("NB"), single(0, { useBpa: false, people: [{ ...blank(0), fd: 10000 }] }));
  near(nb.list[0].pr.tax, 968, "NB2020 lowest9.68% bracket");
});
