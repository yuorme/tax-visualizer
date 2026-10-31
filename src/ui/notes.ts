// Page text that quotes the year's figures: the methodology notes in the footer and the info tooltips.
// Every amount, rate and threshold here is read from the year's data, so the text can't drift from the numbers
// the engine uses. This module only formats values; it never works out anyone's tax. No DOM access, so the
// tests can render it in Node.
import type { ChildBenefitProgram, CreditProgram, PhasedAmount, Province, YearData } from "../data/schema.ts";

/** Values the page itself sets, rather than the year's data. */
export interface PageDefaults {
  /** Starting employment income for each person. */
  defaultIncome: number;
  /** Starting monthly taxable spending for a household of n people. */
  spendEst: (people: number) => number;
}

// ---------- Formatting ----------
export const money = (n: number) => `$${Math.round(n).toLocaleString("en-CA")}`;
/** A rate with up to two decimals and no trailing zeros: 14%, 20.5%, 4.95%. */
export const rate = (r: number) => `${+(r * 100).toFixed(2)}%`;
/** A rate with a fixed number of decimals: 5.30%, 1.0%. */
const fixed = (r: number, d: number) => `${(r * 100).toFixed(d)}%`;
/** "a and b", "a, b and c" */
const list = (xs: string[]) => (xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs.at(-1)}`);
/** Joins clauses that are sentences in their own right: "a, and b". */
const clauses = (xs: string[]) => (xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")}, and ${xs.at(-1)}`);
/** A share of something in words where there's a common one: "half", otherwise "40%". */
export const share = (r: number) => (r === 0.5 ? "half" : rate(r));
const NUMBER_WORDS = ["zero", "one", "two", "three", "four", "five", "six"];
/** [single, family] pair: "$3,000" when both are the same, "$27,392 or $31,251" otherwise. */
const either = (p: readonly [number, number], f: (n: number) => string) =>
  p[0] === p[1] ? f(p[0]) : `${f(p[0])} or ${f(p[1])}`;

// ---------- Looking things up ----------
const short = (p: Province) => p.shortName ?? p.name;
const byName = (a: Province, b: Province) => a.name.localeCompare(b.name);
/** Names in running text: "the Northwest Territories", "Nunavut". */
const article = (name: string) => (/Territories$/.test(name) ? `the ${name}` : name);
/** Province names for running text, alphabetical; all the territories together read as "the territories". */
function places(y: YearData, ps: Province[]): string {
  const terr = y.provinces.filter(p => p.territory);
  const allTerr = terr.length > 1 && terr.every(t => ps.includes(t));
  const names = ps
    .filter(p => !(allTerr && p.territory))
    .sort(byName)
    .map(p => article(short(p)));
  return list(allTerr ? [...names, "the territories"] : names);
}
/** Groups provinces by a value, keeping the groups in order of first appearance. */
function groupBy<K>(ps: Province[], key: (p: Province) => K): [K, Province[]][] {
  const m = new Map<K, Province[]>();
  for (const p of ps) m.set(key(p), [...(m.get(key(p)) ?? []), p]);
  return [...m];
}
function need<T>(v: T | undefined | null, what: string): T {
  if (v == null) throw new Error(`page notes: the year's data has no ${what}`);
  return v;
}

function lookup(y: YearData) {
  const prov = (code: string) =>
    need(
      y.provinces.find(p => p.code === code),
      `province ${code}`,
    );
  const childBenefit = <Id extends ChildBenefitProgram["program"]>(code: string, id: Id) => {
    const b = prov(code).childBenefit;
    if (b?.program !== id) throw new Error(`page notes: ${code} child benefit is not ${id}`);
    return b as Extract<ChildBenefitProgram, { program: Id }>;
  };
  const credit = <Id extends CreditProgram["program"]>(code: string, id: Id) =>
    need(
      prov(code).credits?.find(c => c.program === id) as Extract<CreditProgram, { program: Id }> | undefined,
      `${code} ${id} credit`,
    );
  const quebec = need(
    y.provinces.find(p => p.system === "quebec"),
    "Quebec-system province",
  );
  return { prov, childBenefit, credit, quebec };
}

/** The provincial basic personal amount before any phase-out. */
const provincialBpa = (y: YearData, p: Province) => {
  const a = p.basicPersonalAmount;
  return a === "federal" ? y.federal.basicPersonalAmount.max : typeof a === "number" ? a : a.max;
};
const isPhased = (a: Province["basicPersonalAmount"]): a is PhasedAmount => typeof a === "object";
/** Benefit amounts run July to June, starting in the tax year. */
const benefitYear = (y: YearData) => `July ${y.year} to June ${y.year + 1}`;

// ---------- Tooltips ----------
/** Tooltip text by key; the page's info buttons name their key in data-note. */
export function tooltips(y: YearData): Record<string, string> {
  const F = y.federal,
    inv = F.investment;
  const ext = <T>(items: T[], val: (x: T) => number) => {
    const vals = items.map(val);
    const lo = Math.min(...vals),
      hi = Math.max(...vals);
    return { lo, hi, atLo: items.filter(x => val(x) === lo), atHi: items.filter(x => val(x) === hi) };
  };
  const bpa = ext(y.provinces, p => provincialBpa(y, p));
  const sales = ext(y.provinces, p => p.salesTax.rate);
  const published = y.provinces.filter(p => !p.propertyTax.estimated);
  const prop = ext(published, p => p.propertyTax.rate);
  const city = (ps: Province[]) => list(ps.map(p => p.propertyTax.city));
  return {
    deductions: `Amounts subtracted from your income before tax is worked out: RRSP and FHSA contributions, union and professional dues, childcare expenses, deductible support payments, moving expenses and similar. Max RRSP fills in ${rate(F.rrsp.rate)} of employment income, up to the ${y.year} limit of ${money(F.rrsp.limit)}. Your actual room is ${rate(F.rrsp.rate)} of last year's earned income, less any pension adjustment, plus unused room carried forward; it's on your notice of assessment.`,
    bpa: `Every taxpayer gets a non-refundable credit on a basic amount of income: ${money(F.basicPersonalAmount.max)} federally in ${y.year}, plus a provincial amount from ${money(bpa.lo)} in ${places(y, bpa.atLo)} to ${money(bpa.hi)} in ${places(y, bpa.atHi)}. Switch off to see bracket rates alone.`,
    spending: `Your household's monthly spending on things sales tax applies to, before tax. A quick estimate: your average monthly credit card and debit spending, minus groceries, prescriptions and healthcare. Usually exempt across Canada: basic groceries, rent and mortgage payments, prescription drugs, most medical and dental care, insurance premiums and banking fees, childcare, tuition, and public transit. Usually taxed: restaurant meals and takeout, alcohol, clothing, electronics, furniture and household goods, gas, utilities, phone and internet, vehicles and repairs, travel, and most services. ${y.year} rates run from ${sales.atLo[0].salesTax.label} in ${places(y, sales.atLo)} to ${sales.atHi[0].salesTax.label} in ${places(y, sales.atHi)}. The starting amount is a rough estimate for a household with the adults and children set here; adjust it to match your own spending.`,
    children: `Children under 18. They raise the spending estimate and add child benefits: the Canada Child Benefit plus your province's benefit (every province and territory with one), using ${benefitYear(y)} amounts. Benefits are netted off the tax shown. Once you have at least one child, drag the small slate handle on the same track to say how many are under 6, since they get a higher CCB.`,
    property: `Annual property tax = home value × municipal rate. Each province uses the typical ${y.year} residential rate in its largest city, from ${fixed(prop.lo, 2)} in ${city(prop.atLo)} to ${fixed(prop.hi, 2)} in ${city(prop.atHi)}${published.length < y.provinces.length ? "; territorial rates are rough estimates" : ""}. Editing the rate changes your home province only. The same home value is used everywhere, though home prices differ a lot between cities. Renters pay property tax indirectly through rent, which isn't counted here.`,
    credits: `Credits paid to lower- and modest-income households, worked out from the income and household above: the Canada Groceries and Essentials Benefit (formerly the GST/HST credit), the Canada Workers Benefit, and your province's credits, such as the Ontario Trillium Benefit, Quebec's solidarity credit and work premium, and the low-income credits in Saskatchewan, New Brunswick, Nova Scotia, PEI and Newfoundland and Labrador. Amounts are for ${benefitYear(y)} (the ${y.year} tax year for the Workers Benefit). They're netted off the tax shown, together with child benefits.`,
    capitalGains: `Profit from selling investments for more than you paid (their adjusted cost base), minus losses on anything sold at a loss during the year. Only ${rate(inv.capitalGainsInclusion)} of a net gain is taxable. A net loss doesn't reduce other income this year, but it can be carried back 3 years or forward indefinitely against future gains. Double-click the amount or slider to reset to 0.`,
    eligibleDividends: `Dividends from Canadian public companies, and from private corporations paying out income taxed at the general corporate rate. Most dividends from Canadian stocks and Canadian equity ETFs are eligible. They're grossed up by ${rate(inv.grossUp.eligible - 1)} and earn the enhanced dividend tax credit, so they're taxed well below salary.`,
    nonEligibleDividends: `Dividends paid from corporate income taxed at the small business rate, usually from a small private corporation you own. They're grossed up by ${rate(inv.grossUp.nonEligible - 1)} and earn a smaller dividend tax credit than eligible dividends.`,
    foreignDividends: `Dividends from non-Canadian companies, such as U.S. stocks. They get no gross-up or dividend tax credit, so they're taxed like salary. The other country usually withholds tax first (${rate(inv.foreignWithholding.usTreaty)} for the U.S. under the tax treaty), which you mostly recover as a foreign tax credit.`,
  };
}

// ---------- Footer notes ----------
/** The methodology notes, as HTML paragraphs. */
export function footerNotes(y: YearData, page: PageDefaults): string {
  const F = y.federal,
    { prov, childBenefit, credit, quebec } = lookup(y),
    year = y.year;
  const P = y.provinces; // west to east
  const para = (title: string, body: string) => `<p><b>${title}.</b> ${body}</p>`;
  const phase = (a: PhasedAmount) => `between ${money(a.from)} and ${money(a.to)}`;

  // Phase-outs
  const mirrors = P.filter(p => p.basicPersonalAmount === "federal").map(p => `${short(p)}'s`);
  const phased = P.flatMap(p => {
    const a = p.basicPersonalAmount;
    if (!isPhased(a)) return [];
    const what =
      a.min === 0 ? `${money(a.max)} phases out to zero` : `amount drops from ${money(a.max)} to ${money(a.min)}`;
    return [`${short(p)}'s ${what} ${phase(a)}.`];
  });
  const fb = F.basicPersonalAmount;
  const phaseOuts = [
    `The federal amount${mirrors.length ? ` (and ${list(mirrors)}, which ${mirrors.length > 1 ? "mirror" : "mirrors"} it)` : ""} drops from ${money(fb.max)} to ${money(fb.min)} ${phase(fb)}.`,
    ...phased,
    "Phase-outs are based on net income.",
  ].join(" ");

  // Income tax details
  const on = prov("ON"),
    bc = prov("BC");
  const surtax = need(on.surtax, "Ontario surtax").map(([t, r], i) =>
    i === 0 ? `${rate(r)} of ${on.name} tax over ${money(t)}` : `${rate(r)} over ${money(t)}`,
  );
  const onRed = need(on.ontarioTaxReduction, "Ontario tax reduction"),
    lift = need(on.lift, "LIFT credit"),
    bcRed = need(bc.bcTaxReduction, "BC tax reduction");
  const wd = need(quebec.quebec, "Quebec settings").workerDeduction;
  const empAlso = P.filter(p => p.employmentAmountCredit).map(short);
  const lowIncome = P.filter(p => p.lowIncomeReduction)
    .sort(byName)
    .map(short);
  const nb = prov("NB"),
    nl = prov("NL");
  const indexed = [
    nb.lowIncomeReduction?.estimated && `${nb.name}'s`,
    nl.lowIncomeReduction?.estimated && `${nl.name}'s family threshold`,
  ].filter(x => typeof x === "string");
  const lastYearIndexed = `${year - 1} figures indexed by ${rate(F.indexation)}`;
  const kidPhrases = [
    ...P.filter(p => p.childAmount?.ages === "all").map(
      p => `${short(p)}'s child amount (${money(need(p.childAmount, "child amount").perChild)} per child)`,
    ),
    ...groupBy(
      P.filter(p => p.childAmount?.ages === "under6").sort(byName),
      p => need(p.childAmount, "child amount").perChild,
    ).map(
      ([amt, ps]) =>
        `the ${list(ps.map(short))} credit${ps.length > 1 ? "s" : ""} for children under 6 (${money(amt)} per child)`,
    ),
  ];
  const frozen = P.filter(p => p.bracketsFrozenSince != null).map(p => {
    const since = need(p.bracketsFrozenSince, "freeze year");
    const years = Array.from({ length: year - since + 1 }, (_, i) => String(since + i));
    const limits = p.brackets.filter(([hi]) => hi !== Infinity).map(([hi]) => money(hi));
    return `${p.name}'s brackets are frozen at ${list(limits)}; CRA's ${year} rate page shows indexed thresholds, but ${p.name}'s ${list(years)} ${years.length > 1 ? "budgets keep" : "budget keeps"} them unindexed.`;
  });
  const incomeTax = [
    `Each person gets the Canada employment amount (${money(F.employmentAmount)}${empAlso.length ? `, also in ${list(empAlso)}` : ""}) and credits for base CPP/QPP contributions and EI/QPIP premiums, federally and in every province except ${quebec.name}, which instead allows a deduction for workers (${rate(wd.rate)} of employment income, up to ${money(wd.max)}).`,
    "Enhanced CPP/QPP contributions are deducted from income.",
    `Ontario adds its surtax (${list(surtax)}), the Ontario tax reduction (${money(onRed.base)} plus ${money(onRed.perChild)} per child) and the LIFT credit (up to ${money(lift.max)}).`,
    // The reduction is gone once net income passes the threshold by max ÷ rate.
    `BC applies its tax reduction (up to ${money(bcRed.max)}, phased out between ${money(bcRed.threshold)} and ${money(bcRed.threshold + bcRed.max / bcRed.rate)} of net income).`,
    `Low-income tax reductions are applied in ${list(lowIncome)}${indexed.length ? ` (${list(indexed)} ${indexed.length > 1 ? "are" : "is"} ${lastYearIndexed})` : ""}.`,
    kidPhrases.length ? `${list(kidPhrases)} are claimed by the parent who claims the children.` : "",
    "A single parent claims the eligible dependant amount; in Quebec a single adult gets the amount for a person living alone.",
    ...frozen,
  ]
    .filter(Boolean)
    .join(" ");

  // Payroll
  const { cpp, qpp, ei, qpip } = F.payroll;
  const sameEnhanced =
    qpp.enh1 === cpp.enh1 &&
    qpp.enh2 === cpp.enh2 &&
    qpp.exempt === cpp.exempt &&
    qpp.ympe === cpp.ympe &&
    qpp.yampe === cpp.yampe;
  const premium = P.filter(p => p.payroll?.healthPremium).map(
    p =>
      `${p.name} adds its Health Premium (up to ${money(Math.max(...need(p.payroll?.healthPremium, "health premium").map(b => b[3])))}, based on taxable income)`,
  );
  const terrTax = groupBy(P.filter(p => p.payroll?.employeeTax).sort(byName), p => p.payroll?.employeeTax ?? 0).map(
    ([r, ps]) => `${list(ps.map(p => article(short(p))))} withhold${ps.length > 1 ? "" : "s"} a ${rate(r)} payroll tax`,
  );
  const payroll = [
    `CPP: ${fixed(cpp.base, 2)} base plus ${rate(cpp.enh1)} enhanced on earnings between ${money(cpp.exempt)} and ${money(cpp.ympe)}, and ${rate(cpp.enh2)} on earnings up to ${money(cpp.yampe)}.`,
    `Quebec's QPP is ${fixed(qpp.base, 2)} base plus ${sameEnhanced ? "the same enhanced rates" : `${rate(qpp.enh1)} enhanced on earnings between ${money(qpp.exempt)} and ${money(qpp.ympe)}, and ${rate(qpp.enh2)} on earnings up to ${money(qpp.yampe)}`}.`,
    `EI: ${fixed(ei.rate, 2)} of earnings up to ${money(ei.maxInsurable)}, or ${fixed(ei.quebecRate, 2)} in Quebec, where QPIP adds ${fixed(qpip.rate, 2)} up to ${money(qpip.maxInsurable)}.`,
    `${clauses([...premium, ...terrTax])}.`,
    "Employment and other income is treated as employment income.",
  ].join(" ");

  // Child benefits
  const ccb = F.childBenefit;
  const ocb = childBenefit("ON", "ontario-child-benefit").params;
  const qfa = childBenefit(quebec.code, "quebec-family-allowance").params;
  const nwt = childBenefit("NT", "nwt-child-benefit").params;
  const nlb = childBenefit("NL", "nl-child-benefit").params;
  const nub = childBenefit("NU", "per-child-reduced").params;
  const children = [
    `${benefitYear(y)} amounts, applied to current-year income: the Canada Child Benefit (${money(ccb.perChildUnder6)} per child under 6 or ${money(ccb.perChild6to17)} aged 6–17, reduced above ${money(ccb.threshold1)} of family net income), the Ontario Child Benefit (up to ${money(ocb.perChild)} per child), Quebec's family allowance (${money(qfa.max)} to ${money(qfa.min)} per child, plus the ${money(qfa.schoolSupplies)} school supplies supplement, applied to children aged 6–17), the B.C. family benefit, the Alberta Child and Family Benefit, the Nova Scotia Child Benefit, the PEI Child Benefit, New Brunswick's Child Tax Benefit and Working Income Supplement, and the Yukon Child Benefit, all from CRA's T4114 booklet for ${benefitYear(y)} or the province's own rules.`,
    `For the NWT, Newfoundland and Labrador and Nunavut benefits the amounts and the income where the reduction starts are official, but the reduction rate isn't published: the NWT and Newfoundland and Labrador benefits are tapered in a straight line to the published end points (${money(nwt.endsAt)} and ${money(nlb.endsAt)}), and Nunavut's uses the ${rate(nub.rateOneChild)} / ${rate(nub.rateMoreChildren)} rates in its ${year} Bill 4.`,
    `These approximations only affect families below about ${money(Math.max(nwt.endsAt, nlb.endsAt))}.`,
    // Manitoba's benefit isn't modelled, so it has no figures in the data; the income limit is approximate.
    "Saskatchewan has no child benefit; Manitoba's (for incomes under about $15,000), Newfoundland and Labrador's prenatal–early childhood nutrition supplement and Nunavut's territorial workers' supplement aren't modelled, and neither are childcare costs or credits.",
  ].join(" ");

  // Refundable credits
  const gb = F.groceriesBenefit,
    cwb = F.workersBenefit,
    std = cwb.standard;
  const ownCwb = [...Object.keys(cwb.regional).map(prov), quebec].sort(byName).map(short);
  const sk = credit("SK", "sk-low-income-tax-credit"),
    mb = credit("MB", "mb-affordability-credits");
  const estimates = [
    sk.estimated &&
      `Saskatchewan's reduction rate (${rate(sk.params.rate)}) is worked out from CRA's published start and end points`,
    mb.estimated && `Manitoba's renters credit is taken at its ${money(mb.params.renter)} maximum`,
    "Quebec's solidarity credit gives the living-alone amount to any household with one adult",
  ].filter(x => typeof x === "string");
  const credits = [
    `Counted when "Include in totals" is on, for ${benefitYear(y)}: the Canada Groceries and Essentials Benefit (the renamed GST/HST credit: ${money(gb.adult)} per adult, ${money(gb.child)} per child and a single supplement of up to ${money(gb.singleSupplement.max)}, less ${rate(gb.phaseOut.rate)} of family net income over ${money(gb.phaseOut.from)}); the Canada Workers Benefit basic amount for ${year} (${money(std.max[0])} single or ${money(std.max[1])} family, ${rate(std.rate)} of working income over ${either(std.floor, money)}, less ${either(std.phaseOut, rate)} of net income over ${either(std.threshold, money)}; ${list(ownCwb)} use their own versions${cwb.estimated ? `, and these ${year} values are CRA's ${lastYearIndexed} until CRA publishes them` : ""}); the Ontario sales tax credit and Ontario energy and property tax credit; Quebec's solidarity tax credit and work premium; B.C.'s renter's tax credit; Manitoba's renters and homeowners affordability credits; the Saskatchewan low-income tax credit; the New Brunswick HST credit; the Nova Scotia affordable living tax credit; the PEI essentials benefit; and the Newfoundland and Labrador income supplement.`,
    `Estimates: ${clauses(estimates)}.`,
    "Not modelled: the Workers Benefit disability supplement, senior-specific credits, the Northern Ontario energy credit and Quebec's northern-village supplement.",
  ].join(" ");

  // Property tax
  const cityName = (p: Province) => p.propertyTax.city.replace(/ \(est\.\)$/, "");
  const published = P.filter(p => !p.propertyTax.estimated).map(
    p => `${cityName(p)} ${fixed(p.propertyTax.rate, 2)}${p.propertyTax.note ? ` (${p.propertyTax.note})` : ""}`,
  );
  const estimated = groupBy(
    P.filter(p => p.propertyTax.estimated),
    p => p.propertyTax.rate,
  ).map(([r, ps]) => `${list(ps.map(cityName))} use${ps.length > 1 ? "" : "s"} a rough ${fixed(r, 1)} estimate`);
  const property = `Home value × the typical residential rate in each province's largest city for ${year}: ${list(published)}.${estimated.length ? ` ${list(estimated)}.` : ""} Land transfer tax is a one-time cost and isn't included.`;

  // What's not included
  const bpaChanges = P.filter(p => p.basicPersonalAmountChange).map(p => {
    const c = need(p.basicPersonalAmountChange, "amount change");
    return ` ${p.name}'s amount reflects its ${c.change} to ${money(provincialBpa(y, p))}, effective ${c.effective}.`;
  });

  // Investment income
  const inv = F.investment;
  const investment = `For investments held outside a TFSA or RRSP. Enter capital gains net of the year's capital losses; ${share(inv.capitalGainsInclusion)} of a net gain is added to taxable income. A net capital loss adds nothing to taxable income and can't reduce tax on salary or dividends, but it does lower the actual income the blended rate is measured against. The loss can be carried back three years or forward indefinitely against future capital gains. Eligible dividends are grossed up by ${rate(inv.grossUp.eligible - 1)} and non-eligible dividends by ${rate(inv.grossUp.nonEligible - 1)}, then federal and provincial dividend tax credits are applied at each government's ${year} rate. The blended rate divides total tax by actual cash income (salary plus the full gain and dividends received). Foreign dividends get no gross-up or dividend tax credit, so they're taxed like salary. Tax withheld abroad is counted in the total and credited back as a foreign tax credit, federally first and then provincially, up to the Canadian tax on that income; any withholding above that limit stays as extra tax. Grossed-up dividends count as income for the personal amount phase-outs. Not modelled: deducting foreign withholding above ${rate(inv.foreignWithholding.deductibleAbove)} and the alternative minimum tax (which can apply with large gains or dividends). Income inside a TFSA is not taxed; RRSP withdrawals are taxed as ordinary income.`;

  // Spending by household size
  const sizes = [1, 2, 3, 4, 5, 6].map(
    n => `${money(page.spendEst(n))} for ${NUMBER_WORDS[n]}${n === 1 ? " person" : ""}`,
  );

  return [
    para(
      "What's included",
      `Each bracket rate is applied to the portion of taxable income in that bracket, federal plus provincial. With basic personal amounts on, each government's amount is credited at its lowest bracket rate (federal: ${rate(F.brackets[0][1])} of ${money(fb.max)}), and a credit can reduce tax to zero but not below. The blended rate is total tax ÷ actual income received; the marginal rate is the tax on the next dollar, including credit phase-outs.`,
    ),
    para(
      "Deductions",
      `Deductions such as RRSP contributions are subtracted from total income to get taxable income. The Max RRSP link uses ${rate(F.rrsp.rate)} of the employment income entered, up to the ${year} dollar limit of ${money(F.rrsp.limit)}; your real limit is based on last year's earned income and any unused room, as shown on your notice of assessment.`,
    ),
    para("Phase-outs", phaseOuts),
    para("Income tax details", incomeTax),
    para("Payroll", payroll),
    para("Child benefits", children),
    para("Refundable credits", credits),
    para("Property tax", property),
    para(
      "What's not included",
      `Age, pension, disability, medical, donation and other personal credits; pension income splitting; fuel, excise and corporate taxes.${bpaChanges.join("")}`,
    ),
    para("Investment income", investment),
    para(
      "Defaults",
      `Each person starts at ${money(page.defaultIncome)} of employment income. Household spending starts at the one-person estimate and moves to the two-person estimate when you add a partner.`,
    ),
    para(
      "Spending by household size",
      // The survey figures below are background for how the estimate was built, not tax parameters.
      `The starting spending amount is a rough estimate for the number of adults plus children, rounded to the nearest $100: ${list(sizes)}. It starts from average Ontario household spending of $81,975 in 2023 (about 2.5 people), minus shelter ($29,312), groceries (about 70% of food spending), health care, and other mostly exempt costs such as insurance, childcare and tuition. That leaves about $38,000 a year, or $3,200 a month. This is scaled to each household size by the square root of the number of people, the same adjustment Statistics Canada uses to compare incomes across household sizes, because a second person adds less than a first. For context, Statistics Canada's 2024 Canadian Income Survey puts median after-tax income at $75,500 per family or single person, and its 2023 Survey of Household Spending puts average Ontario household spending at $81,975, of which $29,312 is shelter. The Fraser Institute estimates the average Canadian family paid $6,972 in sales taxes in 2025, a figure that also counts sales tax built into business costs.`,
    ),
    para(
      "Sales tax",
      // Ontario's insurance RST isn't modelled, so it has no value in the data.
      "Annual sales tax is monthly taxable spending, adjusted by the frugality setting, × 12 × the province's combined rate. PST, QST and Manitoba's RST are charged on the price before GST, so the rates simply add. The rate applies to the whole amount entered; provinces with their own PST exempt some extra items, and Ontario still charges 8% RST on some insurance, neither of which is modelled. Sales tax is shown as a share of household income alongside income tax.",
    ),
    para(
      "Household",
      "Canada has no joint filing, so each person is taxed on their own income and the household figures add the two together. If the second person is a spouse or common-law partner and basic personal amounts are on, the higher-income partner claims the spouse amount for the other: each government's spouse amount is reduced by the lower earner's net income (above a small threshold in some provinces) and credited at the lowest bracket rate. Quebec has no provincial spouse amount; instead the lower earner's unused basic credit is transferred to their partner. Marginal rates are household rates: the change in the household's total tax when the selected person earns one more dollar.",
    ),
    para(
      "Quebec",
      `CRA's page refers Quebec to Revenu Québec, so its brackets come from Revenu Québec's ${year} rates. Quebec residents' federal tax is reduced by the ${rate(F.quebecAbatement)} Quebec abatement, applied here.`,
    ),
  ].join("\n");
}
