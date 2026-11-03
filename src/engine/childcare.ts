// Federal line 21400. Amounts supplied here are eligible annual expenses after reimbursements/fee subsidies.
// Ordinary cases only: the manual path accepts verified exceptional claims without reapplying ordinary limits.
import type { Federal, Province } from "../data/schema.ts";
import { netOf } from "./payroll.ts";
import type { Household, Person } from "./types.ts";

export interface ChildcareChild {
  age: number; // age at December 31; T778 uses birth-year bands, including children turning 16
  expenses: number; // eligible annual expenses; include all children, even those with no expenses
  disabilityTaxCredit?: boolean; // eligibility for the higher annual limit
  infirm?: boolean; // dependent child with infirmity, including beyond the ordinary age limit
  qcEligibleExpenses?: number; // Quebec-qualifying portion; omission differs from zero when expenses are positive
  qcSevereImpairment?: boolean; // provincial severe/prolonged impairment eligibility, not federal DTC eligibility
}

export interface ChildcareInput {
  mode: "automatic" | "manual";
  children?: ChildcareChild[];
  earnedIncome?: (number | null)[]; // explicit eligible earnings per effective adult; missing differs from zero
  manualClaims?: number[]; // verified annual claims, replacing rather than supplementing automatic claims
  declaredAnnualExpenses?: number; // optional household total, used only to validate the child expense allocation
}

export interface ChildcareResult {
  status: "none" | "complete" | "incomplete" | "invalid" | "manual-required" | "unsupported";
  mode: "automatic" | "manual" | null;
  claims: number[];
  claimant: number | null;
  expenses: number;
  eligibleExpenses: number;
  annualLimit: number;
  earnedIncomeLimit: number | null;
  childLimits: number[];
  childCounts?: { kids: number; under6: number };
  reasons: string[];
}

const amount = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v) && v >= 0;
const optionalBoolean = (v: unknown) => v === undefined || typeof v === "boolean";

/** Uses the effective people list, including a spouse represented by the household's second adult.
 *  Supply the province when calculating claims; callers deriving only child counts can omit it. */
export function childcareOf(fed: Federal, hh: Household, people: Person[], p: Province | null = null): ChildcareResult {
  const input = hh.childcare;
  const out: ChildcareResult = {
    status: "none",
    mode: input?.mode ?? null,
    claims: people.map(() => 0),
    claimant: null,
    expenses: 0,
    eligibleExpenses: 0,
    annualLimit: 0,
    earnedIncomeLimit: null,
    childLimits: [],
    reasons: [],
  };
  if (!input) return out;
  const fail = (status: ChildcareResult["status"], reason: string) => ({ ...out, status, reasons: [reason] });
  if (input.mode !== "automatic" && input.mode !== "manual") return fail("invalid", "invalid-mode");
  const rule = fed.childcare;
  if (!rule) return fail("unsupported", "year-not-supported");
  const q = rule.params;
  if (!Array.isArray(input.children)) return fail("incomplete", "children-required");
  if (
    Array.from(input.children).some(
      c =>
        !c ||
        !amount(c.age) ||
        !Number.isInteger(c.age) ||
        !amount(c.expenses) ||
        !optionalBoolean(c.disabilityTaxCredit) ||
        !optionalBoolean(c.infirm),
    )
  ) {
    return fail("invalid", "invalid-child-details");
  }
  out.childCounts = {
    kids: input.children.filter(c => c.age < q.benefitChildUnder).length,
    under6: input.children.filter(c => c.age < q.benefitYoungUnder).length,
  };
  for (const child of input.children) {
    const eligible = child.age <= q.eligibleThrough || child.infirm || child.disabilityTaxCredit;
    const limit = !eligible
      ? 0
      : child.disabilityTaxCredit
        ? q.annualDisability
        : child.age < q.youngUnder
          ? q.annualYoung
          : q.annualOther;
    out.expenses += child.expenses;
    if (eligible) out.eligibleExpenses += child.expenses;
    out.childLimits.push(limit);
    out.annualLimit += limit;
  }
  if (!amount(out.expenses) || !amount(out.annualLimit)) return fail("invalid", "amount-overflow");
  if (input.declaredAnnualExpenses !== undefined) {
    if (!amount(input.declaredAnnualExpenses)) return fail("invalid", "invalid-declared-expenses");
    if (Math.abs(input.declaredAnnualExpenses - out.expenses) > 0.06 + 1e-9)
      return fail("incomplete", "expenses-not-allocated");
  }
  if (input.mode === "manual") {
    if (!Array.isArray(input.manualClaims) || input.manualClaims.length !== people.length)
      return fail("incomplete", "manual-claims-required");
    if (!Array.from(input.manualClaims).every(amount)) return fail("invalid", "invalid-manual-claims");
    const sum = input.manualClaims.reduce((a, b) => a + b, 0);
    // Manual mode intentionally overrides age/earnings/claimant rules. The user verifies tax eligibility.
    if (!amount(sum) || sum > out.expenses) return fail("invalid", "claims-exceed-expenses");
    out.eligibleExpenses = out.expenses; // eligibility is verified by the caller in manual mode
    out.claims = [...input.manualClaims];
    out.status = "complete";
    out.reasons = ["verified-manual-claims"];
    return out;
  }
  const ordinary = (hh.adults === 1 && people.length === 1) || (hh.adults === 2 && people.length === 2 && hh.spouse);
  if (!ordinary) return fail("manual-required", "unsupported-supporting-person-situation");
  if (out.expenses === 0) return { ...out, status: "complete", reasons: ["no-expenses"] };
  if (
    !Array.isArray(input.earnedIncome) ||
    input.earnedIncome.length !== people.length ||
    Array.from(input.earnedIncome).some(v => v === null || v === undefined)
  )
    return fail("incomplete", "earned-income-required");
  if (!Array.from(input.earnedIncome).every(amount)) return fail("invalid", "invalid-earned-income");
  const nets = people.map(x => netOf(fed, p, x));
  // Equal income: elect the first adult. This is deterministic, not a household-tax optimization.
  const claimant = people.length === 2 && nets[1] < nets[0] ? 1 : 0;
  const earnings = input.earnedIncome[claimant];
  if (!amount(earnings)) return fail("invalid", "invalid-earned-income");
  out.claimant = claimant;
  out.earnedIncomeLimit = (earnings / q.earnedDenominator) * q.earnedNumerator;
  out.claims[claimant] = Math.min(out.eligibleExpenses, out.annualLimit, out.earnedIncomeLimit);
  out.status = "complete";
  out.reasons = [
    people.length === 1
      ? "single-parent"
      : nets[0] === nets[1]
        ? "equal-income-election-first-adult"
        : "lower-income-adult",
  ];
  if (out.claims[claimant] === out.eligibleExpenses) out.reasons.push("eligible-expenses-limit");
  if (out.claims[claimant] === out.annualLimit) out.reasons.push("annual-child-limits");
  if (out.claims[claimant] === out.earnedIncomeLimit) out.reasons.push("earned-income-limit");
  return out;
}
