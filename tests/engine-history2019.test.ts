import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { loadYear } from "../src/data/load.ts";
import { federalSchema, provinceSchema } from "../src/data/schema.ts";
import { blank, compute, type Household, householdPremiumOf, provincialChildBenefit } from "../src/engine/index.ts";

const y = loadYear(2025);
const province = (code: string, extra: object) =>
  provinceSchema.parse({ ...y.provinces.find(p => p.code === code), ...extra });
const ab = province("AB", {
  childBenefit: {
    program: "alberta-child-benefit-and-employment",
    params: {
      base: [1155, 1732, 2309, 2886],
      baseRate: [0.07, 0.105, 0.14, 0.175],
      baseThreshold: 26769,
      working: [801, 1530, 1967, 2113],
      workingRate: 0.11,
      workingFloor: 2760,
      workingThreshold: 43302,
      workingPhaseOut: 0.04,
      minAnnual: 10,
    },
  },
});
const ns = province("NS", {
  childBenefit: {
    program: "nova-scotia-child-benefit-reduction",
    params: {
      perChild: [624.96, 825, 900],
      fullBelow: 18001,
      threshold: 18000,
      rate: [0.0781, 0.1812],
      additionalRate: 0.1125,
    },
  },
});
const qc = province("QC", {
  childBenefit: {
    program: "quebec-family-allowance-by-child",
    params: {
      max: [2472, 1735, 1735, 1852],
      min: [694, 641],
      maxSingleParent: 867,
      minSingleParent: 346,
      rate: 0.04,
      thresholdSingle: 35680,
      thresholdCouple: 49044,
      schoolSupplies: 102,
    },
  },
});
const onsets = [
  50000, 55000, 60000, 65000, 70000, 75000, 80000, 100000, 125000, 175000, 250000, 300000, 350000, 400000, 450000,
  500000, 550000, 600000,
];
const nl = province("NL", {
  additionalTax: {
    program: "nl-deficit-reduction-levy",
    params: {
      bands: onsets.map((from, i) => [from, i * 100, 0.1, (i + 1) * 100]),
    },
  },
});
const bc = province("BC", {
  householdPremium: {
    program: "bc-msp-premiums",
    params: {
      spouseDeduction: 3000,
      childDeduction: 3000,
      childcareAddbackRate: 0.5,
      bands: [
        [26000, 0],
        [28000, 138],
        [30000, 210],
        [34000, 276],
        [38000, 336],
        [42000, 390],
        [Infinity, 450],
      ],
    },
  },
});
const fixtures: {
  benefits: {
    id: string;
    code: string;
    net: number;
    work: number;
    kids: number;
    single: boolean;
    young: number;
    expected: number;
  }[];
  levy: { income: number; expected: number }[];
  msp: { id: string; net: number; couple: boolean; kids: number; claim: number; expected: number }[];
  flatBpa: { income: number; expected: number }[];
} = JSON.parse(fs.readFileSync(new URL("./golden/history-rules-2019.json", import.meta.url), "utf8"));
const close = (actual: number, expected: number) =>
  assert.ok(Math.abs(actual - expected) < 1e-8, `${actual} != ${expected}`);
const hh: Household = {
  people: [blank(0)],
  active: 0,
  spouse: false,
  adults: 1,
  kids: 0,
  under6: 0,
  useBpa: false,
  useCredits: false,
  whRate: 0,
  homeValue: 0,
  rent: 0,
  monthlySpending: 0,
};
for (const c of fixtures.benefits)
  test(`2019 rule golden: ${c.id}`, () => {
    const p = { AB: ab, NS: ns, QC: qc }[c.code];
    assert.ok(p);
    close(provincialChildBenefit(p.childBenefit, c.net, c.work, c.kids, c.single, c.young), c.expected);
  });
for (const c of fixtures.levy)
  test(`2019 levy golden: taxable ${c.income}`, () => {
    const h = { ...hh, people: [{ ...blank(0), fd: c.income }] };
    const result = compute(y, nl, h),
      without = compute(y, { ...nl, additionalTax: undefined }, h);
    close(result.list[0].breakdown.provincialLevy, c.expected);
    close(result.prov - without.prov, c.expected);
    close(result.total - without.total, c.expected);
    close(result.payroll, without.payroll);
  });
for (const c of fixtures.msp)
  test(`2019 MSP golden: ${c.id}`, () => {
    const nets = c.couple ? [c.net / 2, c.net / 2] : [c.net];
    close(householdPremiumOf(bc, nets, c.couple, c.kids, [c.claim])?.total ?? -1, c.expected);
  });
for (const c of fixtures.flatBpa)
  test(`2019 flat BPA golden: income ${c.income}`, () => {
    // A single synthetic 15% bracket isolates the published $12,069 amount from unrelated bracket changes.
    const federal = federalSchema.parse({ ...y.federal, basicPersonalAmount: 12069, brackets: [[Infinity, 0.15]] });
    const result = compute({ ...y, federal }, ab, {
      ...hh,
      useBpa: true,
      people: [{ ...blank(0), fd: c.income }],
    });
    close(result.fed, c.expected);
  });

test("historical NL levy survives nonrefundable/foreign credits and follows taxable deductions", () => {
  const reduced = province("NL", { ...nl, basicPersonalAmount: 1000000 });
  const h = { ...hh, useBpa: true, whRate: 1, people: [{ ...blank(0), fd: 50500 }] };
  close(compute(y, reduced, h).prov, 50);
  const taxed = { ...hh, people: [{ ...blank(0), fd: 60000, ded: 9500 }] };
  close(compute(y, nl, taxed).list[0].breakdown.provincialLevy, 50);
  const div = { ...hh, people: [{ ...blank(0), ed: 50500 / 1.38 }] };
  close(compute(y, nl, div).list[0].breakdown.provincialLevy, 50);
});

test("historical MSP enters payroll and net tax, includes zero-income spouses, and keeps unrelated adults separate", () => {
  const h = { ...hh, spouse: true, adults: 2, people: [{ ...blank(0), fd: 29001 }] };
  const result = compute(y, bc, h),
    without = compute(y, { ...bc, householdPremium: undefined }, h);
  close(result.payroll - without.payroll, 276);
  close(result.total - without.total, 276);
  close(result.prov, without.prov);
  close(result.incomeTax, without.incomeTax);
  close(householdPremiumOf(bc, [26000, 42001], false, 0, [0, 0])?.total ?? -1, 450);
  assert.equal(householdPremiumOf({ ...bc, householdPremium: undefined }, [50000], false, 0, [0]), null);
  const below = compute(y, bc, { ...hh, people: [{ ...blank(0), fd: 26000 }] });
  const belowBase = compute(y, { ...bc, householdPremium: undefined }, { ...hh, people: [{ ...blank(0), fd: 26000 }] });
  close(below.margBy.fd - belowBase.margBy.fd, 1.38);
});

test("historical levy and premium bands reject unordered or incomplete schedules", () => {
  assert.ok(nl.additionalTax && bc.householdPremium);
  assert.equal(
    provinceSchema.safeParse({
      ...nl,
      additionalTax: {
        ...nl.additionalTax,
        params: {
          bands: [
            [55000, 100, 0.1, 200],
            [50000, 0, 0.1, 100],
          ],
        },
      },
    }).success,
    false,
  );
  assert.equal(
    provinceSchema.safeParse({
      ...bc,
      householdPremium: { ...bc.householdPremium, params: { ...bc.householdPremium.params, bands: [[26000, 0]] } },
    }).success,
    false,
  );
});
