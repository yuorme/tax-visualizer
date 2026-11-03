// Page text that quotes the year's figures: the methodology notes in the footer and the info tooltips.
// Every amount, rate and threshold here is read from the year's data, so the text can't drift from the numbers
// the engine uses. This module only formats values; it never works out anyone's tax. No DOM access, so the
// tests can render it in Node.
import type { ChildBenefitProgram, CreditProgram, FuelRate, PhasedAmount, Province, YearData } from "../data/schema.ts";
import { ratePeriods, yearAverage } from "../engine/index.ts";

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
/** A per-litre tax in cents: 10¢, 8.47¢, 19.2¢. */
export const cents = (r: number) => `${+(r * 100).toFixed(2)}¢`;
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
/** A YYYY-MM-DD date as "April 20". */
const day = (iso: string) => `${MONTHS[Number(iso.slice(5, 7)) - 1]} ${Number(iso.slice(8, 10))}`;
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
  /** The name of whichever of these programs the province runs that year (one replaced another). */
  const creditName = (code: string, ids: CreditProgram["program"][]) =>
    need(prov(code).credits?.find(c => ids.includes(c.program))?.name, `${code} ${ids.join(" or ")} credit name`);
  const quebec = need(
    y.provinces.find(p => p.system === "quebec"),
    "Quebec-system province",
  );
  return { prov, childBenefit, credit, creditName, quebec };
}

/** Property tax rates split three ways: published for the year, estimated, and rough placeholders. */
function propertyRates(ps: Province[]) {
  const listed = ps.filter(p => !p.propertyTax.rough);
  return { listed, estimated: listed.filter(p => p.propertyTax.estimated), rough: ps.filter(p => p.propertyTax.rough) };
}
/** Says which listed property tax rates are estimates, or "" when none is: "provincial rates are estimates, …". */
function estimatedRates(y: YearData, listed: Province[], estimated: Province[], city: (p: Province) => string) {
  if (!estimated.length) return "";
  const which =
    estimated.length === listed.length
      ? "provincial rates are estimates"
      : `the ${list(estimated.map(city))} ${estimated.length > 1 ? "rates are estimates" : "rate is an estimate"}`;
  return `${which}, not yet checked against ${y.year} municipal rates`;
}

/** The provincial basic personal amount before any phase-out. */
const provincialBpa = (y: YearData, p: Province) => {
  const a = p.basicPersonalAmount;
  return a === "federal" ? y.federal.basicPersonalAmount.max : typeof a === "number" ? a : a.max;
};
const isPhased = (a: Province["basicPersonalAmount"]): a is PhasedAmount => typeof a === "object";
/** Benefit amounts run July to June, starting in the tax year. */
const benefitYear = (y: YearData) => `July ${y.year} to June ${y.year + 1}`;

/** The year's fuel data, or null for a year without it. */
function fuelData(y: YearData) {
  const fed = y.federal.fuelTax,
    driving = y.federal.driving;
  if (!fed || !driving) return null;
  const ps = y.provinces.map(p => ({
    p,
    fuel: need(p.fuelTax, `${p.code} fuel tax`),
    driving: need(p.driving, `${p.code} driving`),
  }));
  return { fed, driving, ps };
}
/** A fuel rate as written in the notes: "13¢", or "13¢, 0¢ from October 1 (fuel tax relief program)"; without the
 *  data's notes on each change when `notes` is false. */
const rateText = (r: FuelRate, year: number, notes = true) =>
  ratePeriods(r, year)
    .map((x, i) =>
      i === 0 ? cents(x.rate) : `${cents(x.rate)} from ${day(x.from)}${notes && x.note ? ` (${x.note})` : ""}`,
    )
    .join(", ");
/** Year-average per-litre tax in province p: federal, provincial and regional together. */
const perLitre = (y: YearData, p: Province) => {
  const f = need(y.federal.fuelTax, "federal fuel tax"),
    t = need(p.fuelTax, `${p.code} fuel tax`);
  return (
    yearAverage(f.gasoline, y.year) +
    yearAverage(t.gasoline, y.year) +
    (t.regional ? yearAverage(t.regional.gasoline, y.year) : 0)
  );
};
/** The regional transit taxes in running text: "TransLink in Vancouver (18.5¢) and ARTM in Montreal (3¢)". */
const regionalTaxes = (y: YearData, ps: Province[]) =>
  list(
    ps.flatMap(p =>
      p.fuelTax?.regional
        ? [`${p.fuelTax.regional.name} in ${p.propertyTax.city} (${rateText(p.fuelTax.regional.gasoline, y.year)})`]
        : [],
    ),
  );

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
  const { listed, estimated, rough } = propertyRates(y.provinces);
  const prop = ext(listed, p => p.propertyTax.rate);
  const city = (ps: Province[]) => list(ps.map(p => p.propertyTax.city));
  const propCaveats = [
    estimatedRates(y, listed, estimated, p => p.propertyTax.city),
    rough.length ? "territorial rates are rough estimates" : "",
  ].filter(Boolean);
  const gb = F.groceriesBenefit,
    gbName = need(gb.name, "groceries benefit name");
  const fd = fuelData(y);
  const noFuel = `Fuel taxes aren't in the ${y.year} data yet, so driving adds nothing to the totals.`;
  const fuelTips = fd
    ? (() => {
        const t = ext(y.provinces, p => perLitre(y, p));
        const changed = [fd.fed.gasoline, ...fd.ps.map(x => x.fuel.gasoline)].some(r => typeof r === "object");
        return {
          fuel: `Litres = distance × fuel efficiency ÷ 100. Each litre carries the federal excise tax (${rateText(fd.fed.gasoline, y.year, false)}), your province's fuel tax and, in ${list(fd.ps.filter(x => x.fuel.regional).map(x => x.p.propertyTax.city))}, a regional transit tax; each province uses its largest city. Together they run from ${cents(t.lo)} a litre in ${places(y, t.atLo)} to ${cents(t.hi)} in ${places(y, t.atHi)}${changed ? `, averaged over ${y.year} where a rate changed during the year` : ""}. GST/HST (and QST in Quebec) on gasoline isn't added here: gasoline is part of your taxable spending, so its sales tax is already counted there.`,
          distance: `Total kilometres driven in a year by all the household's vehicles. It starts at the average per vehicle in your home province from the ${fd.driving.distanceSource}, the most recent survey, and isn't scaled to the size of your household. Enter 0 for no car.`,
          efficiency: `Your vehicles' average fuel consumption in litres per 100 km, weighted by how much each one is driven. It starts at ${fd.driving.efficiency.toFixed(1)}, ${fd.driving.efficiencySource}. Enter 0 for an electric car.`,
        };
      })()
    : { fuel: noFuel, distance: noFuel, efficiency: noFuel };
  return {
    ...fuelTips,
    deductions:
      "Annual amounts claimed against income for the selected person. Open Edit to enter RRSP, FHSA and other deductions separately. Childcare relief is calculated separately from Childcare costs; do not add it here as well. Enter each amount once; these are deductions claimed this year, not necessarily contributions made this year. Eligibility and available room are your responsibility.",
    rrsp: `Your annual RRSP deduction claimed, including eligible unused contributions from earlier years. Use estimate fills in ${rate(F.rrsp.rate)} of the employment income entered, up to the ${y.year} limit of ${money(F.rrsp.limit)}. This is only an estimate: net rental income that could create room is not separated from other income. Your actual room uses last year's earned income, pension adjustments and unused room; check your notice of assessment.`,
    fhsa: "Your annual FHSA deduction claimed, including eligible contributions deferred from earlier years. The claim can exceed one year's contribution allowance. Transfers from an RRSP to an FHSA are not deductible. Check your FHSA records and Schedule 15 for the amount you can claim; the calculator does not calculate contribution room or enforce your lifetime limit.",
    otherDeductions:
      "Annual deductions other than the RRSP and FHSA claims entered separately: union and professional dues, deductible support payments, moving expenses and similar. Existing saved deductions are kept here. Exclude anything already entered as RRSP, FHSA or childcare to avoid counting it twice.",
    bpa: `Every taxpayer gets a non-refundable credit on a basic amount of income: ${money(F.basicPersonalAmount.max)} federally in ${y.year}, plus a provincial amount from ${money(bpa.lo)} in ${places(y, bpa.atLo)} to ${money(bpa.hi)} in ${places(y, bpa.atHi)}. Switch off to see bracket rates alone.`,
    spending: `Your household's monthly spending on things sales tax applies to, before tax. A quick estimate: your average monthly credit card and debit spending, minus groceries, prescriptions and healthcare. Usually exempt across Canada: basic groceries, rent and mortgage payments, prescription drugs, most medical and dental care, insurance premiums and banking fees, childcare, tuition, and public transit. Usually taxed: restaurant meals and takeout, alcohol, clothing, electronics, furniture and household goods, gas, utilities, phone and internet, vehicles and repairs, travel, and most services. ${y.year} rates run from ${sales.atLo[0].salesTax.label} in ${places(y, sales.atLo)} to ${sales.atHi[0].salesTax.label} in ${places(y, sales.atHi)}. The starting amount is a rough estimate for a household with the adults and children set here; adjust it to match your own spending.${fd ? " Include gasoline: its GST/HST (and QST in Quebec) is counted here, and the per-litre fuel taxes come from the Driving tab." : ""}`,
    children: `Children under 18. They raise the spending estimate and add child benefits: the Canada Child Benefit plus your province's benefit (every province and territory with one), using ${benefitYear(y)} amounts. Benefits are netted off the tax shown. Once you have at least one child, drag the small slate handle on the same track to say how many are under 6, since they get a higher CCB.`,
    property: `Annual property tax = home value × municipal rate. Each province uses the typical ${y.year} residential rate in its largest city, from ${fixed(prop.lo, 2)} in ${city(prop.atLo)} to ${fixed(prop.hi, 2)} in ${city(prop.atHi)}${propCaveats.length ? `; ${clauses(propCaveats)}` : ""}. Editing the rate changes your home province only. The same home value is used everywhere, though home prices differ a lot between cities. Renters pay property tax indirectly through rent, which isn't counted here.`,
    credits: `Credits paid to lower- and modest-income households, worked out from the income and household above: the ${gbName}${gb.formerName ? ` (formerly the ${gb.formerName})` : ""}, the Canada Workers Benefit, and your province's credits, such as the Ontario Trillium Benefit, Quebec's solidarity credit and work premium, and the low-income credits in Saskatchewan, New Brunswick, Nova Scotia, PEI and Newfoundland and Labrador. Amounts are for ${benefitYear(y)} (the ${y.year} tax year for the Workers Benefit). They're netted off the tax shown, together with child benefits.`,
    otherIncome: `Interest, rental income after expenses, pensions, RRSP and RRIF withdrawals, and any other income that's taxed in full but doesn't come from a job. It's taxed at the same rates as employment income but pays no CPP/QPP, EI or QPIP, gets no Canada employment amount (${money(F.employmentAmount)}), and isn't working income for the Canada Workers Benefit, Quebec's work premium or the working-income parts of the Alberta and New Brunswick child benefits. It does count in net income, so it reduces income-tested benefits and credits like any other income. Quebec's Health Services Fund contribution on non-employment income is not modelled. The pension income credit and pension splitting aren't applied. Interest earned in a TFSA isn't taxed: leave it out.`,
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
    { prov, childBenefit, credit, creditName, quebec } = lookup(y),
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
    `Each person with employment income gets the Canada employment amount (${money(F.employmentAmount)}${empAlso.length ? `, also in ${list(empAlso)}` : ""}) and credits for base CPP/QPP contributions and EI/QPIP premiums, federally and in every province except ${quebec.name}, which instead allows a deduction for workers (${rate(wd.rate)} of employment income, up to ${money(wd.max)}).`,
    "Enhanced CPP/QPP contributions are deducted from income.",
    `Ontario adds its surtax (${list(surtax)}), the Ontario tax reduction (${money(onRed.base)} plus ${money(onRed.perChild)} per child) and the LIFT credit (up to ${money(lift.max)}).`,
    ...P.flatMap(p =>
      p.postDividendSurtax
        ? [
            `${p.name} adds a surtax of ${rate(p.postDividendSurtax.params.rate)} of provincial tax above ${money(p.postDividendSurtax.params.threshold)}, after dividend tax credits and before the low-income tax reduction.`,
          ]
        : [],
    ),
    // The reduction is gone once net income passes the threshold by max ÷ rate.
    `BC applies its tax reduction (up to ${money(bcRed.max)}, phased out between ${money(bcRed.threshold)} and ${money(bcRed.threshold + bcRed.max / bcRed.rate)} of net income).`,
    `Low-income tax reductions are applied in ${list(lowIncome)}${indexed.length ? ` (${list(indexed)} ${indexed.length > 1 ? "are" : "is"} ${lastYearIndexed})` : ""}.`,
    kidPhrases.length ? `${list(kidPhrases)} are claimed by the parent who claims the children.` : "",
    "A single parent claims the eligible dependant amount; in Quebec a single adult gets the amount for a person living alone.",
    ...P.flatMap(p =>
      typeof p.spouseAmount === "object" &&
      "program" in p.spouseAmount &&
      p.spouseAmount.program === "nova-scotia-spouse-amount"
        ? [
            `${p.name}'s spouse or eligible dependant amount includes a supplement of up to ${money(p.spouseAmount.params.supplement.max)}, reduced by ${rate(p.spouseAmount.params.supplement.rate)} of the claimant's taxable income above ${money(p.spouseAmount.params.supplement.threshold)} and separately by the dependant's net income.`,
          ]
        : [],
    ),
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
    `CPP: ${fixed(cpp.base, 2)} base plus ${rate(cpp.enh1)} enhanced on earnings between ${money(cpp.exempt)} and ${money(cpp.ympe)}${cpp.enh2 ? `, and ${rate(cpp.enh2)} on earnings up to ${money(cpp.yampe)}` : "; no second additional contribution applies"}.`,
    `Quebec's QPP is ${fixed(qpp.base, 2)} base plus ${sameEnhanced ? "the same enhanced rates" : `${rate(qpp.enh1)} enhanced on earnings between ${money(qpp.exempt)} and ${money(qpp.ympe)}, and ${rate(qpp.enh2)} on earnings up to ${money(qpp.yampe)}`}.`,
    `EI: ${fixed(ei.rate, 2)} of earnings up to ${money(ei.maxInsurable)}, or ${fixed(ei.quebecRate, 2)} in Quebec, where QPIP adds ${fixed(qpip.rate, 2)} up to ${money(qpip.maxInsurable)}.`,
    `${clauses([...premium, ...terrTax])}.`,
    "Only employment income pays CPP/QPP, EI, QPIP and payroll tax; interest, rental and other income pays none of them.",
  ].join(" ");

  // Child benefits
  const ccb = F.childBenefit;
  const ocb = childBenefit("ON", "ontario-child-benefit").params;
  const qfa = childBenefit(quebec.code, "quebec-family-allowance").params;
  const nsBenefit = prov("NS").childBenefit;
  const nwtBenefit = need(prov("NT").childBenefit, "NWT child benefit");
  if (nwtBenefit.program !== "nwt-child-benefit" && nwtBenefit.program !== "nwt-child-benefit-age-groups")
    throw new Error("page notes: unsupported NWT child benefit");
  const nwt = nwtBenefit.params;
  const nlProgram = need(prov("NL").childBenefit, "NL child benefit");
  if (
    nlProgram.program !== "nl-child-benefit" &&
    nlProgram.program !== "nl-child-benefit-reduction" &&
    nlProgram.program !== "nl-child-benefit-periods"
  )
    throw new Error("page notes: unsupported NL child benefit");
  const nu = childBenefit("NU", "per-child-reduced"),
    nub = nu.params;
  const children = [
    `${benefitYear(y)} amounts, applied to current-year income: the Canada Child Benefit (${money(ccb.perChildUnder6)} per child under 6 or ${money(ccb.perChild6to17)} aged 6–17, reduced above ${money(ccb.threshold1)} of family net income), the Ontario Child Benefit (up to ${money(ocb.perChild)} per child), Quebec's family allowance (${money(qfa.max)} to ${money(qfa.min)} per child, plus the ${money(qfa.schoolSupplies)} school supplies supplement, applied to children aged 6–17), the B.C. family benefit, the Alberta Child and Family Benefit, the Nova Scotia Child Benefit, ${prov("PE").childBenefit ? "the PEI Child Benefit, " : ""}New Brunswick's Child Tax Benefit and Working Income Supplement, and the Yukon Child Benefit, all from CRA's T4114 booklet for ${benefitYear(y)} or the province's own rules.`,
    ...(bc.childBenefit?.program === "bc-family-benefit-periods"
      ? [
          `B.C.'s child opportunity benefit was renamed the family benefit during this benefit year. Each period is calculated separately before weighting: ${bc.childBenefit.params.periods.map(period => `${period.weight * 12} months at annual maximum amounts of ${list(period.max.map(money))} for the first, second and each additional child, with minimum amounts of ${list(period.min.map(money))}`).join("; ")}. Each period applies its own income reduction, minimum and zero floor.`,
        ]
      : []),
    ...(nsBenefit?.program === "nova-scotia-child-benefit-by-child"
      ? [
          `Nova Scotia pays annual amounts of ${list(nsBenefit.params.perChild.map(money))} for the first, second and each additional child below ${money(nsBenefit.params.fullBelow)} of family net income. From that threshold to below ${money(nsBenefit.params.partialBelow)}, the first child's amount stays whole and later children's amounts are paid at ${rate(nsBenefit.params.partialOtherRate)}. The benefit ends at the upper threshold.`,
        ]
      : []),
    ...(nlProgram.program === "nl-child-benefit"
      ? [
          `For the NWT, Newfoundland and Labrador and Nunavut benefits the amounts and the income where the reduction starts are official, but the reduction rate isn't published: the NWT and Newfoundland and Labrador benefits are tapered in a straight line to the published end points (${money(nwt.endsAt)} and ${money(nlProgram.params.endsAt)}), and Nunavut's uses the ${rate(nub.rateOneChild)} / ${rate(nub.rateMoreChildren)} rates in ${need(nu.rateSource, "Nunavut child benefit rate source")}.`,
          `These approximations only affect families below about ${money(Math.max(nwt.endsAt, nlProgram.params.endsAt))}.`,
        ]
      : nlProgram.program === "nl-child-benefit-periods"
        ? [
            `The NWT benefit uses ${nwtBenefit.estimated ? "an estimated" : "the published"} straight-line taper to ${money(nwt.endsAt)}. Newfoundland and Labrador changed its child benefit during this benefit year: calculate each period separately, then weight its entitlement by its share of the year. ${nlProgram.params.periods.map((period, i) => `Period ${i + 1} (${rate(period.weight)} of the year): annual amounts ${list(period.perChild.map(money))} for the first, second, third and each additional child; reduction rates ${list(period.rate.map(rate))} for one, two or three children, plus ${rate(period.additionalRate)} for each additional child, above ${money(period.threshold)} of family income.`).join(" ")} Nunavut uses the ${rate(nub.rateOneChild)} / ${rate(nub.rateMoreChildren)} rates in ${need(nu.rateSource, "Nunavut child benefit rate source")}.`,
          ]
        : [
            `The NWT benefit uses ${nwtBenefit.estimated ? "an estimated" : "the published"} straight-line taper to ${money(nwt.endsAt)}. Newfoundland and Labrador's published reduction rates are ${list(nlProgram.params.rate.map(rate))} for one, two or three children, plus ${rate(nlProgram.params.additionalRate)} for each additional child, on family income above ${money(nlProgram.params.threshold)}. Nunavut's uses the ${rate(nub.rateOneChild)} / ${rate(nub.rateMoreChildren)} rates in ${need(nu.rateSource, "Nunavut child benefit rate source")}.`,
          ]),
    // Manitoba's benefit isn't modelled, so it has no figures in the data; the income limit is approximate.
    "Saskatchewan has no child benefit; Manitoba's (for incomes under about $15,000), Newfoundland and Labrador's prenatal–early childhood nutrition supplement and Nunavut's territorial workers' supplement aren't modelled.",
    F.childcare
      ? "Childcare deductions use child details and assume employment and other income is eligible earned income unless adjusted. Ontario, Quebec and Newfoundland and Labrador childcare credits follow their own eligibility and income rules. Quebec-eligible expenses are entered separately; basic subsidized fees do not qualify for its credit. Childcare spending itself is not included in the tax total."
      : "Childcare rules are not available for this tax year.",
  ].join(" ");

  // Refundable credits
  const gb = F.groceriesBenefit,
    gbName = need(gb.name, "groceries benefit name"),
    cwb = F.workersBenefit,
    std = cwb.standard;
  const ownCwb = [...Object.keys(cwb.regional).map(prov), quebec].sort(byName).map(short);
  const sk = credit("SK", "sk-low-income-tax-credit");
  const mb = need(
    prov("MB").credits?.find(
      c =>
        c.program === "mb-affordability-credits" ||
        c.program === "mb-school-tax-credits" ||
        c.program === "mb-school-tax-credits-rent-share",
    ),
    "Manitoba property credits",
  );
  const mbDescription =
    mb.program === "mb-school-tax-credits" || mb.program === "mb-school-tax-credits-rent-share"
      ? `Manitoba's school tax rebate (${rate(mb.params.schoolRebateRate)} of estimated school taxes), education property tax credit (up to ${money(mb.params.educationCreditMax)} of remaining school taxes) and renters tax credit (up to ${money(mb.params.renterMax)}, ${mb.program === "mb-school-tax-credits-rent-share" ? `${rate(mb.params.renterShare)} of rent paid before applying the cap` : "capped by rent paid"})`
      : "Manitoba's renters and homeowners affordability credits";
  const cwbEstimate =
    cwb.estimationNote ?? `these ${year} values are CRA's ${lastYearIndexed} until CRA publishes them`;
  // The list below names these programs in prose; a year whose data drops one fails here instead of misreporting it.
  const named: [string, CreditProgram["program"]][] = [
    ["ON", "ontario-sales-tax-credit"],
    ["ON", "ontario-energy-property-tax-credit"],
    [quebec.code, "quebec-solidarity-tax-credit"],
    [quebec.code, "quebec-work-premium"],
    ["NB", "nb-hst-credit"],
    ["NS", "ns-affordable-living-tax-credit"],
    ["NL", "nl-income-supplement"],
  ];
  for (const [code, id] of named) credit(code, id);
  const bcRenter = bc.credits?.some(c => c.program === "bc-renters-tax-credit");
  // PEI's sales tax credit gave way to the essentials benefit in 2026.
  const pei = creditName("PE", ["pei-essentials-benefit", "pei-sales-tax-credit"]);
  const estimates = [
    sk.estimated &&
      `Saskatchewan's low-income tax credit includes estimated parameters; its modelled reduction rate is ${rate(sk.params.rate)}`,
    mb.estimated &&
      (mb.program === "mb-school-tax-credits" || mb.program === "mb-school-tax-credits-rent-share"
        ? `Manitoba's school taxes are estimated as ${rate(mb.params.schoolTaxShare)} of the property tax bill using the reference city's school-tax share`
        : `Manitoba's renters credit is taken at its ${money(mb.params.renter)} maximum`),
    "Quebec's solidarity credit gives the living-alone amount to any household with one adult",
  ].filter(x => typeof x === "string");
  const credits = [
    `Counted when "Include in totals" is on, for ${benefitYear(y)}: the ${gbName} (${gb.formerName ? `the renamed ${gb.formerName}: ` : ""}${money(gb.adult)} per adult, ${money(gb.child)} per child and a single supplement of up to ${money(gb.singleSupplement.max)}, less ${rate(gb.phaseOut.rate)} of family net income over ${money(gb.phaseOut.from)}); the Canada Workers Benefit basic amount for ${year} (${money(std.max[0])} single or ${money(std.max[1])} family, ${rate(std.rate)} of working income over ${either(std.floor, money)}, less ${either(std.phaseOut, rate)} of net income over ${either(std.threshold, money)}; ${list(ownCwb)} use their own versions${cwb.estimated ? `, and ${cwbEstimate}` : ""}); the Ontario sales tax credit and Ontario energy and property tax credit; Quebec's solidarity tax credit and work premium; ${bcRenter ? "B.C.'s renter's tax credit; " : ""}${mbDescription}; the Saskatchewan low-income tax credit; the New Brunswick HST credit; the Nova Scotia affordable living tax credit; the ${pei}; and the Newfoundland and Labrador income supplement.`,
    `Estimates: ${clauses(estimates)}.`,
    "Not modelled: the Workers Benefit disability supplement, senior-specific credits, the Northern Ontario energy credit and Quebec's northern-village supplement.",
  ].join(" ");

  // Property tax
  const cityName = (p: Province) => p.propertyTax.city.replace(/ \(est\.\)$/, "");
  const rates = propertyRates(P);
  const listedRates = rates.listed.map(
    p => `${cityName(p)} ${fixed(p.propertyTax.rate, 2)}${p.propertyTax.note ? ` (${p.propertyTax.note})` : ""}`,
  );
  const estimatedNote = estimatedRates(y, rates.listed, rates.estimated, cityName);
  const roughRates = groupBy(rates.rough, p => p.propertyTax.rate).map(
    ([r, ps]) => `${list(ps.map(cityName))} use${ps.length > 1 ? "" : "s"} a rough ${fixed(r, 1)} estimate`,
  );
  const property = `Home value × the typical residential rate in each province's largest city for ${year}: ${list(listedRates)}.${estimatedNote ? ` ${estimatedNote[0].toUpperCase()}${estimatedNote.slice(1)}.` : ""}${roughRates.length ? ` ${list(roughRates)}.` : ""} Land transfer tax is a one-time cost and isn't included.`;

  // Fuel tax
  const fd = fuelData(y);
  const fuel = fd
    ? (() => {
        const changes = (r: FuelRate) => typeof r === "object";
        const rates = fd.ps.map(
          ({ p, fuel: t }) => `${short(p)} ${rateText(t.gasoline, year)}${t.area ? ` (${t.area})` : ""}`,
        );
        const averaged = [
          ...(changes(fd.fed.gasoline) ? [`federal ${cents(yearAverage(fd.fed.gasoline, year))}`] : []),
          ...fd.ps
            .filter(x => changes(x.fuel.gasoline))
            .map(x => `${short(x.p)} ${cents(yearAverage(x.fuel.gasoline, year))}`),
        ];
        const dist = [...fd.ps].sort((a, b) => a.driving.distance - b.driving.distance);
        const km = (n: number) => `${n.toLocaleString("en-CA")} km`;
        return [
          "Litres bought = yearly distance × fuel efficiency ÷ 100, the same in every province.",
          `Each litre carries the federal excise tax and the provincial or territorial fuel tax, plus the regional transit tax of each province's largest city where it has one: ${regionalTaxes(y, P)}. The household is taken to live in that city.`,
          `${year} rates per litre: federal ${rateText(fd.fed.gasoline, year)}; ${rates.join("; ")}.`,
          averaged.length
            ? `Where a rate changed during the year, each rate counts for the share of the year it applied, as if driving were spread evenly through the year, for a ${year} average of ${list(averaged)}.`
            : "",
          "GST, HST and QST on gasoline are part of taxable spending and counted under sales tax, so they aren't added here.",
          `${quebec.name}'s cap-and-trade cost in the pump price isn't a tax and isn't counted.`,
          `The starting distance is the average per light vehicle in the home province in the ${fd.driving.distanceSource}, the last one, from ${km(dist[0].driving.distance)} in ${article(short(dist[0].p))} to ${km(dist[dist.length - 1].driving.distance)} in ${article(short(dist[dist.length - 1].p))}; it isn't scaled to household size.`,
          `The starting fuel efficiency, ${fd.driving.efficiency.toFixed(1)} L/100 km, is ${fd.driving.efficiencySource}.`,
          "Both can be changed; 0 means no car, or an electric one.",
        ]
          .filter(Boolean)
          .join(" ");
      })()
    : "";

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
      `Annual RRSP, FHSA and other deductions claimed are added once and subtracted from total income to get taxable income. Enter eligible claims, including deferred contributions, rather than contributions made this year; account room and eligibility are not calculated. The Use estimate RRSP link uses ${rate(F.rrsp.rate)} of the employment income entered, up to the ${year} dollar limit of ${money(F.rrsp.limit)}; your real limit is based on last year's earned income and any unused room, as shown on your notice of assessment.`,
    ),
    para("Phase-outs", phaseOuts),
    para("Income tax details", incomeTax),
    para("Payroll", payroll),
    para("Child benefits", children),
    para("Refundable credits", credits),
    para("Property tax", property),
    ...(fuel ? [para("Fuel tax", fuel)] : []),
    para(
      "What's not included",
      `Age, pension, disability, medical, donation and other personal credits; pension income splitting; ${fd ? "taxes on diesel and heating fuel, other excise taxes" : "fuel, excise"} and corporate taxes.${bpaChanges.join("")}`,
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
      "Annual sales tax is the monthly taxable spending shown × 12 × the province's combined rate. PST, QST and Manitoba's RST are charged on the price before GST, so the rates simply add. The rate applies to the whole amount entered; provinces with their own PST exempt some extra items, and Ontario still charges 8% RST on some insurance, neither of which is modelled. Sales tax is shown as a share of household income alongside income tax.",
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
