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

/** Straight-line phase-out between the start and end incomes. */
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

/** BC early-childhood annual entitlement: both the amount and reduction scale with eligible young children. */
function bcEarlyBenefit(
  q: Extract<ChildBenefitProgram, { program: "bc-early-childhood-benefit" }>["params"],
  famNet: number,
  kidsU6: number,
) {
  return kidsU6 * Math.max(0, q.perChild - q.rate * Math.max(0, famNet - q.threshold));
}

/** BC annual entitlement; each period applies its own minimum and zero floor. */
function bcBenefit(
  q: Extract<ChildBenefitProgram, { program: "bc-family-benefit" }>["params"],
  famNet: number,
  kids: number,
  single: boolean,
) {
  let mx = 0,
    mn = 0;
  for (let i = 0; i < kids; i++) {
    mx += q.max[Math.min(i, 2)];
    mn += q.min[Math.min(i, 2)];
  }
  if (single) mx += q.singleParent;
  return famNet <= q.minThreshold
    ? Math.max(mn, mx - q.rate * Math.max(0, famNet - q.threshold))
    : Math.max(0, mn - q.rate * Math.max(0, famNet - q.minThreshold));
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
    case "quebec-family-allowance":
    case "quebec-family-allowance-by-child": {
      const q = b.params;
      const sum = (amount: number | number[]) =>
        typeof amount === "number"
          ? amount * kids
          : Array.from({ length: kids }, (_, i) => amount[Math.min(i, amount.length - 1)]).reduce((a, b) => a + b, 0);
      const mx = sum(q.max) + (single ? q.maxSingleParent : 0),
        mn = sum(q.min) + (single ? q.minSingleParent : 0);
      return (
        Math.max(mn, mx - q.rate * over(single ? q.thresholdSingle : q.thresholdCouple)) +
        q.schoolSupplies * (kids - kidsU6)
      );
    }
    case "bc-early-childhood-benefit": {
      return bcEarlyBenefit(b.params, famNet, kidsU6);
    }
    case "bc-child-benefit-transition": {
      const q = b.params;
      return (
        q.early.weight * bcEarlyBenefit(q.early, famNet, kidsU6) +
        q.opportunity.weight * bcBenefit(q.opportunity, famNet, kids, single)
      );
    }
    case "bc-family-benefit": {
      return bcBenefit(b.params, famNet, kids, single);
    }
    case "bc-family-benefit-periods": {
      return b.params.periods.reduce((sum, q) => sum + q.weight * bcBenefit(q, famNet, kids, single), 0);
    }
    case "alberta-child-benefit-and-employment":
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
      if (b.program === "alberta-child-benefit-and-employment") {
        const minimum = (value: number) => (value > 0 ? Math.max(b.params.minAnnual, value) : 0);
        return minimum(base) + minimum(work);
      }
      return b.program === "alberta-child-family-benefit-by-child" && total > 0
        ? Math.max(b.params.minAnnual, total)
        : total;
    }
    case "nova-scotia-child-benefit-reduction": {
      const q = b.params;
      const maximum = q.perChild[0] + (kids > 1 ? q.perChild[1] : 0) + Math.max(0, kids - 2) * q.perChild[2];
      const rate = q.rate[Math.min(kids, 2) - 1] + Math.max(0, kids - 2) * q.additionalRate;
      return famNet < q.fullBelow ? maximum : Math.max(0, maximum - rate * over(q.threshold));
    }
    case "nova-scotia-child-benefit-by-child": {
      const q = b.params;
      if (famNet >= q.partialBelow) return 0;
      let laterChildren = 0;
      for (let i = 1; i < kids; i++) laterChildren += q.perChild[Math.min(i, 2)];
      return q.perChild[0] + laterChildren * (famNet < q.fullBelow ? 1 : q.partialOtherRate);
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
    case "nwt-child-benefit-age-groups": {
      const q = b.params,
        older = kids - kidsU6;
      const youngAmount = q.under6[Math.min(kidsU6, 4)] + Math.max(0, kidsU6 - 4) * q.under6More;
      const olderAmount = q.over6[Math.min(older, 4)] + Math.max(0, older - 4) * q.over6More;
      return taper(youngAmount + olderAmount, famNet, q.fullUpTo, q.endsAt);
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
