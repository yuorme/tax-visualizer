// Everyone in the household in one province: income tax and payroll per person, the spouse / eligible dependant
// amounts, child benefits, refundable credits, sales, property and fuel tax, and marginal rates.

import { ccbOf, provincialChildBenefit } from "./benefits.ts";
import { phased } from "./brackets.ts";
import { carbonCostsOf } from "./carbon.ts";
import { childcareOf } from "./childcare.ts";
import { childcareCreditOf } from "./childcare-credits.ts";
import { creditsOf } from "./credits.ts";
import { fuelTaxOf } from "./fuel.ts";
import { gisAllowanceOf, validateGisAllowance } from "./gis-allowance.ts";
import { householdPremiumOf } from "./health-premiums.ts";
import { netIncomeParts, netIncomeTotal, workerDeductionOf } from "./payroll.ts";
import { type PersonResult, personTax } from "./personal.ts";
import { hasSeniorInputs, quebecSeniorPool, seniorTransfer } from "./senior-credits.ts";
import {
  blank,
  type Credit,
  type Ctx,
  type Household,
  type IncomeKey,
  MARGINAL_KEYS,
  type MarginalKey,
  type Person,
  type Province,
  workingIncomeOf,
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

/** Legacy child-only SK(S2)/NU(S2). Senior scenarios use the shared pool in seniorTransfer instead. */
export function unusedSpouseTransferBase(donor: PersonResult, pool: number, creditRate: number): number {
  const capacity = Math.max(0, (donor.pr.tax - donor.pBpaFull - donor.pEmpFull) / creditRate);
  return Math.max(0, pool - capacity);
}

/** Compare final household tax, retaining the first legal election on a tie within floating-point roundoff. */
function bestElection(candidates: PersonResult[][]): PersonResult[] {
  return candidates.reduce((first, second) => {
    const firstTotal = addUp(first).total;
    const secondTotal = addUp(second).total;
    const roundoff = Number.EPSILON * Math.max(1, Math.abs(firstTotal), Math.abs(secondTotal)) * 8;
    return secondTotal < firstTotal - roundoff ? second : first;
  });
}

/** Grossed-up dividends can differ from equal dollar income by a few binary floating-point bits. */
function incomesTied(incomes: number[]): boolean {
  return Math.abs(incomes[0] - incomes[1]) <= Number.EPSILON * Math.max(1, ...incomes) * 8;
}

/** Household sums the page shows: the Ontario surtax, the provincial tax reductions (Ontario tax reduction, LIFT
 *  credit, BC tax reduction), the foreign tax credit, and payroll by kind (cpp is base plus enhanced CPP or QPP). */
function householdBreakdown(list: PersonResult[]) {
  const b = {
    surtax: 0,
    provReductions: 0,
    ftc: 0,
    healthServicesFund: 0,
    payroll: { cpp: 0, ei: 0, qpip: 0, terr: 0, ohp: 0 },
  };
  for (const r of list) {
    b.surtax += r.surtax;
    b.provReductions = b.provReductions + r.onRed + r.lift + r.bcRed;
    b.ftc += r.breakdown.ftc;
    b.payroll.cpp = b.payroll.cpp + r.pay.base + r.pay.enh;
    b.payroll.ei += r.pay.ei;
    b.payroll.qpip += r.pay.qpip;
    b.payroll.terr += r.pay.terr;
    b.payroll.ohp += r.ohp;
    b.healthServicesFund += r.breakdown.healthServicesFund.contribution;
  }
  return b;
}

/** Income tax, payroll, child benefits and refundable credits for the household in province p.
 *  The higher-net-income spouse is the supporting-spouse proxy and claims Ontario's child reduction.
 *  Verified programs resolve their own claims separately. Child benefits use family net income. */
export function household(y: YearData, p: Province, hh: Household, peopleIn: Person[] = hh.people) {
  let excessDividendCredits: number[] = [];
  if (peopleIn.some(x => x.gis || x.allowance) && peopleIn.some(x => x.ed > 0 || x.nd > 0)) {
    // OAS Act s.2(d), ITA 126(7): historical federal tax before DTC, FTC and Quebec abatement.
    // The single-year proxy excludes new supplements; actual personal-credit switches don't alter eligibility.
    const proxy = peopleIn.map(({ gis: _gis, allowance: _allowance, ...x }) => x);
    const baseline = calculateHousehold(y, p, { ...hh, useBpa: true }, proxy);
    excessDividendCredits = baseline.list.map(r => Math.max(0, r.fDtcFull - r.fDtc - r.fedBasic));
  }
  return calculateHousehold(y, p, hh, peopleIn, excessDividendCredits);
}

function calculateHousehold(
  y: YearData,
  p: Province,
  hh: Household,
  peopleIn: Person[],
  excessDividendCredits: number[] = [],
) {
  const fed = y.federal,
    qc = p.system === "quebec";
  const { adults, spouse, useBpa } = hh;
  const s = { useBpa, whRate: hh.whRate };
  // A second adult with no income entered is treated as a spouse with no income
  const ppl = peopleIn.length === 1 && adults >= 2 ? [peopleIn[0], blank(0)] : peopleIn;
  validateGisAllowance(fed, ppl);
  const seniorsActive = useBpa && ppl.some(hasSeniorInputs);
  const couple = ppl.length === 2 && spouse;
  // TP-1 line 431 transfers unused credits at any age; it needs no senior-program parameters.
  const quebecTransferActive = useBpa && qc && couple;
  // The proxy historical income uses deductions before this year's supplements. Current T778 selection
  // includes actual calculated supplements; this avoids feeding current receipts back into historical income.
  const proxyChildcare = childcareOf(fed, hh, ppl, p);
  const gisAllowance = gisAllowanceOf(fed, p, ppl, couple, proxyChildcare.claims, excessDividendCredits);
  const supplements = ppl.map((_, i) => {
    const a = gisAllowance?.adults[i];
    return a ? a.gis + a.allowance : 0;
  });
  const childcare = gisAllowance ? childcareOf(fed, hh, ppl, p, supplements) : proxyChildcare;
  const { kids, under6 } = childcare.childCounts ?? hh;
  const netWithSupplements = (x: Person, i: number, claim = childcare.claims[i], recovery?: number) =>
    Math.max(0, netIncomeTotal(netIncomeParts(fed, p, x, claim, recovery, gisAllowance ? supplements[i] : undefined)));
  const nets = ppl.map((x, i) => netWithSupplements(x, i));
  // Legacy bases for claim elections and non-refundable credits, before Quebec's worker deduction.
  const recoveries = ppl.map(
    (x, i) =>
      netIncomeParts(fed, p, x, childcare.claims[i], undefined, gisAllowance ? supplements[i] : undefined).oasRecovery,
  );
  const provincialNets = qc ? ppl.map((x, i) => netWithSupplements(x, i, 0, recoveries[i])) : nets;
  const famNet = couple ? nets[0] + nets[1] : nets[0];
  const provincialFamNet = couple ? provincialNets[0] + provincialNets[1] : provincialNets[0];
  // Wages and net business profit enter working-income components; other income enters family net income only.
  const famEmp = couple ? workingIncomeOf(ppl[0]) + workingIncomeOf(ppl[1]) : workingIncomeOf(ppl[0]);
  const c = ppl.length === 2 && nets[1] > nets[0] ? 1 : 0,
    o = 1 - c;
  const single = ppl.length === 1 && adults === 1;
  const familyRule = p.familyTaxBenefit;
  const familyParams = p.familyTaxBenefit?.params;
  // MB s. 4.6(16.1)(b) requires eligible-individual status at ANY time in the year. MB428-A's birth-year band
  // includes children turning 18, assuming the parent qualified before then; CCB's year-end count excludes them.
  // Use validated age details when available; legacy counts represent qualifying minor children.
  const familyAges =
    hh.childAges ?? (childcare.childCounts ? hh.childcare?.children?.map(child => child.age) : undefined);
  const familyChildren = familyParams
    ? (familyAges?.filter(age => age <= familyParams.childThrough).length ?? kids)
    : 0;
  const familyChildCount = Math.max(0, familyChildren - (single && useBpa && kids > 0 ? 1 : 0));
  const seniorReduction =
    p.seniorCredits && !("program" in p.seniorCredits) ? p.seniorCredits.lowIncomeSenior?.params : undefined;
  // kidsAll: children counted for low-income reductions, other than a child already claimed as an eligible dependant
  const ctx = (i: number): Ctx => ({
    ...(gisAllowance ? { netFederalSupplements: supplements[i] } : {}),
    seniorCount: seniorReduction
      ? (couple ? ppl : [ppl[i]]).filter(x => x.age !== undefined && x.age >= seniorReduction.minimumAge).length
      : 0,
    familyBenefitChildren: familyRule && i === c ? familyChildCount : 0,
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
    const fAmt = Math.max(0, phased(fed.basicPersonalAmount, nets[c]) - nets[o]);
    const rule = p.spouseAmount;
    let pAmt: number, pCredit: number;
    if (rule === "transfer") {
      // Unused BPA is already part of line 430; line 431 transfers it exactly once below.
      pCredit = 0;
      pAmt = 0;
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
      // Schedule B lines 10–18 use TP-1 line 275: deduct line 201, but not federal childcare expenses.
      const livingAloneNet = Math.max(0, provincialNets[0] - workerDeductionOf(p, ppl[0]));
      pAmt = seniorsActive ? 0 : Math.max(0, la.max - la.rate * Math.max(0, livingAloneNet - la.threshold));
      pp = pAmt * prr;
    }
    const r0 = personTax(fed, p, ppl[0], { f, p: pp }, ctx(0), s);
    list = [r0];
    if (f + pp > 0)
      claim = { c: 0, o: null, fAmt, pAmt, qc, kind: kids > 0 ? "dependant" : "alone", saved: r0.fSp * r0.k + r0.pSp };
  } else {
    list = ppl.map((x, i) => personTax(fed, p, x, NOSP, ctx(i), s));
  }
  // Program-specific claimant rules, senior relief and Quebec's general unused-credit transfer.
  const childRule = p.claimants?.childAmount;
  const lowRule = p.claimants?.lowIncomeReduction;
  if (childRule || lowRule || familyRule || seniorsActive || quebecTransferActive) {
    const extras = list.map(r => ({ f: r.fSpFull, p: r.pSpFull }));
    const calculate = (i: number, context: Ctx) => personTax(fed, p, ppl[i], extras[i], context, s);
    const calculateAll = (contexts: Ctx[]) => {
      if (!seniorsActive && !quebecTransferActive) return contexts.map((context, i) => calculate(i, context));
      const seniorContexts = contexts.map(context => {
        context.childTransferBase = 0;
        context.senior = {
          federalTransfer: 0,
          provincialTransfer: 0,
          spouseAgeTransfer: false,
          quebecPoolBase: 0,
          quebecTransfer: 0,
        };
        return context.senior;
      });
      let results = contexts.map((context, i) => calculate(i, context));
      if (seniorsActive && couple) {
        results.forEach((donor, i) => {
          const transfer = seniorTransfer(donor, p, fr);
          const recipient = contexts[1 - i];
          seniorContexts[1 - i].federalTransfer = transfer.federal;
          if (!qc) {
            seniorContexts[1 - i].provincialTransfer = transfer.provincial;
            seniorContexts[1 - i].spouseAgeTransfer = transfer.spouseAge;
            recipient.childTransferBase = transfer.child;
          }
        });
      }
      if (seniorsActive && qc) {
        if (couple) {
          let pool = quebecSeniorPool(
            p,
            ppl,
            results.map(r => r.breakdown.provincialNetIncome ?? r.tiP),
            false,
          );
          results.forEach((r, i) => {
            const claim = Math.min(pool, Math.max(0, r.pr.tax - r.pBpaFull - r.pDtcFull) / prr);
            seniorContexts[i].quebecPoolBase = claim;
            pool -= claim;
          });
          // Retain unused entitlement on one return; line 431 may transfer it only once.
          seniorContexts[0].quebecPoolBase += pool;
        } else {
          results.forEach((r, i) => {
            seniorContexts[i].quebecPoolBase = quebecSeniorPool(
              p,
              [ppl[i]],
              [r.breakdown.provincialNetIncome ?? r.tiP],
              single,
            );
          });
        }
      }
      results = contexts.map((context, i) => calculate(i, context));
      if (quebecTransferActive) {
        results.forEach((donor, i) => {
          seniorContexts[1 - i].quebecTransfer = donor.breakdown.seniorCredits.quebecUnused;
        });
        results = contexts.map((context, i) => calculate(i, context));
      }
      return results;
    };
    let childClaimants = [c];
    if (childRule && p.childAmount && couple) {
      const incomes = childRule.claimant === "lower-taxable-income" ? list.map(r => r.tiP) : nets;
      childClaimants = incomesTied(incomes) ? [0, 1] : [incomes[0] < incomes[1] ? 0 : 1];
    }
    // MB s. 4.6(16.2)(a) is silent on equality. The documented interpretation elects the whole child claim
    // by final household tax, as in #92. On equal incomes, unrelated adults also elect one claimant by
    // agreement under (16.2)(b); otherwise they retain the existing higher-income eligible-parent proxy.
    const familyClaimants = familyRule && ppl.length === 2 && incomesTied(nets) ? [0, 1] : [c];
    const elections = childClaimants.flatMap(child => familyClaimants.map(family => ({ child, family })));
    list = bestElection(
      elections.map(({ child: childClaimant, family: familyClaimant }) => {
        const contexts = ppl.map((_, i) => ctx(i));
        if (familyRule)
          contexts.forEach((context, i) => {
            context.familyBenefitChildren = i === familyClaimant ? familyChildCount : 0;
          });
        if (childRule && p.childAmount && couple) {
          const base = p.childAmount.perChild * (p.childAmount.ages === "all" ? kids : under6);
          contexts.forEach((context, i) => {
            context.childAmountBase = i === childClaimant ? base : 0;
          });
          if (childRule.transfer !== "none" && !seniorsActive) {
            const donor = calculate(childClaimant, contexts[childClaimant]);
            contexts[1 - childClaimant].childTransferBase = unusedSpouseTransferBase(donor, base, prr);
          }
        }
        if (!lowRule || !couple) return calculateAll(contexts);
        // A child election on tied income can change the best family reduction election. Evaluate both
        // together using final tax after both FTC and the form-ordered reduction.
        return bestElection(
          [c, o].map(initial => {
            const allocated = contexts.map((context, i) => ({
              ...context,
              claims: i === initial,
              kidsAll: i === initial ? kids : 0,
            }));
            const results = calculateAll(allocated);
            if (lowRule.transferUnused) {
              allocated[1 - initial].lowIncomeReduction = results[initial].breakdown.lowIncomeReduction.unused;
              results[1 - initial] = calculate(1 - initial, allocated[1 - initial]);
            }
            return results;
          }),
        );
      }),
    );
    if (claim)
      // Quebec's general transfer is applied outside pSp and may flow in either direction.
      claim.saved =
        list[claim.c].fSp * list[claim.c].k +
        list[claim.provincialClaimant ?? claim.c].pSp +
        list.reduce((saved, r) => saved + r.breakdown.seniorCredits.quebecTransferApplied, 0);
  }
  const totals = addUp(list);
  const householdPremium = householdPremiumOf(p, nets, couple, kids, childcare.claims);
  totals.payroll += householdPremium?.total ?? 0;
  totals.total += householdPremium?.total ?? 0;
  const ccb = ccbOf(fed, famNet, kids, under6);
  const incomeBases = {
    beforeChildcare: ppl.map((x, i) => netIncomeTotal(netIncomeParts(fed, p, x, 0, recoveries[i])) + supplements[i]),
    beforeChildcareAndRecovery: ppl.map((x, i) => netIncomeTotal(netIncomeParts(fed, p, x, 0, 0)) + supplements[i]),
    federal: nets,
    provincial: list.map(r => r.breakdown.provincialNetIncome ?? r.tiP),
    provincialFamily: couple
      ? (list[0].breakdown.provincialNetIncome ?? list[0].tiP) + (list[1].breakdown.provincialNetIncome ?? list[1].tiP)
      : (list[0].breakdown.provincialNetIncome ?? list[0].tiP),
  };
  // Quebec line 275 includes supplements before line 295's taxable-income deduction; the worker deduction
  // is included and federal childcare excluded. Other provinces retain federal family net income.
  // Keep this separate from the legacy non-refundable-credit bases above and federal CCB/GST/CWB below.
  const benefitFamNet = qc ? incomeBases.provincialFamily : famNet;
  const provBen = provincialChildBenefit(p.childBenefit, benefitFamNet, famEmp, kids, single, under6);
  const childBen = ccb + provBen;
  const childcareCredit = childcareCreditOf(
    p,
    hh,
    childcare,
    incomeBases.beforeChildcareAndRecovery,
    incomeBases.provincialFamily,
    list.map(r => r.breakdown.childcareCredit.applied),
  );
  // Refundable credits (counted only when the credits switch is on)
  const credits: Credit[] = hh.useCredits
    ? creditsOf(fed, p, {
        famNet,
        provincialFamNet: benefitFamNet,
        famEmp,
        couple,
        kids,
        ppl,
        federalNets: nets,
        propTax: propertyTax(p, hh),
        rent: hh.homeValue > 0 ? 0 : hh.rent * 12,
      })
    : [];
  if (childcareCredit?.refundable && childcareCredit.applied > 0)
    credits.push([childcareCredit.name, childcareCredit.applied]);
  const refund = credits.reduce((a, [, v]) => a + v, 0);
  const benefits = childBen + refund + (gisAllowance?.total ?? 0);
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
      ...(gisAllowance ? { gisAllowance } : {}),
      ...householdBreakdown(list),
      incomeBases,
      childcareCredit,
      householdPremium,
      // Preserve the original subtraction order for marginal rates when the contribution is unchanged.
      netTotalBeforeHealthServicesFund:
        list.reduce((sum, r) => sum + r.breakdown.totalBeforeHealthServicesFund, 0) +
        (householdPremium?.total ?? 0) -
        benefits,
    }, // nested so the golden snapshot keeps its format (see personTax)
  };
}

export const propertyRate = (p: Province, hh: Household) => hh.propertyRates?.[p.code] ?? p.propertyTax.rate;

/** A supplied owner's bill replaces the estimate in this province, including for occupancy-based credits. */
export function propertyTax(p: Province, hh: Household): number {
  const bill = hh.propertyTaxBills?.[p.code];
  return typeof bill === "number" && Number.isFinite(bill) && bill >= 0 ? bill : hh.homeValue * propertyRate(p, hh);
}

type MarginalIncome = IncomeKey | "selfEmployment";
const bump = (x: Person, key: MarginalIncome, d: number): Person => ({ ...x, [key]: (x[key] ?? 0) + d });
const zeroInv = (x: Person): Person => ({ ...x, cg: 0, ed: 0, nd: 0, fd: 0 });
export const hasInv = (x: Person) => x.cg !== 0 || x.ed > 0 || x.nd > 0 || x.fd > 0;

/** Full result for one province: household tax plus marginal rates, investment tax, sales, property and fuel tax. */
export function compute(y: YearData, p: Province, hh: Household) {
  const h = household(y, p, hh);
  // Subtract the contribution separately: a constant charge must not perturb an unrelated marginal rate's
  // fourth-decimal rounding through cancellation of larger household totals.
  const netChange = (a: typeof h, b: typeof h) =>
    a.breakdown.netTotalBeforeHealthServicesFund -
    b.breakdown.netTotalBeforeHealthServicesFund +
    (a.breakdown.healthServicesFund - b.breakdown.healthServicesFund);
  // Explicit eligible childcare earnings stay fixed in counterfactuals; other income never creates earnings.
  // Claimant selection is recomputed for each counterfactual; investment bumps never create earned income.
  // Marginal rates measured directly (next $100 of each type for the selected person), so phase-outs,
  // payroll ceilings, benefit clawbacks and spouse-amount interactions all show up.
  const margOf = (key: MarginalIncome) =>
    netChange(
      household(
        y,
        p,
        hh,
        hh.people.map((x, i) => (i === hh.active ? bump(x, key, 100) : x)),
      ),
      h,
    ) / 100;
  const margBy = {} as Record<MarginalKey, number>;
  for (const key of MARGINAL_KEYS) margBy[key] = margOf(key);
  // Investment income: capital gains and dividends. Other income (interest, rental and other) isn't part of it.
  const hasAnyInv = hh.people.some(hasInv);
  const invAmt = hh.people.reduce((a, x) => a + x.cg + x.ed + x.nd + x.fd, 0);
  const invTax = hasAnyInv ? netChange(h, household(y, p, hh, hh.people.map(zeroInv))) : 0;
  // Sales, property and fuel tax sit on top; they don't change marginal rates.
  const salesRate = p.salesTax.rate;
  const sales = hh.monthlySpending * 12 * salesRate;
  const propRate = propertyRate(p, hh);
  const property = propertyTax(p, hh);
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
    // left: income after every tax, benefits and credits added. margOther: the marginal rate on the next dollar of
    // other income, measured like margBy (which the golden snapshot locks, so it can't take a new key).
    breakdown: {
      ...h.breakdown,
      left: h.cash - total,
      margOther: margOf("oth"),
      ...(hh.people[hh.active]?.selfEmployment !== undefined
        ? {
            margSelfEmployment:
              p.system !== "quebec" &&
              hh.people[hh.active].ord === 0 &&
              hh.people[hh.active].employeePayroll?.cppElection
                ? null
                : margOf("selfEmployment"),
          }
        : {}),
    },
  };
}

export type Result = ReturnType<typeof compute>;

/** Results for every province and territory, in west-to-east order. */
export function computeAll(y: YearData, hh: Household) {
  return y.provinces.map(p => ({ p, r: compute(y, p, hh) }));
}
