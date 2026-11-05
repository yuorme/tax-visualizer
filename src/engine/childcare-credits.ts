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

/** beforeChildcareAndRecovery contains RAW individual income before the zero floor and lines 21400/23500. */
export function childcareCreditOf(
  p: Province,
  hh: Household,
  federal: ChildcareResult,
  beforeChildcareAndRecovery: number[],
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
    (hh.adults === 1 && beforeChildcareAndRecovery.length === 1) ||
    (hh.adults === 2 && beforeChildcareAndRecovery.length === 2 && hh.spouse);
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
      // ON479-A: add lines 21400 AND 23500 back to raw line 23600 BEFORE each person's zero floor.
      // Other programs retain their post-recovery provincial/federal bases.
      out.income = beforeChildcareAndRecovery.reduce((a, b) => a + Math.max(0, b), 0);
      const q = rule.params;
      let steps = 0;
      let from = q.fullThrough;
      // Summing quarterly OAS with other receipts can land a few binary bits above an exact dollar boundary.
      const roundoff = Number.EPSILON * Math.max(1, Math.abs(out.income)) * 8;
      for (const [through, step] of q.steps) {
        steps += Math.ceil(Math.max(0, Math.min(out.income, through) - from - roundoff) / step);
        from = through;
      }
      out.rate = out.income > from + roundoff ? 0 : Math.max(0, q.maxRate - steps * q.decrement);
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
