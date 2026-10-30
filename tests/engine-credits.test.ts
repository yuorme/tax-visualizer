// Unit tests for refundable credit programs that no year's data uses yet, and for the federal credit's label.
// Parameters are test fixtures written here (the PEI ones copy RC4210's figures), not read from a year's data.
import assert from "node:assert/strict";
import test from "node:test";
import { loadYear } from "../src/data/load.ts";
import type { CreditProgram, Federal, Province } from "../src/data/schema.ts";
import { blank, creditsOf } from "../src/engine/index.ts";

const y = loadYear(2026);
const pe = y.provinces.find(p => p.code === "PE");
if (!pe) throw new Error("no PE");

// PEI sales tax credit (RC4210, July 2025 to June 2026): $110, plus $55 for a spouse or eligible dependant, plus
// 0.5% of family net income over $30,000 up to $55, all reduced by 2% of family net income over $50,000.
const peiSalesTaxCredit: CreditProgram = {
  program: "pei-sales-tax-credit",
  name: "PEI sales tax credit",
  params: {
    individual: 110,
    spouseOrDependant: 55,
    supplementRate: 0.005,
    supplementFrom: 30000,
    supplementMax: 55,
    rate: 0.02,
    threshold: 50000,
  },
};
const province: Province = { ...pe, credits: [peiSalesTaxCredit] };

/** The PEI credit for a household; 0 when the engine drops it (under 50 cents). */
function pei(famNet: number, couple: boolean, kids: number): number {
  const ppl = couple ? [blank(famNet), blank(0)] : [blank(famNet)];
  const credits = creditsOf(y.federal, province, { famNet, famEmp: famNet, couple, kids, ppl, propTax: 0, rent: 0 });
  return credits.find(([name]) => name === "PEI sales tax credit")?.[1] ?? 0;
}

test("pei-sales-tax-credit: single person gets the base amount, then the supplement as income rises", () => {
  assert.equal(pei(20_000, false, 0), 110);
  assert.equal(pei(30_000, false, 0), 110);
  assert.equal(pei(35_000, false, 0), 135); // 110 + 0.5% × 5,000
  assert.equal(pei(41_000, false, 0), 165); // supplement reaches its $55 maximum
  assert.equal(pei(50_000, false, 0), 165);
});

test("pei-sales-tax-credit: couples and single parents add the spouse or eligible dependant amount", () => {
  assert.equal(pei(20_000, true, 0), 165);
  assert.equal(pei(20_000, false, 2), 165); // single parent: eligible dependant amount, nothing per child
  assert.equal(pei(45_000, true, 2), 220);
});

test("pei-sales-tax-credit: reduced by 2% above the threshold, never below zero", () => {
  assert.equal(pei(55_000, true, 0), 120); // 220 − 2% × 5,000
  assert.equal(pei(55_000, false, 0), 65); // 165 − 100
  assert.equal(pei(70_000, true, 0), 0);
  assert.equal(pei(100_000, false, 0), 0);
});

test("the federal sales tax credit takes its name from the year's data, with the current name as fallback", () => {
  const input = { famNet: 20_000, famEmp: 20_000, couple: false, kids: 0, ppl: [blank(20_000)], propTax: 0, rent: 0 };
  const names = (fed: Federal) => creditsOf(fed, province, input).map(([name]) => name);
  assert.ok(names(y.federal).includes("Canada Groceries and Essentials Benefit"));
  const renamed: Federal = {
    ...y.federal,
    groceriesBenefit: { ...y.federal.groceriesBenefit, name: "GST/HST credit" },
  };
  const list = names(renamed);
  assert.ok(list.includes("GST/HST credit"));
  assert.ok(!list.includes("Canada Groceries and Essentials Benefit"));
});
