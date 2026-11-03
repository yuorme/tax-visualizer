// Everyone in the household in one province: income tax and payroll per person, the spouse / eligible dependant
// amounts, child benefits, refundable credits, sales, property and fuel tax, and marginal rates.

import { ccbOf, provincialChildBenefit } from "./benefits.ts";
import { phased } from "./brackets.ts";
import { carbonCostsOf } from "./carbon.ts";
import { childcareOf } from "./childcare.ts";
import { childcareCreditOf } from "./childcare-credits.ts";
import { creditsOf } from "./credits.ts";
import { fuelTaxOf } from "./fuel.ts";
import { netIncomeParts, netOf } from "./payroll.ts";
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

/** Provincial spouse/dependant base. Nova Scotia's historical supplement has two independent reductions:
 *  claimant taxable income first, then the dependant's full net income (without the base credit's disregard). */
function spouseAmount(rule: Exclude<Province["spouseAmount"], string>, claimant: number, dependant: number): number {
  if ("program" in rule) {
    const q = rule.params;
    const supplement = Math.max(
      0,
      q.supplement.max - q.supplement.rate * Math.max(0, claimant - q.supplement.threshold),
    );
    return Math.max(0, q.max - Math.max(0, dependant - q.threshold)) + Math.max(0, supplement - dependant);
  }
  return Math.max(0, rule.max - Math.max(0, dependant - rule.threshold));
}

export interface Claim {
  c: number;
  provincialClaimant?: number; // supplied only when Quebec transfer and federal claimant differ
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

/** Household sums the page shows: the Ontario surtax, the provincial tax reductions (Ontario tax reduction, LIFT
 *  credit, BC tax reduction), the foreign tax credit, and payroll by kind (cpp is base plus enhanced CPP or QPP). */
function householdBreakdown(list: PersonResult[]) {
  const b = { surtax: 0, provReductions: 0, ftc: 0, payroll: { cpp: 0, ei: 0, qpip: 0, terr: 0, ohp: 0 } };
  for (const r of list) {
    b.surtax += r.surtax;
    b.provReductions = b.provReductions + r.onRed + r.lift + r.bcRed;
    b.ftc += r.breakdown.ftc;
    b.payroll.cpp = b.payroll.cpp + r.pay.base + r.pay.enh;
    b.payroll.ei += r.pay.ei;
    b.payroll.qpip += r.pay.qpip;
    b.payroll.terr += r.pay.terr;
    b.payroll.ohp += r.ohp;
  }
  return b;
}

/** Income tax, payroll, child benefits and refundable credits for the household in province p.
 *  With two spouses, the higher earner claims the spouse amount and the children; a single parent claims the
 *  eligible dependant amount. Child benefits use family net income. */
export function household(y: YearData, p: Province, hh: Household, peopleIn: Person[] = hh.people) {
  const fed = y.federal,
    qc = p.system === "quebec";
  const { adults, spouse, useBpa } = hh;
  const s = { useBpa, whRate: hh.whRate };
  // A second adult with no income entered is treated as a spouse with no income
  const ppl = peopleIn.length === 1 && adults >= 2 ? [peopleIn[0], blank(0)] : peopleIn;
  const childcare = childcareOf(fed, hh, ppl);
  const { kids, under6 } = childcare.childCounts ?? hh;
  const nets = ppl.map((x, i) => netOf(fed, x, childcare.claims[i]));
  const provincialNets = qc ? ppl.map(x => netOf(fed, x)) : nets;
  const couple = ppl.length === 2 && spouse;
  const famNet = couple ? nets[0] + nets[1] : nets[0];
  const provincialFamNet = couple ? provincialNets[0] + provincialNets[1] : provincialNets[0];
  const famEmp = couple ? ppl[0].ord + ppl[1].ord : ppl[0].ord;
  const c = ppl.length === 2 && nets[1] > nets[0] ? 1 : 0,
    o = 1 - c;
  const single = ppl.length === 1 && adults === 1;
  // kidsAll: children counted for low-income reductions, other than a child already claimed as an eligible dependant
  const ctx = (i: number): Ctx => ({
    childcareDeduction: childcare.claims[i],
    kids: i === c ? kids : 0,
    u6: i === c ? under6 : 0,
    kidsAll: i === c ? (single && kids > 0 ? kids - 1 : kids) : 0,
    famNet: couple ? provincialFamNet : provincialNets[i],
    claims: couple ? i === c : true,
    fam: couple || (single && kids > 0),
  });
  const fr = fed.brackets[0][1],
    prr = p.brackets[0][1];
  let list: PersonResult[] = [],
    claim: Claim | null = null;
  if (couple && useBpa) {
    // Quebec transfers use provincial income, which does not fall with the federal childcare deduction.
    const cp = qc && provincialNets[1] > provincialNets[0] ? 1 : qc ? 0 : c;
    const rO = personTax(fed, p, ppl[1 - cp], NOSP, ctx(1 - cp), s);
    const fAmt = Math.max(0, phased(fed.basicPersonalAmount, nets[c]) - nets[o]);
    const rule = p.spouseAmount;
    let pAmt: number, pCredit: number;
    if (rule === "transfer") {
      pCredit = Math.max(0, rO.pBpaFull - rO.pCred);
      pAmt = pCredit / prr;
    } else {
      pAmt = rule === "federal" ? fAmt : spouseAmount(rule, nets[c], nets[o]);
      pCredit = pAmt * prr;
    }
    list = ppl.map((x, i) =>
      personTax(fed, p, x, { f: i === c ? fAmt * fr : 0, p: i === cp ? pCredit : 0 }, ctx(i), s),
    );
    claim = {
      c,
      o,
      fAmt,
      pAmt,
      pCredit,
      qc: rule === "transfer",
      kind: "spouse",
      saved: list[c].fSp * list[c].k + list[cp].pSp,
      ...(cp !== c ? { provincialClaimant: cp } : {}),
    };
  } else if (single && useBpa) {
    // One adult: eligible dependant amount if there are children; Quebec's amount for a person living alone
    let f = 0,
      pp = 0,
      fAmt = 0,
      pAmt = 0;
    if (kids > 0 && !qc) {
      fAmt = phased(fed.basicPersonalAmount, nets[0]);
      const rule = p.spouseAmount;
      pAmt = rule === "federal" ? fAmt : typeof rule === "object" ? spouseAmount(rule, nets[0], 0) : 0;
      f = fAmt * fr;
      pp = pAmt * prr;
    }
    if (p.quebec) {
      if (kids > 0) {
        fAmt = phased(fed.basicPersonalAmount, nets[0]);
        f = fAmt * fr;
      }
      const la = p.quebec.livingAlone;
      pAmt = Math.max(0, la.max - la.rate * Math.max(0, provincialNets[0] - la.threshold)); // amount for a person living alone
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
  const provBen = provincialChildBenefit(p.childBenefit, provincialFamNet, famEmp, kids, single, under6);
  const childBen = ccb + provBen;
  const incomeBases = {
    beforeChildcare: ppl.map(x => {
      const n = netIncomeParts(fed, x);
      return n.ord + n.cg + n.ed + n.nd + n.fd - n.ded - n.enh;
    }),
    federal: nets,
    provincial: list.map(r => r.tiP),
    provincialFamily: couple ? list[0].tiP + list[1].tiP : list[0].tiP,
  };
  const childcareCredit = childcareCreditOf(
    p,
    hh,
    childcare,
    incomeBases.beforeChildcare,
    incomeBases.provincialFamily,
    list.map(r => r.breakdown.childcareCredit.applied),
  );
  // Refundable credits (counted only when the credits switch is on)
  const credits: Credit[] = hh.useCredits
    ? creditsOf(fed, p, {
        famNet,
        provincialFamNet,
        famEmp,
        couple,
        kids,
        ppl,
        propTax: hh.homeValue * propertyRate(p, hh),
        rent: hh.homeValue > 0 ? 0 : hh.rent * 12,
      })
    : [];
  if (childcareCredit?.refundable && childcareCredit.applied > 0)
    credits.push([childcareCredit.name, childcareCredit.applied]);
  const refund = credits.reduce((a, [, v]) => a + v, 0);
  const benefits = childBen + refund;
  return {
    list,
    claim,
    childcare,
    ...totals,
    ccb,
    provBen,
    childBen,
    credits,
    refund,
    benefits,
    famNet,
    netTotal: totals.total - benefits, // income tax + payroll − child benefits − refundable credits
    breakdown: {
      ...householdBreakdown(list),
      incomeBases,
      childcareCredit,
    }, // nested so the golden snapshot keeps its format (see personTax)
  };
}

export const propertyRate = (p: Province, hh: Household) => hh.propertyRates?.[p.code] ?? p.propertyTax.rate;

const bump = (x: Person, key: IncomeKey, d: number): Person => ({ ...x, [key]: x[key] + d });
const zeroInv = (x: Person): Person => ({ ...x, cg: 0, ed: 0, nd: 0, fd: 0 });
export const hasInv = (x: Person) => x.cg !== 0 || x.ed > 0 || x.nd > 0 || x.fd > 0;

/** Full result for one province: household tax plus marginal rates, investment tax, sales, property and fuel tax. */
export function compute(y: YearData, p: Province, hh: Household) {
  const h = household(y, p, hh);
  // Explicit eligible childcare earnings stay fixed: ord also includes pensions/other non-earned income.
  // Claimant selection is recomputed for each counterfactual; investment bumps never create earned income.
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
  // Sales, property and fuel tax sit on top; they don't change marginal rates.
  const salesRate = p.salesTax.rate;
  const sales = hh.monthlySpending * 12 * salesRate;
  const propRate = propertyRate(p, hh);
  const property = hh.homeValue * propRate;
  // fuel is null for a year without fuel data (an object, so the golden snapshot, which locks top-level numbers,
  // keeps its format; the fuel tax is locked through gross and total).
  const fuel = fuelTaxOf(y, p, hh.driving);
  const carbon = carbonCostsOf(y.year, p, hh.driving);
  const gross = h.fed + h.prov + h.wh + h.payroll + sales + property + (fuel?.total ?? 0) + (carbon?.total ?? 0);
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
    fuel,
    carbon,
    gross,
    total,
    base,
    avg: on ? total / base : 0,
    grossAvg: on ? gross / base : 0,
    breakdown: { ...h.breakdown, left: h.cash - total }, // left: income after every tax, benefits and credits added
  };
}

export type Result = ReturnType<typeof compute>;

/** Results for every province and territory, in west-to-east order. */
export function computeAll(y: YearData, hh: Household) {
  return y.provinces.map(p => ({ p, r: compute(y, p, hh) }));
}
