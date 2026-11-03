// Provincial childcare relief. Federal and Quebec eligibility are independent; only allocation validation is shared.
import type { Province } from "../data/schema.ts";
import type { ChildcareResult } from "./childcare.ts";
import type { Household } from "./types.ts";

export interface ChildcareCreditResult {
  program: string;
  name: string;
  status: ChildcareResult["status"];
  refundable: boolean;
  expenses: number;
  eligibleExpenses: number;
  annualLimit: number;
  allowedExpenses: number;
  income: number;
  rate: number;
  calculated: number;
  applied: number;
  perPerson?: number[];
  reasons: string[];
}

const amount = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v) && v >= 0;

/** beforeChildcare contains RAW individual net incomes, before the zero floor and childcare subtraction. */
export function childcareCreditOf(
  p: Province,
  hh: Household,
  federal: ChildcareResult,
  beforeChildcare: number[],
  provincialFamily: number,
  nlApplied: number[],
): ChildcareCreditResult | undefined {
  const rule = p.childcareCredit;
  if (!rule) return undefined;
  const out: ChildcareCreditResult = {
    program: rule.program,
    name: rule.name ?? rule.program,
    status: federal.status,
    refundable: rule.program !== "nl-childcare",
    expenses: federal.expenses,
    eligibleExpenses: federal.eligibleExpenses,
    annualLimit: federal.annualLimit,
    allowedExpenses: 0,
    income: 0,
    rate: 0,
    calculated: 0,
    applied: 0,
    reasons: [...federal.reasons],
  };
  if (!hh.childcare) return out;
  const ordinaryFamily =
    (hh.adults === 1 && beforeChildcare.length === 1) || (hh.adults === 2 && beforeChildcare.length === 2 && hh.spouse);
  if (rule.program === "quebec-childcare") {
    out.income = provincialFamily;
    out.eligibleExpenses = 0;
    out.annualLimit = 0;
    // These failures affect the shared child profile/allocation. Missing federal earnings/claims do not.
    if (
      !federal.childCounts ||
      federal.reasons.some(r =>
        ["invalid-mode", "amount-overflow", "invalid-declared-expenses", "expenses-not-allocated"].includes(r),
      )
    )
      return out;
    const children = hh.childcare.children;
    if (!children) return out;
    const fail = (status: ChildcareResult["status"], reason: string) => ({ ...out, status, reasons: [reason] });
    if (!ordinaryFamily) return fail("unsupported", "quebec-family-income-requires-verification");
    const q = rule.params;
    for (const child of children) {
      if (child.qcSevereImpairment !== undefined && typeof child.qcSevereImpairment !== "boolean")
        return fail("invalid", "invalid-quebec-impairment");
      const expense = child.qcEligibleExpenses === undefined && child.expenses === 0 ? 0 : child.qcEligibleExpenses;
      if (expense === undefined) return fail("incomplete", "quebec-eligible-expenses-required");
      if (!amount(expense) || expense > child.expenses) return fail("invalid", "invalid-quebec-expenses");
      const eligible = child.age <= q.eligibleThrough || child.infirm || child.qcSevereImpairment;
      if (!eligible) continue;
      out.eligibleExpenses += expense;
      out.annualLimit += child.qcSevereImpairment
        ? q.annualSevere
        : child.age < q.youngUnder
          ? q.annualYoung
          : q.annualOther;
    }
    if (!amount(out.annualLimit)) return fail("invalid", "amount-overflow");
    out.allowedExpenses = Math.min(out.eligibleExpenses, out.annualLimit);
    out.rate = q.rates.find(([upper]) => provincialFamily <= upper)?.[1] ?? 0;
    out.status = "complete";
    out.reasons = ["quebec-qualifying-expenses-attested", "quebec-provincial-family-income"];
  } else {
    if (federal.status !== "complete") return out;
    out.allowedExpenses = federal.claims.reduce((a, b) => a + b, 0);
    if (rule.program === "ontario-care") {
      if (!ordinaryFamily)
        return {
          ...out,
          status: "unsupported",
          allowedExpenses: 0,
          reasons: ["ontario-supporting-person-income-requires-verification"],
        };
      // ON479-A: add line 21400 back to raw line 23600 BEFORE each person's zero floor.
      // Social-benefits repayments are not separately modeled; this base assumes no such repayment.
      out.income = beforeChildcare.reduce((a, b) => a + Math.max(0, b), 0);
      const q = rule.params;
      let steps = 0;
      let from = q.fullThrough;
      for (const [through, step] of q.steps) {
        steps += Math.ceil(Math.max(0, Math.min(out.income, through) - from) / step);
        from = through;
      }
      out.rate = out.income > from ? 0 : Math.max(0, q.maxRate - steps * q.decrement);
      out.reasons = ["federal-allowed-claim", "income-addback-before-zero-floor"];
    } else {
      out.income = provincialFamily;
      out.rate = p.brackets[0][1];
      out.perPerson = nlApplied;
      out.reasons = ["federal-claim-per-adult", "nonrefundable-tax-floor"];
    }
  }
  out.calculated = out.allowedExpenses * out.rate;
  out.applied = out.refundable ? (hh.useCredits ? out.calculated : 0) : nlApplied.reduce((a, b) => a + b, 0);
  if (out.refundable && !hh.useCredits) out.reasons.push("refundable-credits-disabled");
  return out;
}
