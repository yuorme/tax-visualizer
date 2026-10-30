// Everyone in the household in one province: income tax and payroll per person, the spouse / eligible dependant
// amounts, child benefits, refundable credits, sales and property tax, and marginal rates.

import { ccbOf, provincialChildBenefit } from "./benefits.ts";
import { phased } from "./brackets.ts";
import { creditsOf } from "./credits.ts";
import { netOf } from "./payroll.ts";
import { type PersonResult, personTax } from "./personal.ts";
import {
  blank,
  type Credit,
  type Ctx,
  type Household,
  INCOME_KEYS,
  type IncomeKey,
  type Person,
  type Province,
  type YearData,
} from "./types.ts";

const NOSP = { f: 0, p: 0 };

export interface Claim {
  c: number;
  o: number | null;
  fAmt: number;
  pAmt: number;
  pCredit?: number;
  qc: boolean;
  kind: "spouse" | "dependant" | "alone";
  saved: number;
}

function addUp(list: PersonResult[]) {
  const s = { total: 0, fed: 0, prov: 0, wh: 0, cash: 0, payroll: 0 };
  list.forEach(r => {
    for (const key of Object.keys(s) as (keyof typeof s)[]) s[key] += r[key];
  });
  return s;
}

/** Income tax, payroll, child benefits and refundable credits for the household in province p.
 *  With two spouses, the higher earner claims the spouse amount and the children; a single parent claims the
 *  eligible dependant amount. Child benefits use family net income. */
export function household(y: YearData, p: Province, hh: Household, peopleIn: Person[] = hh.people) {
  const fed = y.federal,
    qc = p.system === "quebec";
  const { adults, spouse, kids, under6, useBpa } = hh;
  const s = { useBpa, whRate: hh.whRate };
  // A second adult with no income entered is treated as a spouse with no income
  const ppl = peopleIn.length === 1 && adults >= 2 ? [peopleIn[0], blank(0)] : peopleIn;
  const nets = ppl.map(x => netOf(fed, x));
  const couple = ppl.length === 2 && spouse;
  const famNet = couple ? nets[0] + nets[1] : nets[0];
  const famEmp = couple ? ppl[0].ord + ppl[1].ord : ppl[0].ord;
  const c = ppl.length === 2 && nets[1] > nets[0] ? 1 : 0,
    o = 1 - c;
  const single = ppl.length === 1 && adults === 1;
  // kidsAll: children counted for low-income reductions, other than a child already claimed as an eligible dependant
  const ctx = (i: number): Ctx => ({
    kids: i === c ? kids : 0,
    u6: i === c ? under6 : 0,
    kidsAll: i === c ? (single && kids > 0 ? kids - 1 : kids) : 0,
    famNet: couple ? famNet : nets[i],
    claims: couple ? i === c : true,
    fam: couple || (single && kids > 0),
  });
  const fr = fed.brackets[0][1],
    prr = p.brackets[0][1];
  let list: PersonResult[] = [],
    claim: Claim | null = null;
  if (couple && useBpa) {
    const rO = personTax(fed, p, ppl[o], NOSP, ctx(o), s);
    const fAmt = Math.max(0, phased(fed.basicPersonalAmount, nets[c]) - nets[o]);
    const rule = p.spouseAmount;
    let pAmt: number, pCredit: number;
    if (rule === "transfer") {
      pCredit = Math.max(0, rO.pBpaFull - rO.pCred);
      pAmt = pCredit / prr;
    } else {
      pAmt = rule === "federal" ? fAmt : Math.max(0, rule.max - Math.max(0, nets[o] - rule.threshold));
      pCredit = pAmt * prr;
    }
    const rC = personTax(fed, p, ppl[c], { f: fAmt * fr, p: pCredit }, ctx(c), s);
    list[c] = rC;
    list[o] = rO;
    claim = { c, o, fAmt, pAmt, pCredit, qc: rule === "transfer", kind: "spouse", saved: rC.fSp * rC.k + rC.pSp };
  } else if (single && useBpa) {
    // One adult: eligible dependant amount if there are children; Quebec's amount for a person living alone
    let f = 0,
      pp = 0,
      fAmt = 0,
      pAmt = 0;
    if (kids > 0 && !qc) {
      fAmt = phased(fed.basicPersonalAmount, nets[0]);
      const rule = p.spouseAmount;
      pAmt = rule === "federal" ? fAmt : typeof rule === "object" ? rule.max : 0;
      f = fAmt * fr;
      pp = pAmt * prr;
    }
    if (p.quebec) {
      if (kids > 0) {
        fAmt = phased(fed.basicPersonalAmount, nets[0]);
        f = fAmt * fr;
      }
      const la = p.quebec.livingAlone;
      pAmt = Math.max(0, la.max - la.rate * Math.max(0, nets[0] - la.threshold)); // amount for a person living alone
      pp = pAmt * prr;
    }
    const r0 = personTax(fed, p, ppl[0], { f, p: pp }, ctx(0), s);
    list = [r0];
    if (f + pp > 0)
      claim = { c: 0, o: null, fAmt, pAmt, qc, kind: kids > 0 ? "dependant" : "alone", saved: r0.fSp * r0.k + r0.pSp };
  } else {
    list = ppl.map((x, i) => personTax(fed, p, x, NOSP, ctx(i), s));
  }
  const totals = addUp(list);
  const ccb = ccbOf(fed, famNet, kids, under6);
  const provBen = provincialChildBenefit(p.childBenefit, famNet, famEmp, kids, single, under6);
  const childBen = ccb + provBen;
  // Refundable credits (counted only when the credits switch is on)
  const credits: Credit[] = hh.useCredits
    ? creditsOf(fed, p, {
        famNet,
        famEmp,
        couple,
        kids,
        ppl,
        propTax: hh.homeValue * propertyRate(p, hh),
        rent: hh.homeValue > 0 ? 0 : hh.rent * 12,
      })
    : [];
  const refund = credits.reduce((a, [, v]) => a + v, 0);
  const benefits = childBen + refund;
  return {
    list,
    claim,
    ...totals,
    ccb,
    provBen,
    childBen,
    credits,
    refund,
    benefits,
    famNet,
    netTotal: totals.total - benefits,
  }; // income tax + payroll − child benefits − refundable credits
}

export const propertyRate = (p: Province, hh: Household) => hh.propertyRates?.[p.code] ?? p.propertyTax.rate;

const bump = (x: Person, key: IncomeKey, d: number): Person => ({ ...x, [key]: x[key] + d });
const zeroInv = (x: Person): Person => ({ ...x, cg: 0, ed: 0, nd: 0, fd: 0 });
export const hasInv = (x: Person) => x.cg !== 0 || x.ed > 0 || x.nd > 0 || x.fd > 0;

/** Full result for one province: household tax plus marginal rates, investment tax, sales and property tax. */
export function compute(y: YearData, p: Province, hh: Household) {
  const h = household(y, p, hh);
  // Marginal rates measured directly (next $100 of each type for the selected person), so phase-outs,
  // payroll ceilings, benefit clawbacks and spouse-amount interactions all show up.
  const margBy = {} as Record<IncomeKey, number>;
  for (const key of INCOME_KEYS)
    margBy[key] =
      (household(
        y,
        p,
        hh,
        hh.people.map((x, i) => (i === hh.active ? bump(x, key, 100) : x)),
      ).netTotal -
        h.netTotal) /
      100;
  const hasAnyInv = hh.people.some(hasInv);
  const invAmt = hh.people.reduce((a, x) => a + x.cg + x.ed + x.nd + x.fd, 0);
  const invTax = hasAnyInv ? h.netTotal - household(y, p, hh, hh.people.map(zeroInv)).netTotal : 0;
  // Sales and property tax sit on top; they don't change marginal rates.
  const salesRate = p.salesTax.rate;
  const sales = hh.monthlySpending * 12 * salesRate;
  const propRate = propertyRate(p, hh);
  const property = hh.homeValue * propRate;
  const gross = h.fed + h.prov + h.wh + h.payroll + sales + property;
  const total = gross - h.benefits; // net of child benefits and refundable credits
  const on = h.cash > 0,
    base = on ? h.cash : 1;
  return {
    ...h,
    margBy,
    marg: margBy.ord,
    invAmt,
    hasInv: hasAnyInv,
    invTax,
    me: h.list[hh.active] || h.list[0],
    incomeTax: h.fed + h.prov + h.wh,
    salesRate,
    sales,
    propRate,
    property,
    gross,
    total,
    base,
    avg: on ? total / base : 0,
    grossAvg: on ? gross / base : 0,
  };
}

export type Result = ReturnType<typeof compute>;

/** Results for every province and territory, in west-to-east order. */
export function computeAll(y: YearData, hh: Household) {
  return y.provinces.map(p => ({ p, r: compute(y, p, hh) }));
}
