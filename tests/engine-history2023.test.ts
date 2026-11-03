import assert from "node:assert/strict";
import test from "node:test";
import { loadYear } from "../src/data/load.ts";
import { provinceSchema } from "../src/data/schema.ts";
import { blank, type Household, household, provincialChildBenefit } from "../src/engine/index.ts";

const y = loadYear(2025);
const pe = provinceSchema.parse({
  ...y.provinces.find(p => p.code === "PE"),
  // Synthetic bracket and dividend rates expose ordering independently of indexed yearly amounts.
  brackets: [[Infinity, 0.2]],
  dividendTaxCredit: { eligible: 0.1, nonEligible: 0.05 },
  lowIncomeReduction: undefined,
  postDividendSurtax: { program: "pei-surtax", params: { threshold: 12500, rate: 0.1 } },
});
const hh: Household = {
  people: [blank(0)],
  active: 0,
  adults: 1,
  spouse: false,
  kids: 0,
  under6: 0,
  useBpa: false,
  useCredits: false,
  whRate: 0,
  homeValue: 0,
  rent: 0,
  monthlySpending: 0,
};
const close = (actual: number, expected: number) =>
  assert.ok(Math.abs(actual - expected) < 1e-8, `${actual} != ${expected}`);

// NWT Income Tax Regulations s1.1(1)(b),(c): count each age group separately, then taper their sum.
const nt = provinceSchema.parse({
  ...y.provinces.find(p => p.code === "NT"),
  childBenefit: {
    program: "nwt-child-benefit-age-groups",
    params: {
      under6: [0, 815, 1467, 1997, 2445],
      under6More: 367,
      over6: [0, 652, 1174, 1597, 1956],
      over6More: 293,
      fullUpTo: 30000,
      endsAt: 80000,
    },
  },
});
const nwtBenefit = (income: number, kids: number, young: number) =>
  provincialChildBenefit(nt.childBenefit, income, 0, kids, false, young);

test("historical NWT child benefit counts each age group independently", () => {
  close(nwtBenefit(55000, 3, 2), 1059.5); // (1467 + 652) / 2, not a blend of three-child maxima
  close(nwtBenefit(30000, 3, 1), 1989); // 815 + 1174
  close(nwtBenefit(0, 6, 5), 3464); // fifth-young-child increment plus first older child
  close(nwtBenefit(0, 6, 1), 3064); // first young child plus fifth-older-child increment
  close(nwtBenefit(0, 10, 5), 5061); // both age groups independently pass four children
});

test("historical NWT child benefit applies the statutory linear taper and zero floor", () => {
  close(nwtBenefit(45000, 3, 3), 1397.9);
  close(nwtBenefit(30000, 3, 0), 1597);
  close(nwtBenefit(55000, 3, 0), 798.5);
  close(nwtBenefit(80000, 3, 2), 0);
  close(nwtBenefit(90000, 3, 2), 0);
  close(nwtBenefit(0, 0, 0), 0);
});

// PE428 (2023), lines 60–67: subtract the dividend credit before testing the $12,500 surtax threshold.
test("historical PEI surtax follows both dividend credits and keeps the nonrefundable floor", () => {
  const eligible = household(y, pe, { ...hh, people: [{ ...blank(0), ed: 100000 }] }).list[0];
  close(eligible.pDtc, 13800);
  close(eligible.surtax, 130);
  close(eligible.prov, 13930);
  const ordinary = household(y, pe, { ...hh, people: [{ ...blank(0), nd: 100000 }] }).list[0];
  close(ordinary.pDtc, 5750);
  close(ordinary.surtax, 475);
  close(ordinary.prov, 17725);
  const exhausted = { ...pe, dividendTaxCredit: { eligible: 0.3, nonEligible: 0.3 } };
  const zero = household(y, exhausted, { ...hh, people: [{ ...blank(0), ed: 100000 }] }).list[0];
  close(zero.prov, 0);
  close(zero.surtax, 0);
});

test("historical PEI surtax starts above its threshold and precedes the low-income reduction", () => {
  const at = household(y, pe, { ...hh, people: [{ ...blank(0), fd: 62500 }] }).list[0];
  const above = household(y, pe, { ...hh, people: [{ ...blank(0), fd: 62505 }] }).list[0];
  close(at.surtax, 0);
  close(above.surtax, 0.1);
  close(above.prov - at.prov, 1.1);
  const reduction = provinceSchema.parse({
    ...pe,
    lowIncomeReduction: {
      program: "family-low-income-reduction",
      params: { individual: 500, spouse: 0, child: 0, rate: 0, threshold: 1000000 },
    },
  });
  const result = household(y, reduction, { ...hh, people: [{ ...blank(0), fd: 100000 }] });
  close(result.list[0].lowRed, 500);
  close(result.list[0].surtax, 750);
  close(result.breakdown.surtax, 750);
  close(result.prov, 20250);
});

// NLR 60/11 and NLR 9/24: January 2024 changes both amounts and reduction rates within the benefit year.
const nl = provinceSchema.parse({
  ...y.provinces.find(p => p.code === "NL"),
  childBenefit: {
    program: "nl-child-benefit-periods",
    params: {
      periods: [
        {
          weight: 0.5,
          perChild: [447, 474, 509, 547],
          threshold: 17397,
          rate: [0.0507, 0.1045, 0.1622],
          additionalRate: 0.0619,
        },
        {
          weight: 0.5,
          perChild: [1788, 1896, 2036, 2188],
          threshold: 17397,
          rate: [0.161, 0.3318, 0.5151],
          additionalRate: 0.1971,
        },
      ],
    },
  },
});
const benefit = (income: number, kids: number) => provincialChildBenefit(nl.childBenefit, income, 0, kids, false);

test("historical NL benefit periods weight independent entitlements, including extra children", () => {
  close(benefit(0, 1), 1117.5);
  close(benefit(17397, 1), 1117.5);
  close(benefit(20000, 1), 841.97245);
  close(benefit(0, 6), 7677.5);
  close(benefit(18397, 6), 6950.35);
  close(benefit(0, 0), 0);
});

test("historical NL periods floor separately when only the later benefit remains", () => {
  close(benefit(27000, 1), 120.9585); // old period is zero; later period is $241.917 annually
  close(benefit(30000, 1), 0);
  close(benefit(100000, 6), 0);
});

test("NL benefit period weights must describe one complete year", () => {
  assert.equal(nl.childBenefit?.program, "nl-child-benefit-periods");
  if (nl.childBenefit?.program !== "nl-child-benefit-periods") return;
  for (const weights of [
    [0.4, 0.5],
    [1, 1],
    [0, 1],
  ]) {
    assert.equal(
      provinceSchema.safeParse({
        ...nl,
        childBenefit: {
          ...nl.childBenefit,
          params: { periods: nl.childBenefit.params.periods.map((p, i) => ({ ...p, weight: weights[i] })) },
        },
      }).success,
      false,
    );
  }
});
