// Income tax and payroll for one person in one province.
import type { Federal, LowIncomeProgram, Province } from "../data/schema.ts";
import { phased, walk } from "./brackets.ts";
import { healthServicesFund, healthServicesIncome } from "./health-services-fund.ts";
import { healthPremium, netIncomeParts, netOf, payrollOf, rrspRoom } from "./payroll.ts";
import type { Ctx, Extra, Person } from "./types.ts";

export interface Settings {
  useBpa: boolean;
  whRate: number;
}

/** Provincial low-income tax reductions. ni = own net income, fn = family net income, fam = has a spouse or
 *  eligible dependant, k = children counted. */
function lowIncomeReduction(li: LowIncomeProgram, ni: number, fn: number, fam: boolean, k: number): number {
  switch (li.program) {
    case "nl-low-income-reduction": {
      const q = li.params;
      return fam
        ? Math.max(0, q.individual + q.family - q.rate * Math.max(0, fn - q.thresholdFamily))
        : Math.max(0, q.individual - q.rate * Math.max(0, ni - q.thresholdIndividual));
    }
    case "nb-low-income-reduction": {
      const q = li.params;
      return Math.max(0, q.amount * (fam ? 2 : 1) - q.rate * Math.max(0, fn - q.threshold));
    }
    case "family-low-income-reduction": {
      const q = li.params;
      return Math.max(0, q.individual + (fam ? q.spouse : 0) + q.child * k - q.rate * Math.max(0, fn - q.threshold));
    }
  }
}

/** Basic personal amount for a province at a given net income. */
export function provincialBpa(fed: Federal, p: Province, ti: number): number {
  return p.basicPersonalAmount === "federal" ? phased(fed.basicPersonalAmount, ti) : phased(p.basicPersonalAmount, ti);
}

export type PersonResult = ReturnType<typeof personTax>;

/** sp = extra credits in tax dollars (spouse / eligible dependant / Quebec living-alone amounts).
 *  ctx = {kids: children this person claims, famNet: family net income, ...} */
export function personTax(fed: Federal, p: Province, x: Person, sp: Extra, ctx: Ctx, s: Settings) {
  const qc = p.system === "quebec";
  const pay = payrollOf(fed, p, x);
  const ti = netOf(fed, p, x, ctx.childcareDeduction); // taxable income (federal)
  const workerDed = p.quebec
    ? Math.min(p.quebec.workerDeduction.max, Math.max(0, x.ord) * p.quebec.workerDeduction.rate)
    : 0;
  const provincialNet = qc ? netOf(fed, p, x) : ti; // Quebec does not deduct federal childcare expenses
  const tiP = Math.max(0, provincialNet - workerDed); // Quebec allows an extra deduction for workers
  const cash = x.ord + (x.oth ?? 0) + x.cg + x.ed + x.nd + x.fd;
  const f = walk(fed.brackets, ti),
    pr = walk(p.brackets, tiP);
  const k = qc ? 1 - fed.quebecAbatement : 1;
  const fr = fed.brackets[0][1],
    prr = p.brackets[0][1];
  const fAmt = s.useBpa ? phased(fed.basicPersonalAmount, ti) : 0,
    pAmt = s.useBpa ? provincialBpa(fed, p, provincialNet) : 0;
  const fBpaFull = fAmt * fr,
    pBpaFull = pAmt * prr;
  // Non-refundable credits, applied in order; together they can bring tax to zero, never below.
  let fLeft = f.tax,
    pLeft = pr.tax;
  const tf = (a: number) => {
    const v = Math.min(fLeft, Math.max(0, a));
    fLeft -= v;
    return v;
  };
  const tp = (a: number) => {
    const v = Math.min(pLeft, Math.max(0, a));
    pLeft -= v;
    return v;
  };
  const empAmt = Math.min(Math.max(0, x.ord), fed.employmentAmount);
  const fEmpFull = (empAmt + pay.base + pay.ei + pay.qpip) * fr;
  const pEmpFull = qc ? 0 : (pay.base + pay.ei + (p.employmentAmountCredit ? empAmt : 0)) * prr;
  const fCred = tf(fBpaFull),
    fSp = tf(sp.f),
    fEmp = tf(fEmpFull);
  const pCred = tp(pBpaFull),
    pSp = tp(sp.p),
    pEmp = tp(pEmpFull);
  // Provincial child amounts, with the program's claimant supplied by the household allocation.
  const ca = p.childAmount;
  const kidAmt = ctx.childAmountBase ?? (ca ? ca.perChild * ((ca.ages === "all" ? ctx.kids : ctx.u6) || 0) : 0);
  const ownChild = tp(kidAmt * prr);
  const childTransfer = tp((ctx.childTransferBase ?? 0) * prr);
  // Keep the existing display subtotal complete; the nested breakdown identifies the transferred share.
  const pKid = ownChild + childTransfer;
  // NL428 line 58320 joins the ordinary non-refundable credit base, before dividends and low-income reduction.
  const childcareCreditFull = p.childcareCredit?.program === "nl-childcare" ? (ctx.childcareDeduction ?? 0) * prr : 0;
  const childcareCredit = tp(childcareCreditFull);
  // MB428-A lines 1–3 and 9–12; MB428 line 41 joins the ordinary credit base (lines 51–57), before the
  // dividend credit (62) and FTC (73). A claimed spouse/dependant base qualifies even if its usable tax is zero.
  // #17 must add own-age and transfer-qualified spouse-age bases BEFORE this single income reduction.
  // Spouse age alone cannot qualify: the guide requires a claimed age transfer AND MB(S2) line 1 > line 11.
  // Disability claims cannot be inferred from childcare disability flags.
  const family = p.familyTaxBenefit?.params;
  const familyBase =
    family && s.useBpa
      ? Math.max(
          0,
          family.basic +
            (sp.p > 0 ? family.dependant : 0) +
            family.child * (ctx.familyBenefitChildren ?? 0) -
            family.reductionRate * provincialNet,
        )
      : 0;
  const familyFull = familyBase * prr;
  const familyApplied = tp(familyFull);
  const inv = fed.investment;
  const fDtcFull =
    x.ed * inv.grossUp.eligible * inv.dividendTaxCredit.eligible +
    x.nd * inv.grossUp.nonEligible * inv.dividendTaxCredit.nonEligible;
  const pDtcFull =
    x.ed * inv.grossUp.eligible * p.dividendTaxCredit.eligible +
    x.nd * inv.grossUp.nonEligible * p.dividendTaxCredit.nonEligible;
  const fDtc = tf(fDtcFull);
  // Surtax (Ontario) is charged on provincial tax after non-refundable credits but BEFORE the dividend tax
  // credit (form ON428), which is why it raises Ontario's top dividend rates.
  let surtax = 0,
    onRed = 0,
    lift = 0,
    bcRed = 0;
  if (p.surtax) {
    const base = pLeft;
    surtax = p.surtax.reduce((a, [thr, r]) => a + r * Math.max(0, base - thr), 0);
    pLeft += surtax;
  }
  const pDtc = tp(pDtcFull);
  // Historical PE428 adds surtax after the dividend credit, before the low-income reduction.
  if (p.postDividendSurtax) {
    const q = p.postDividendSurtax.params;
    const extra = q.rate * Math.max(0, pLeft - q.threshold);
    surtax += extra;
    pLeft += extra;
  }
  // Low-income tax reductions (claimed once per family, by the claimant). "fam" = spouse or eligible dependant.
  const lowRule = p.claimants?.lowIncomeReduction;
  const lowFull =
    lowRule && p.lowIncomeReduction
      ? (ctx.lowIncomeReduction ??
        (ctx.claims ? lowIncomeReduction(p.lowIncomeReduction, ti, ctx.famNet ?? ti, !!ctx.fam, ctx.kidsAll || 0) : 0))
      : 0;
  let lowRed = 0;
  if (ctx.claims && p.lowIncomeReduction && !lowRule)
    lowRed = tp(lowIncomeReduction(p.lowIncomeReduction, ti, ctx.famNet ?? ti, !!ctx.fam, ctx.kidsAll || 0));
  // PE428 lines 66/87 reduce tax before FTC; unused reduction is measured against line 65.
  if (lowRule?.order === "before-foreign-tax-credit") lowRed = tp(lowFull);
  let provPre = pLeft;
  // Ontario: the Ontario tax reduction, then the LIFT credit
  if (p.ontarioTaxReduction) {
    const q = p.ontarioTaxReduction;
    onRed = Math.min(provPre, Math.max(0, 2 * (q.base + q.perChild * (ctx.kids || 0)) - provPre));
    provPre -= onRed;
  }
  if (p.lift) {
    const q = p.lift;
    const liftFull = Math.min(q.max, q.rate * Math.max(0, x.ord)); // earned on employment income, reduced on net
    const liftCut = q.phaseOut * Math.max(0, ti - q.threshold, (ctx.famNet ?? ti) - q.familyThreshold);
    lift = Math.min(provPre, Math.max(0, liftFull - liftCut));
    provPre -= lift;
  }
  if (p.bcTaxReduction) {
    const q = p.bcTaxReduction;
    bcRed = Math.min(provPre, Math.max(0, q.max - q.rate * Math.max(0, ti - q.threshold)));
    provPre -= bcRed;
  }
  // Foreign tax credit: federal first, limited to basic federal tax × the foreign share of net income (the Quebec
  // abatement is a separate 16.5% of basic federal tax and doesn't reduce that limit), then provincial.
  const wh = x.fd * s.whRate,
    share = ti > 0 ? x.fd / ti : 0;
  const fedBasic = fLeft;
  const fFtc = Math.min(wh, fedBasic * share, fedBasic * k);
  const provincialShare = provincialNet > 0 ? x.fd / provincialNet : 0;
  // T2036 line 5 also caps the credit at tax otherwise payable when foreign income exceeds net income.
  const pFtc = Math.min(wh - fFtc, provPre * provincialShare, provPre);
  // NB/NL/NS apply reductions after FTC. Allocation changes the amount, never the form's order.
  const afterForeign = lowRule?.order === "after-foreign-tax-credit";
  if (afterForeign) lowRed = Math.min(provPre - pFtc, lowFull);
  // NL428 adds the temporary deficit levy after all credits, including the provincial foreign tax credit.
  const levyBand = p.additionalTax?.params.bands.findLast(([from]) => tiP > from);
  const provincialLevy = levyBand ? Math.min(levyBand[3], levyBand[1] + levyBand[2] * (tiP - levyBand[0])) : 0;
  const fedTax = fedBasic * k - fFtc,
    prov = provPre - pFtc - (afterForeign ? lowRed : 0) + provincialLevy;
  const ohp = healthPremium(p, ti);
  const healthFund = healthServicesFund(p, healthServicesIncome(fed, x));
  // TP-1 line 446 joins contributions after income tax/credits (432), once, in the page's payroll subtotal.
  const employmentAndHealthPremiums = pay.base + pay.enh + pay.ei + pay.qpip + pay.terr + ohp;
  const payroll = employmentAndHealthPremiums + healthFund.contribution;
  const totalBeforeHealthServicesFund = fedTax + prov + wh + employmentAndHealthPremiums;
  const ftc = fFtc + pFtc;
  return {
    x,
    ti,
    tiP,
    workerDed,
    cash,
    f,
    pr,
    k,
    fAmt,
    pAmt,
    fBpaFull,
    pBpaFull,
    fCred,
    pCred,
    fSp,
    pSp,
    fSpFull: sp.f,
    pSpFull: sp.p,
    fEmp,
    pEmp,
    fEmpFull,
    pEmpFull,
    empAmt,
    fDtc,
    pDtc,
    fDtcFull,
    pDtcFull,
    pKid,
    kidAmt,
    lowRed,
    surtax,
    onRed,
    lift,
    bcRed,
    wh,
    fFtc,
    pFtc,
    fedBasic,
    fed: fedTax,
    prov,
    pay,
    ohp,
    payroll,
    total: fedTax + prov + wh + payroll,
    // Figures the page shows that aren't steps of the calculation above. They sit in a nested object because the
    // golden snapshot (tests/golden/snapshot.mjs) locks every top-level number of this result.
    breakdown: {
      healthServicesFund: healthFund,
      totalBeforeHealthServicesFund,
      familyTaxBenefit: { base: familyBase, calculated: familyFull, applied: familyApplied },
      childTransfer: { base: ctx.childTransferBase ?? 0, applied: childTransfer },
      lowIncomeReduction: {
        calculated: p.claimants?.lowIncomeReduction ? lowFull : lowRed,
        unused: p.claimants?.lowIncomeReduction ? lowFull - lowRed : 0,
      },
      provincialLevy,
      childcareCredit: { calculated: childcareCreditFull, applied: childcareCredit },
      netIncome: netIncomeParts(fed, p, x, ctx.childcareDeduction), // what net income is made of
      rrspRoom: rrspRoom(fed, x),
      quebecAbatement: fedBasic * (1 - k), // the share of basic federal tax that Quebec residents don't pay federally
      ftc, // foreign tax credit, federal and provincial
      whUncredited: wh - ftc, // foreign tax withheld that no credit gives back
    },
  };
}
