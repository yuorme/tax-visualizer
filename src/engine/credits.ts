// Refundable credits for lower- and modest-income households.
import type { Federal, Province } from "../data/schema.ts";
import type { Credit, Person } from "./types.ts";

export interface CreditInput {
  famNet: number;
  famEmp: number;
  couple: boolean;
  kids: number;
  ppl: Person[];
  propTax: number;
  rent: number; // rent is annual
}

type QcType = "single" | "couple" | "parent" | "coupleKids";
const qcType = (couple: boolean, kids: number): QcType =>
  couple ? (kids ? "coupleKids" : "couple") : kids ? "parent" : "single";

export function creditsOf(fed: Federal, p: Province, f: CreditInput): Credit[] {
  const { famNet, couple, kids, ppl, propTax, rent } = f;
  const parent = !couple && kids > 0; // single parent
  const fam = couple || parent;
  const over = (t: number, inc = famNet) => Math.max(0, inc - t);
  const out: Credit[] = [];
  // Canada Groceries and Essentials Benefit (formerly the GST/HST credit)
  const gb = fed.groceriesBenefit;
  let g =
    gb.adult +
    (couple ? gb.spouseOrFirstChild : parent ? gb.spouseOrFirstChild : 0) +
    gb.child * (parent ? kids - 1 : kids);
  if (!couple)
    g += parent
      ? gb.singleSupplement.max
      : Math.min(gb.singleSupplement.max, gb.singleSupplement.rate * over(gb.singleSupplement.from));
  out.push(["Canada Groceries and Essentials Benefit", Math.max(0, g - gb.phaseOut.rate * over(gb.phaseOut.from))]);
  // Canada Workers Benefit (basic amount; no disability supplement)
  const wb = fed.workersBenefit;
  const work = couple ? ppl[0].ord + ppl[1].ord : ppl[0].ord;
  const adjNet = couple ? famNet - Math.min(wb.secondaryEarnerExemption, Math.min(ppl[0].ord, ppl[1].ord)) : famNet;
  let cwb: number;
  if (p.system === "quebec") {
    const [rate, excl, top, base] = wb.quebec[qcType(couple, kids)];
    cwb = rate * Math.max(0, Math.min(work, top) - excl) - wb.quebec.phaseOutRate * over(base, adjNet);
  } else {
    const c = wb.regional[p.code] || wb.standard,
      i = fam ? 1 : 0;
    cwb = Math.min(c.max[i], c.rate * Math.max(0, work - c.floor[i])) - c.phaseOut[i] * over(c.threshold[i], adjNet);
  }
  out.push(["Canada Workers Benefit", Math.max(0, cwb)]);
  const adultsN = couple ? 2 : 1;
  for (const cr of p.credits ?? []) {
    const name = cr.name ?? cr.program;
    switch (cr.program) {
      case "ontario-sales-tax-credit": {
        const q = cr.params,
          thr = fam ? q.thresholdFamily : q.thresholdSingle;
        out.push([name, Math.max(0, q.perPerson * (adultsN + kids) - q.rate * over(thr))]);
        break;
      }
      case "ontario-energy-property-tax-credit": {
        const q = cr.params,
          thr = fam ? q.thresholdFamily : q.thresholdSingle;
        const occ = propTax > 0 ? propTax : rent * q.rentShare;
        if (occ > 0) {
          const energy = Math.min(occ, q.energyMax),
            prop = Math.min(occ, Math.min(q.propertyRate * occ, q.propertyMax) + q.propertyBase);
          out.push([name, Math.max(0, energy + prop - q.rate * over(thr))]);
        }
        break;
      }
      case "quebec-solidarity-tax-credit": {
        // QST component + housing component, less a share of family income over the threshold
        const q = cr.params;
        const qst = q.qstAdult + (couple ? q.qstSpouse : q.qstAlone),
          housing = (couple ? q.housingCouple : q.housingSingle) + q.child * kids;
        out.push([name, Math.max(0, qst + housing - q.rate * over(q.threshold))]);
        break;
      }
      case "quebec-work-premium": {
        const q = cr.params;
        const [rate, excl, thr] = q[qcType(couple, kids)];
        out.push([name, Math.max(0, rate * Math.max(0, Math.min(work, thr) - excl) - q.phaseOutRate * over(thr))]);
        break;
      }
      case "bc-renters-tax-credit": {
        const q = cr.params;
        if (rent > 0 && propTax === 0) out.push([name, Math.max(0, q.max - q.rate * over(q.threshold))]);
        break;
      }
      case "mb-affordability-credits": {
        const q = cr.params;
        if (propTax > 0) out.push([name, Math.min(q.homeownerMax, propTax)]);
        else if (rent > 0) out.push([cr.nameRenter, q.renter]);
        break;
      }
      case "sk-low-income-tax-credit": {
        const q = cr.params,
          n = Math.min(q.maxChildren, parent ? kids - 1 : kids);
        out.push([name, Math.max(0, q.adult + (fam ? q.spouse : 0) + q.child * n - q.rate * over(q.threshold))]);
        break;
      }
      case "nb-hst-credit": {
        const q = cr.params;
        out.push([
          name,
          Math.max(
            0,
            q.adult + (fam ? q.spouse : 0) + q.child * (parent ? kids - 1 : kids) - q.rate * over(q.threshold),
          ),
        ]);
        break;
      }
      case "ns-affordable-living-tax-credit": {
        const q = cr.params;
        out.push([name, Math.max(0, q.base + q.child * kids - q.rate * over(q.threshold))]);
        break;
      }
      case "pei-essentials-benefit": {
        const q = cr.params,
          top = fam ? q.family : q.single;
        out.push([name, Math.max(q.minimum, top - q.rate * over(q.threshold))]);
        break;
      }
      case "nl-income-supplement": {
        const q = cr.params;
        const base =
          q.base + Math.min(q.extraMax, q.extraRate * over(q.extraFrom)) + (couple ? q.couple : 0) + q.child * kids;
        out.push([name, Math.max(0, base - q.rate * over(q.threshold))]);
        break;
      }
    }
  }
  return out.filter(([, a]) => a >= 0.5);
}
