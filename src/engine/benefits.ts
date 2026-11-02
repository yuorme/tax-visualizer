// Child benefits: the Canada Child Benefit and each province's or territory's own benefit.
import type { ChildBenefitProgram, Federal } from "../data/schema.ts";

/** Canada Child Benefit. under6 = how many of the children are under 6. */
export function ccbOf(fed: Federal, famNet: number, kids: number, under6: number): number {
  if (!kids) return 0;
  const c = fed.childBenefit;
  const n = Math.min(kids, 4),
    full = under6 * c.perChildUnder6 + (kids - under6) * c.perChild6to17;
  const red =
    famNet <= c.threshold1
      ? 0
      : famNet <= c.threshold2
        ? c.rate1[n] * (famNet - c.threshold1)
        : c.fixed2[n] + c.rate2[n] * (famNet - c.threshold2);
  return Math.max(0, full - red);
}

/** Straight-line phase-out between published start and end incomes (where the in-between rate isn't published). */
const taper = (amt: number, famNet: number, from: number, to: number) =>
  amt * Math.max(0, Math.min(1, (to - famNet) / (to - from)));

/** Annual entitlement under one Newfoundland and Labrador reduction schedule. */
function nlChildBenefit(
  q: Extract<ChildBenefitProgram, { program: "nl-child-benefit-reduction" }>["params"],
  famNet: number,
  kids: number,
) {
  let amt = 0;
  for (let i = 0; i < kids; i++) amt += q.perChild[Math.min(i, 3)];
  const reductionRate = q.rate[Math.min(kids, 3) - 1] + Math.max(0, kids - 3) * q.additionalRate;
  return Math.max(0, amt - reductionRate * Math.max(0, famNet - q.threshold));
}

/** Provincial or territorial child benefit. single = one adult in the household. */
export function provincialChildBenefit(
  b: ChildBenefitProgram | undefined,
  famNet: number,
  famEmp: number,
  kids: number,
  single: boolean,
  kidsU6 = 0,
): number {
  if (!kids || !b) return 0;
  const over = (t: number) => Math.max(0, famNet - t);
  switch (b.program) {
    case "ontario-child-benefit": {
      const q = b.params;
      return Math.max(0, q.perChild * kids - q.rate * over(q.threshold));
    }
    case "quebec-family-allowance": {
      const q = b.params;
      const mx = q.max * kids + (single ? q.maxSingleParent : 0),
        mn = q.min * kids + (single ? q.minSingleParent : 0);
      return (
        Math.max(mn, mx - q.rate * over(single ? q.thresholdSingle : q.thresholdCouple)) +
        q.schoolSupplies * (kids - kidsU6)
      );
    }
    case "bc-family-benefit": {
      const q = b.params;
      let mx = 0,
        mn = 0;
      for (let i = 0; i < kids; i++) {
        mx += q.max[Math.min(i, 2)];
        mn += q.min[Math.min(i, 2)];
      }
      if (single) mx += q.singleParent;
      return famNet <= q.minThreshold
        ? Math.max(mn, mx - q.rate * over(q.threshold))
        : Math.max(0, mn - q.rate * over(q.minThreshold));
    }
    case "alberta-child-family-benefit":
    case "alberta-child-family-benefit-by-child": {
      const q = b.params,
        n = Math.min(kids, 4) - 1;
      const base = Math.max(0, q.base[n] - q.baseRate[n] * over(q.baseThreshold));
      const phaseOut = typeof q.workingPhaseOut === "number" ? q.workingPhaseOut : q.workingPhaseOut[n];
      const work = Math.max(
        0,
        Math.min(q.working[n], q.workingRate * Math.max(0, famEmp - q.workingFloor)) -
          phaseOut * over(q.workingThreshold),
      );
      const total = base + work;
      return b.program === "alberta-child-family-benefit-by-child" && total > 0
        ? Math.max(b.params.minAnnual, total)
        : total;
    }
    case "nova-scotia-child-benefit": {
      const q = b.params;
      return famNet < q.fullBelow
        ? q.perChild * kids
        : famNet < q.partialBelow
          ? q.perChild + q.partialOtherChildren * (kids - 1)
          : 0;
    }
    case "nb-child-tax-benefit": {
      const q = b.params,
        w = q.workingIncomeSupplement;
      const ctb = Math.max(
        0,
        q.perChild * kids - (kids === 1 ? q.rateOneChild : q.rateMoreChildren) * over(q.threshold),
      );
      const wis = Math.max(0, Math.min(w.max, w.rate * Math.max(0, famEmp - w.floor)) - w.phaseOut * over(w.threshold));
      return ctb + wis;
    }
    case "per-child-reduced": {
      const q = b.params;
      return Math.max(0, q.perChild * kids - (kids === 1 ? q.rateOneChild : q.rateMoreChildren) * over(q.threshold));
    }
    case "nwt-child-benefit": {
      const q = b.params,
        n = Math.min(kids, 4),
        extra = Math.max(0, kids - 4);
      const u6 = q.under6[n] + extra * q.under6More,
        o6 = q.over6[n] + extra * q.over6More;
      const amt = o6 + ((u6 - o6) * kidsU6) / kids; // blend for families with children of both ages
      return famNet <= q.fullUpTo ? amt : taper(amt, famNet, q.fullUpTo, q.endsAt);
    }
    case "nl-child-benefit": {
      const q = b.params;
      let amt = 0;
      for (let i = 0; i < kids; i++) amt += q.perChild[Math.min(i, 3)];
      return famNet <= q.fullUpTo ? amt : taper(amt, famNet, q.fullUpTo, q.endsAt);
    }
    case "income-band-per-child": {
      for (const [below, per] of b.params.bands) if (famNet < below) return per * kids;
      return 0;
    }
    case "nl-child-benefit-reduction": {
      return nlChildBenefit(b.params, famNet, kids);
    }
    case "nl-child-benefit-periods": {
      return b.params.periods.reduce((sum, q) => sum + q.weight * nlChildBenefit(q, famNet, kids), 0);
    }
  }
}
