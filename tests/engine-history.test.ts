import assert from "node:assert/strict";
import test from "node:test";
import { loadYear } from "../src/data/load.ts";
import { type ChildBenefitProgram, type Province, provinceSchema } from "../src/data/schema.ts";
import {
  blank,
  creditsOf,
  type Household,
  household,
  provincialBpa,
  provincialChildBenefit,
} from "../src/engine/index.ts";

const y = loadYear(2025);
const province = (code: string) => {
  const p = y.provinces.find(p => p.code === code);
  if (!p) throw new Error(`Missing ${code}`);
  return p;
};

// CRA Worksheet NS428 (2024), pages 1–2; cached in docs/verification/2024/sources/rule-ns-worksheet-2024.txt.
const ns: Province = provinceSchema.parse({
  ...province("NS"),
  basicPersonalAmount: { max: 11481, min: 8481, from: 25000, to: 75000 },
  spouseAmount: {
    program: "nova-scotia-spouse-amount",
    params: { max: 8481, threshold: 848, supplement: { max: 3000, rate: 0.06, threshold: 25000 } },
  },
});

// Foreign dividends avoid payroll deductions, leaving precisely the net/taxable incomes in the worksheet cases.
function family(claimant: number, dependant?: number): Household {
  return {
    people: [claimant, ...(dependant === undefined ? [] : [dependant])].map(fd => ({ ...blank(0), fd })),
    active: 0,
    adults: dependant === undefined ? 1 : 2,
    spouse: dependant !== undefined,
    kids: dependant === undefined ? 1 : 0,
    under6: 0,
    useBpa: true,
    useCredits: true,
    whRate: 0,
    homeValue: 0,
    rent: 0,
    monthlySpending: 0,
  };
}

test("historical Nova Scotia: BPA and zero-income spouse/dependant supplements taper with claimant income", () => {
  for (const [income, expected] of [
    [25000, 11481],
    [50000, 9981],
    [75000, 8481],
    [100000, 8481],
  ]) {
    assert.equal(provincialBpa(y.federal, ns, income), expected);
    assert.equal(household(y, ns, family(income, 0)).claim?.pAmt, expected);
    assert.equal(household(y, ns, family(income)).claim?.pAmt, expected);
  }
});

test("historical Nova Scotia: spouse income reduces the supplement separately without the $848 disregard", () => {
  assert.equal(household(y, ns, family(25000, 500)).claim?.pAmt, 10981); // 8481 + (3000 − 500)
  assert.equal(household(y, ns, family(25000, 1000)).claim?.pAmt, 10329); // 8329 + 2000
  assert.equal(household(y, ns, family(50000, 2000)).claim?.pAmt, 7329); // base 7329; supplement exhausted
  assert.equal(household(y, ns, family(75000, 1000)).claim?.pAmt, 8329);
  assert.equal(household(y, ns, family(25000, 10000)).claim?.pAmt, 0);
});

test("historical Nova Scotia: deductions affect the claimant taper, nonrefundable credits keep their floor", () => {
  const hh = family(80000, 0);
  hh.people[0].ded = 30000;
  assert.equal(household(y, ns, hh).claim?.pAmt, 9981);
  const low = household(y, ns, family(1000, 0));
  assert.equal(low.prov, 0);
  assert.equal(low.list[0].pSp, 0); // the BPA already exhausted tax
  assert.equal(household(y, ns, { ...hh, useBpa: false }).claim, null);
});

// CRA MB479 (2024), pages 2–3, and Manitoba Budget 2024 tax bulletin. The 50% school share is synthetic,
// deliberately distinct from total property taxes so an implementation using the municipal portion fails.
const mb: Province = provinceSchema.parse({
  ...province("MB"),
  credits: [
    {
      program: "mb-school-tax-credits",
      name: "School relief",
      nameRenter: "Renters tax credit",
      params: { schoolTaxShare: 0.5, schoolRebateRate: 0.5, educationCreditMax: 350, renterMax: 525 },
    },
  ],
});

function manitoba(propTax: number, rent = 0) {
  return new Map(
    creditsOf(y.federal, mb, {
      famNet: 50000,
      famEmp: 50000,
      couple: false,
      kids: 0,
      ppl: [blank(50000)],
      propTax,
      rent,
    }),
  );
}

test("historical Manitoba: rebate and EPTC use gross school taxes and cannot rebate municipal taxes", () => {
  assert.equal(manitoba(1000).get("School relief"), 500); // 250 rebate + 250 EPTC, capped at remaining school tax
  assert.equal(manitoba(1400).get("School relief"), 700); // EPTC reaches 350
  assert.equal(manitoba(4000).get("School relief"), 1350); // 1000 rebate + 350 EPTC
  assert.equal(manitoba(0).has("School relief"), false);
});

test("historical Manitoba: renters get at most actual rent, and owners cannot also claim renters relief", () => {
  assert.equal(manitoba(0, 120).get("Renters tax credit"), 120);
  assert.equal(manitoba(0, 12000).get("Renters tax credit"), 525);
  assert.equal(manitoba(4000, 12000).has("Renters tax credit"), false);
  const hh = { ...family(50000), homeValue: 4000 / mb.propertyTax.rate };
  assert.equal(new Map(household(y, mb, hh).credits).get("School relief"), 1350);
  assert.deepEqual(household(y, mb, { ...hh, useCredits: false }).credits, []);
});

// Newfoundland and Labrador Regulation 9/24, sections 1 and 3: published January 2024 amounts, before July
// indexation. The child-count-specific reduction rates remain the same after dollar amounts are indexed.
const nl: ChildBenefitProgram = {
  program: "nl-child-benefit-reduction",
  params: {
    perChild: [1788, 1896, 2036, 2188],
    threshold: 17397,
    rate: [0.161, 0.3318, 0.5151],
    additionalRate: 0.1971,
  },
};
const nlBenefit = (income: number, kids: number) => provincialChildBenefit(nl, income, 0, kids, false);

test("historical NL child benefit: child-count reduction rates and extra-child increments follow the regulation", () => {
  for (const [kids, maximum, reduction] of [
    [1, 1788, 161],
    [2, 3684, 331.8],
    [3, 5720, 515.1],
    [4, 7908, 712.2],
    [6, 12284, 1106.4],
  ]) {
    assert.equal(nlBenefit(0, kids), maximum);
    assert.equal(nlBenefit(17397, kids), maximum);
    assert.ok(Math.abs(nlBenefit(18397, kids) - (maximum - reduction)) < 1e-9);
    assert.equal(nlBenefit(100000, kids), 0);
  }
  assert.equal(nlBenefit(0, 0), 0);
});
