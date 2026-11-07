// Property-tax relief (#22): grants, rebates and credits against the annual property tax bill.
//
// Accounting contract. Every program is evaluated on the GROSS levy and the household counts each entitlement once:
//   gross levy      = bill entered + relief that bill already reflects (net bills only)
//   remaining relief = entitlement on the gross levy − the amount the bill already reflects, never below zero
//   final burden    = bill entered − remaining relief = gross levy − entitlement
// so a gross bill, an ordinary-grant-net bill and a fully-net bill reach the same burden. Reflected amounts are kept
// by program id, because one grant being applied must not hide a different grant that is still due.
//
// One bill line, one id. A household states how much of a line its bill reflects, and that amount is floored against
// that program's own entitlement. If an ordinary grant and its senior replacement were two ids, an amount stated under
// one could shift to the other and be credited again. So a grant with ordinary and senior amounts is one program whose
// handler computes the total (BC: `bc-home-owner-grant`), and only separate bill lines (a grant and a municipal rebate)
// are separate ids. The one exception is an amount that is never on a bill: BC's low-income supplement is paid by
// cheque on its own application, so it is its own id, must state 0 reflected, and is reduced by any grant the bill
// reflects beyond the model's entitlement, so the two floors cannot add up to more than the schedule.
//
// The gross levy also feeds the existing credits (Ontario's property credit, Manitoba's school-tax credits), which
// household.ts computes from it, so those credits do not change with how the same levy was entered either.
//
// A relief that cannot be computed is reported as such (`incomplete`, `not-modelled`, `city-bill-required`) with null
// amounts. It never shows as $0, and it adds nothing to the household's credits.
//
// Adding a program (the extension point for the regional slices): add `reliefProgram("<id>", params)` to the union in
// src/data/schema.ts, its entry under `propertyRelief` in the province YAML (`scope: municipal` gates it to the default
// reference-city bill with no handler code), and one handler in BUILT_IN below that returns the entitlement on
// `ctx.grossLevy` from `rule.params`. Basis, reflected amounts, the city gate, flooring, the not-modelled and incomplete
// states and the credit entry are all done here; a handler must not repeat them.

import type { Province } from "../data/schema.ts";
import { type NetIncomeParts, netIncomeTotal } from "./payroll.ts";
import type { Household, Person, PropertyReliefFacts } from "./types.ts";

type SchemaRule = NonNullable<Province["propertyRelief"]>[number];

export type ReliefScope = "provincial" | "municipal";
export type BillBasis = "gross" | "net";

/** modelled: the amounts are computed (a true zero is possible). incomplete: an input is missing, amounts unknown.
 *  not-modelled: the program is declared out of scope. city-bill-required: a municipal program, but the bill is not
 *  the default reference-city bill, so no automatic award applies. */
export type ReliefStatus = "modelled" | "incomplete" | "not-modelled" | "city-bill-required";

/** The part of a rule the evaluator reads. A schema rule satisfies it; so does a test fixture. */
export interface ReliefRule {
  program: string;
  scope: ReliefScope;
  name?: string;
  estimated?: boolean;
  params?: unknown;
}

/** The program id that declares a relief not modelled. The evaluator handles it directly; it has no handler. */
export const NOT_MODELLED = "property-relief-not-modelled";

export interface PropertyBill {
  amount: number; // the levy as entered, or home value × rate; a supplied zero is a real zero
  supplied: boolean;
  basis: BillBasis; // net only for a supplied bill the household marked net
  applied: Readonly<Record<string, number>>; // valid reflected amounts by program id; read only on a net bill
  defaultCity: boolean; // the reference city's own bill: no supplied bill and no rate override
}

export interface PropertyReliefInput {
  bill: PropertyBill;
  people: readonly Person[];
  couple: boolean;
  kids: number;
  famNet: number; // federal family net income
  provincialFamNet: number; // Quebec's line 275 sum; equals famNet elsewhere
  federalNets: readonly number[];
  /** Each person's total income (line 15000: net income before deductions), floored at zero, for programs that test gross
   *  income. Toronto's cancellation does; substituting net income would let a deduction lower it. */
  totalIncomes?: readonly number[];
  homeValue: number;
  rent: number; // annual, zero for an owner
  /** Amount of each existing credit program (the province's `credits` entries, by program id) already counted for this
   *  household, so a replacement or overlapping relief can net it out. Zero when the credit is absent. */
  existingCredits: Readonly<Record<string, number>>;
  facts?: PropertyReliefFacts; // the household's province-specific facts (an MB school tax, a BC region)
}

/** What a handler sees: the household, the bill facts, the gross levy, the existing credits already counted and the
 *  relief lines already evaluated (the rules' data order). */
export interface ReliefContext extends Omit<PropertyReliefInput, "bill" | "facts"> {
  facts: PropertyReliefFacts;
  basis: BillBasis;
  reflected: number; // this program's amount the bill already reflects; zero on a gross bill
  applied: Readonly<Record<string, number>>; // every program's reflected amount the household stated; empty on a gross bill
  owner: boolean; // owns a home, or supplied an owner bill even with a zero home value
  renter: boolean;
  billAmount: number; // the levy as entered, before adding what it reflects
  billSupplied: boolean; // a bill the household entered, not home value × the reference rate
  defaultCity: boolean; // the reference city's own bill (no supplied bill, no rate override)
  grossLevy: number;
  earlier: readonly ReliefLine[];
}

export type ReliefOutcome =
  | { status: "modelled"; entitled: number; eligible?: Record<string, number | null> }
  | { status: "incomplete"; reason: string; eligible?: Record<string, number | null> };

export type ReliefHandler<R extends ReliefRule = ReliefRule> = (rule: R, ctx: ReliefContext) => ReliefOutcome;

export interface ReliefLine {
  program: string;
  name: string;
  scope: ReliefScope;
  estimated: boolean;
  status: ReliefStatus;
  reason?: string;
  /** Eligible tax components this program used, apart from the always-present `levy` (the gross levy; null when
   *  unknown). Kept distinct: a school-tax base, a prior-year paid tax and the current bill are different amounts. */
  eligible: Record<string, number | null>;
  entitled: number | null; // on the gross levy, before subtracting what the bill reflects
  applied: number | null; // reflected in the bill: zero on a gross bill, null when a net bill does not say
  remaining: number | null; // entitled − applied, not below zero; the amount credited. Null unless modelled
}

export interface PropertyReliefResult {
  basis: BillBasis;
  defaultCityBill: boolean;
  bill: number;
  grossLevy: number | null; // null when a net bill's reflected amounts are incomplete
  applied: number | null; // reflected amounts counted into grossLevy; null with it
  lines: ReliefLine[];
  /** Added to the household's credits: the sum of modelled lines' remaining relief. A lower bound unless `complete`;
   *  null when the gross levy is unknown, as no line can be modelled then. */
  credited: number | null;
  complete: boolean; // no line is incomplete or not modelled (a city-gated line is out of scope, not incomplete)
}

/** Total income (line 15000): net income with the deductions added back, so a deduction (RRSP, the OAS recovery, the CPP/QPP
 *  enhancement) does not lower it. Income tests on gross income, such as Toronto's, use this and never net income. */
export const totalIncomeOf = (n: NetIncomeParts) => Math.max(0, netIncomeTotal(n) + n.ded + n.enh);

const money = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
const validAmount = (n: unknown): n is number => typeof n === "number" && Number.isFinite(n) && n >= 0;
const reflectedOf = (applied: Readonly<Record<string, number>>, id: string): number | undefined =>
  Object.hasOwn(applied, id) ? applied[id] : undefined;

/** Programs with a handler. TypeScript requires an entry for every schema program id except the not-modelled one. */
type BuiltIn = {
  [K in Exclude<SchemaRule["program"], typeof NOT_MODELLED>]: ReliefHandler<Extract<SchemaRule, { program: K }>>;
};

const incomplete = (reason: string): ReliefOutcome => ({ status: "incomplete", reason });
const noRelief: ReliefOutcome = { status: "modelled", entitled: 0 };
const isSenior = (x: Person, age: number) => (x.age ?? 0) >= age; // age is whole years on December 31
/** Each person's federal net income floored at zero, then summed: BC's adjusted net income (regulation s.11) before its
 *  deductions and Manitoba's family income (MB479 line 6). The app has only the current year's income, so it stands in
 *  for BC's previous year's (approved on #21). Neither UCCB/RDSP adjustments nor BC's disability deduction is modelled. */
const flooredIncome = (ctx: ReliefContext) => ctx.federalNets.reduce((sum, n) => sum + Math.max(0, n), 0);
const earlierLine = (ctx: ReliefContext, program: string) => ctx.earlier.find(l => l.program === program);
/** Whole age on December 31 of the year BEFORE the benefit year. The app's age is on December 31 of the benefit year (the
 *  tax year), so the test subtracts one: Ontario's "64 on December 31, 2025" for the 2026 benefit is an app age of 65. */
const agedAtPriorYearEnd = (x: Person, age: number) => x.age !== undefined && x.age - 1 >= age;
/** An amount that no tax bill ever reflects (a grant paid with the Ontario Trillium Benefit, a credit claimed on a return):
 *  a net bill stating one is a mistake, because it would raise the gross levy for nothing. */
const NEVER_ON_BILL = "it is never on a property tax bill, so the amount a bill reflects must be 0";

/** The province's relief rule with this program id, typed for its own params; undefined when the year declares none. */
export function reliefRule<Id extends SchemaRule["program"]>(
  p: Pick<Province, "propertyRelief">,
  id: Id,
): Extract<SchemaRule, { program: Id }> | undefined {
  return p.propertyRelief?.find((r): r is Extract<SchemaRule, { program: Id }> => r.program === id);
}

/** Ontario: a household takes the senior OEPTC schedule when one spouse is 64 at the prior year end, or when a single
 *  person is and has no child (the CRA's single senior sheet is for "no care of a child under 18"; a single parent
 *  uses the ordinary sheet). creditsOf skips the ordinary credit for exactly these households. */
export const usesSeniorOeptc = (
  q: { ageAtPriorYearEnd: number },
  people: readonly Person[],
  couple: boolean,
  kids: number,
) => (couple || kids === 0) && people.some(x => agedAtPriorYearEnd(x, q.ageAtPriorYearEnd));

const BUILT_IN: BuiltIn = {
  // BC Home Owner Grant Act s.2 and Schedules 1-4: the schedule by property tax first, then $5 per $1,000 of assessed
  // value over the threshold. Any household member aged 65 selects the senior schedule. The entered home value stands
  // in for the assessed value (an estimate); with no home value the reduction is unknown, never assumed to be nil.
  "bc-home-owner-grant": (rule, ctx) => {
    if (!ctx.owner) return noRelief;
    const q = rule.params;
    // A non-zero amount stated under the supplement id (never on a notice) leaves it unclear which grant the bill
    // reflects, so neither line is computed.
    if ((ctx.applied["bc-low-income-grant-supplement"] ?? 0) > 0)
      return incomplete("an amount is stated for the supplement, which is never on a tax notice; it must be 0");
    if (!(ctx.homeValue > 0))
      return incomplete(
        "the grant's assessed-value reduction needs the home's assessed value, and no home value is given",
      );
    const senior = ctx.people.some(x => isSenior(x, q.seniorAge));
    const key = senior ? "senior" : "ordinary";
    const schedule = Math.min(
      q[ctx.facts.bcNorthernRural ? "northernRural" : "standard"][key],
      Math.max(0, ctx.grossLevy - q.minimumRemaining[key]),
    );
    const reduction = Math.min(
      schedule,
      (q.reductionPerThousand * Math.max(0, ctx.homeValue - q.valueThreshold)) / 1000,
    );
    return {
      status: "modelled",
      entitled: schedule - reduction,
      // The supplement exists only for the senior schedules (Act s.2(8)), so an ordinary reduction is not offered to it.
      eligible: { schedule, reduction, seniorReduction: senior ? reduction : 0, assessedValue: ctx.homeValue },
    };
  },
  // Regulation ss.11, 16-18: restores the senior schedule's actual reduction in full at adjusted income up to the
  // first limit, in half up to the second, and pays nothing under $25. Adjusted income is the floored net incomes less
  // $3,000 for a partner, each person 65 or over and each child; child-care and disability deductions are not modelled.
  "bc-low-income-grant-supplement": (rule, ctx) => {
    const q = rule.params;
    // Paid by cheque on a separate application, never on a tax notice: a bill cannot reflect any of it, so a stated
    // amount is a mistake (it would shift the grant's amount across the two ids and be credited again).
    if (ctx.reflected > 0) return incomplete("the supplement is never on a tax notice; its reflected amount must be 0");
    const grant = earlierLine(ctx, "bc-home-owner-grant");
    if (!grant) return incomplete("the supplement needs the home owner grant line before it");
    if (grant.status !== "modelled")
      return incomplete(`the grant reduction is unknown: ${grant.reason ?? "the home owner grant is not modelled"}`);
    const reduction = grant.eligible.seniorReduction ?? 0;
    const seniors = ctx.people.filter(x => isSenior(x, q.seniorAge)).length;
    const d = q.deductions;
    const adjusted =
      flooredIncome(ctx) - ((ctx.couple ? d.partner : 0) + seniors * d.perSenior + ctx.kids * d.perChild);
    const share = adjusted <= q.fullIncomeLimit ? 1 : adjusted <= q.halfIncomeLimit ? q.halfShare : 0;
    const amount = reduction * share;
    // A bill that reflects more grant than the model entitles (the entered value only stands in for the assessed
    // value) has already taken part of the reduction back: the grant and the supplement together never exceed the
    // schedule amount.
    const overReflected = Math.max(0, (grant.applied ?? 0) - (grant.entitled ?? 0));
    return {
      status: "modelled",
      entitled: Math.max(0, (amount < q.minimumPayable ? 0 : amount) - overReflected),
      eligible: { reduction, adjustedIncome: adjusted },
    };
  },
  // OSHPTG (CRA Q&A, "How much is the grant"): the lesser of $500 and the property tax paid, less 3.33% of adjusted
  // family net income over $35,000 (single) or $45,000 (couple), and nothing at or above $50,000 / $60,000. One spouse
  // aged 64 at the prior year end is enough, and an owner is needed. The household's bill is its own share. Prior-year
  // tax and income are proxied by this year's (an estimate).
  "ontario-senior-homeowners-property-grant": (rule, ctx) => {
    const q = rule.params;
    if (ctx.reflected > 0) return incomplete(`the grant is paid with the Ontario Trillium Benefit: ${NEVER_ON_BILL}`);
    if (!ctx.owner || !ctx.people.some(x => agedAtPriorYearEnd(x, q.ageAtPriorYearEnd))) return noRelief;
    const kind = ctx.couple ? "couple" : "single";
    const income = ctx.famNet;
    const grant =
      income >= q.cutoff[kind]
        ? 0
        : Math.min(q.maximum, ctx.grossLevy) - q.rate * Math.max(0, income - q.threshold[kind]);
    return { status: "modelled", entitled: grant, eligible: { familyNetIncome: income } };
  },
  // OEPTC senior calculation sheets, steps 1-5: occupancy cost O = tax + 20% of rent; energy E = min(O, 290); property
  // P = min(O, 617 + min(10% of O, 581)); credit = E + P - 2% of income over the senior threshold. Step 5 takes back
  // the part of credit + OSHPTG that exceeds E + O: overlap = max(0, max(0, credit + OSHPTG - E) - O). This replaces
  // the ordinary credit for the households that qualify (credits.ts skips it), so the two never apply together.
  "ontario-energy-property-tax-credit-senior-overlap": (rule, ctx) => {
    const q = rule.params;
    if (ctx.reflected > 0) return incomplete(`the credit is paid with the Ontario Trillium Benefit: ${NEVER_ON_BILL}`);
    if (!usesSeniorOeptc(q, ctx.people, ctx.couple, ctx.kids)) return noRelief; // the ordinary credit applies
    if ((ctx.existingCredits["ontario-energy-property-tax-credit"] ?? 0) > 0)
      return incomplete("the ordinary credit is also counted, and it must not apply with the senior schedule");
    const grant = earlierLine(ctx, "ontario-senior-homeowners-property-grant");
    if (grant?.status !== "modelled" || grant.entitled === null)
      return incomplete(`the grant it overlaps is unknown: ${grant?.reason ?? "the grant line must come before it"}`);
    const occupancy = ctx.grossLevy > 0 ? ctx.grossLevy : ctx.rent * q.rentShare;
    if (!(occupancy > 0)) return noRelief;
    const energy = Math.min(occupancy, q.energyMax);
    const property = Math.min(occupancy, q.propertyBase + Math.min(q.propertyRate * occupancy, q.propertyMax));
    const threshold = ctx.couple ? q.thresholdFamily : q.thresholdSingle;
    const raw = Math.max(0, energy + property - q.rate * Math.max(0, ctx.famNet - threshold));
    const overlap = Math.max(0, Math.max(0, raw + grant.entitled - energy) - occupancy);
    return {
      status: "modelled",
      entitled: Math.max(0, raw - overlap),
      eligible: { occupancyCost: occupancy, energy, property, beforeOverlap: raw, overlap },
    };
  },
  // Toronto Municipal Code 767-5.4 with the 2026 application and budget: an owner who is 65, or 60-64 with an OAS
  // Allowance, whose household's total (gross) income is within the limit and whose home's assessment is within its limit
  // has the year's tax increase plus earlier cancelled increases still payable cancelled, if that is at least $10. The
  // increase is this year's levy less last year's when the household states it; otherwise it is a first-time claimant's
  // estimate, levy x r / (1 + r) at the City's rate increase r (the 2026 budget's $4,252 average bill gives $91.53), with
  // no earlier increases. Home value stands in for the assessed value. No disability route and no construction exclusion.
  "toronto-property-tax-increase-cancellation": (rule, ctx) => {
    const q = rule.params;
    const senior = ctx.people.some(x => (x.age ?? 0) >= q.seniorAge || ((x.age ?? 0) >= q.allowanceAge && x.allowance));
    if (!ctx.owner || !senior) return noRelief;
    if (!ctx.totalIncomes) return incomplete("the household's total (gross) income is not given");
    const income = ctx.totalIncomes.reduce((sum, n) => sum + Math.max(0, n), 0);
    if (income > q.incomeLimit || ctx.homeValue > q.assessmentLimit) return noRelief;
    const prior = ctx.facts.torontoPriorYearLevy;
    const increase =
      typeof prior === "number" && Number.isFinite(prior) && prior >= 0
        ? Math.max(0, ctx.grossLevy - prior)
        : (ctx.grossLevy * q.firstTimeIncreaseRate) / (1 + q.firstTimeIncreaseRate);
    const carried = ctx.facts.torontoCarryover;
    const carryover = typeof carried === "number" && Number.isFinite(carried) && carried >= 0 ? carried : 0;
    const total = increase + carryover;
    return {
      status: "modelled",
      entitled: total < q.minimum ? 0 : Math.min(ctx.grossLevy, total),
      eligible: { increase, carryover, totalIncome: income, assessedValue: ctx.homeValue },
    };
  },
  // Income Tax Act (Manitoba) s.5.3-5.6: the credit is capped by gross eligible SCHOOL tax, not the whole bill. A
  // household states the school tax (net of the advance on a net bill, which is restored here). With no figure only
  // the default-city bill has an estimate (the reference division's school mills on the home value); any other bill
  // is incomplete, because a school share of a custom total is not knowable.
  "mb-homeowners-school-tax-credit": (rule, ctx) => {
    if (!ctx.owner) return noRelief;
    const q = rule.params;
    const stated = ctx.facts.schoolTax;
    let school: number;
    if (typeof stated === "number" && Number.isFinite(stated) && stated >= 0)
      school = stated + (ctx.basis === "net" ? ctx.reflected : 0);
    else if (ctx.defaultCity)
      school = Math.min(
        ctx.grossLevy,
        (ctx.homeValue * q.reference.assessmentPortion * q.reference.schoolMills) / 1000,
      );
    else return incomplete("the school tax on the bill is not given, and a bill's school share is not estimated");
    if (school > ctx.grossLevy + 0.005) return incomplete("the school tax given is more than the whole property bill");
    return { status: "modelled", entitled: Math.min(q.max, school), eligible: { schoolTax: school } };
  },
  // MB479 lines 38-44: owner or spouse 65 at year end; the school tax left after ALL homeowners credit (the advance
  // and the claim) less 1% of family income over the threshold, at most the maximum.
  "mb-senior-school-tax-rebate": (rule, ctx) => {
    const q = rule.params;
    if (!ctx.owner || !ctx.people.some(x => isSenior(x, q.seniorAge))) return noRelief;
    const credit = earlierLine(ctx, "mb-homeowners-school-tax-credit");
    const school = credit?.eligible.schoolTax;
    if (credit?.status !== "modelled" || credit.entitled === null || school === undefined || school === null)
      return incomplete(
        `the school tax left after the homeowners credit is unknown: ${credit?.reason ?? "no credit line"}`,
      );
    const remaining = Math.max(0, school - credit.entitled);
    const income = flooredIncome(ctx);
    return {
      status: "modelled",
      entitled: Math.max(0, Math.min(q.max, remaining) - q.rate * Math.max(0, income - q.threshold)),
      eligible: { remainingSchoolTax: remaining, familyIncome: income },
    };
  },
  // Income Tax Act (Manitoba) s.5.6.1: a full year's annual amounts, capped by the rent paid. The senior formula
  // replaces the ordinary amount and its reduction starts at zero income. Rent is the household's annual rent.
  "mb-renters-affordability-senior": (rule, ctx) => {
    if (!ctx.renter) return noRelief;
    const q = rule.params;
    const income = flooredIncome(ctx);
    const credit = ctx.people.some(x => isSenior(x, q.seniorAge))
      ? q.seniorMax - Math.min(q.topUpMax, q.rate * income)
      : q.ordinary;
    return { status: "modelled", entitled: Math.min(ctx.rent, credit), eligible: { familyIncome: income } };
  },
};

// biome-ignore lint/suspicious/noExplicitAny: handlers are keyed by id, so each is typed for its own rule shape
const registry = new Map<string, ReliefHandler<any>>(Object.entries(BUILT_IN));

/** Test seam: run `run` with an extra handler, so a fixture program can be exercised without shipping it in
 *  data/years/. Refuses to shadow a real handler, and always unregisters. */
export function withPropertyReliefHandler<T>(id: string, handler: ReliefHandler, run: () => T): T {
  if (registry.has(id)) throw new Error(`Property relief program ${id} already has a handler`);
  registry.set(id, handler);
  try {
    return run();
  } finally {
    registry.delete(id);
  }
}

/** The bill facts the evaluator needs, from the household's inputs. Old inputs have none of the new fields, so they
 *  are a gross bill. An estimate (no supplied bill) is gross whatever basis was set. A supplied bill or a rate
 *  override is not the reference city's bill, so a municipal program does not apply to it. */
export function propertyBillOf(
  code: string,
  hh: Pick<Household, "propertyRates" | "propertyBillBasis" | "propertyReliefApplied">,
  amount: number,
  supplied: boolean,
): PropertyBill {
  const net = supplied && hh.propertyBillBasis?.[code] === "net";
  const applied: Record<string, number> = {};
  if (net)
    for (const [id, value] of Object.entries(hh.propertyReliefApplied?.[code] ?? {}))
      if (validAmount(value)) applied[id] = value;
  return {
    amount,
    supplied,
    basis: net ? "net" : "gross",
    applied,
    defaultCity: !supplied && hh.propertyRates?.[code] == null,
  };
}

const kindOf = (rule: ReliefRule, bill: PropertyBill) =>
  rule.program === NOT_MODELLED ? "not-modelled" : rule.scope === "municipal" && !bill.defaultCity ? "gated" : "run";

/** The levy before any relief: the bill entered plus what a net bill reflects. A net bill must state the amount for
 *  every program that will run (zero included); one not stated leaves the gross levy unknown, never the entered bill. */
export function grossLevyOf(rules: readonly ReliefRule[], bill: PropertyBill) {
  if (bill.basis !== "net") return { grossLevy: bill.amount, applied: 0, missing: [] as string[] };
  const missing = rules
    .filter(r => kindOf(r, bill) === "run" && reflectedOf(bill.applied, r.program) === undefined)
    .map(r => r.program);
  const applied = rules.reduce((sum, r) => sum + (reflectedOf(bill.applied, r.program) ?? 0), 0);
  return missing.length
    ? { grossLevy: null, applied: null, missing }
    : { grossLevy: bill.amount + applied, applied, missing };
}

/** Amount of each existing credit program counted so far, by program id, matched on the display names the
 *  province's own entries give them (a program's name, and a renter name where it has one). */
export function existingCreditsOf(
  programs: readonly { program: string; name?: string; nameRenter?: string }[],
  credits: readonly [string, number][],
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const cr of programs) {
    const names = [cr.name ?? cr.program, cr.nameRenter];
    out[cr.program] = (out[cr.program] ?? 0) + credits.reduce((sum, [n, v]) => sum + (names.includes(n) ? v : 0), 0);
  }
  return out;
}

/** Entitlement, reflected amount and remaining relief for each program, on the gross levy. Pure: the same rules and
 *  input give the same result, and nothing here knows an amount, a rate or a threshold. */
export function propertyReliefOf(rules: readonly ReliefRule[], input: PropertyReliefInput): PropertyReliefResult {
  const { bill } = input;
  const net = bill.basis === "net";
  const { grossLevy, applied, missing } = grossLevyOf(rules, bill);
  const owner = input.homeValue > 0 || bill.supplied;

  const lines: ReliefLine[] = [];
  for (const rule of rules) {
    const reflected = net ? (reflectedOf(bill.applied, rule.program) ?? null) : 0;
    const line: ReliefLine = {
      program: rule.program,
      name: rule.name ?? rule.program,
      scope: rule.scope,
      estimated: rule.estimated ?? false,
      status: "incomplete",
      eligible: {},
      entitled: null,
      applied: reflected,
      remaining: null,
    };
    lines.push(line);
    const kind = kindOf(rule, bill);
    if (kind === "not-modelled") {
      line.status = "not-modelled";
      line.reason = (rule.params as { reason?: string } | undefined)?.reason ?? "not modelled";
      continue;
    }
    if (kind === "gated") {
      line.status = "city-bill-required";
      continue;
    }
    if (grossLevy === null) {
      line.reason = `the bill is net of relief, but the amount already applied is not given for ${missing.join(", ")}`;
      line.eligible = { levy: null };
      continue;
    }
    const handler = registry.get(rule.program);
    if (!handler) throw new Error(`No property relief handler for program ${rule.program}`);
    const outcome = handler(rule, {
      people: input.people,
      couple: input.couple,
      kids: input.kids,
      famNet: input.famNet,
      provincialFamNet: input.provincialFamNet,
      federalNets: input.federalNets,
      totalIncomes: input.totalIncomes,
      homeValue: input.homeValue,
      rent: input.rent,
      existingCredits: input.existingCredits,
      facts: input.facts ?? {},
      basis: bill.basis,
      reflected: reflected ?? 0,
      applied: bill.applied,
      owner,
      renter: !owner && input.rent > 0,
      billAmount: bill.amount,
      billSupplied: bill.supplied,
      defaultCity: bill.defaultCity,
      grossLevy,
      earlier: lines.slice(0, -1),
    });
    line.eligible = { ...outcome.eligible, levy: grossLevy };
    if (outcome.status === "incomplete") {
      line.reason = outcome.reason;
      continue;
    }
    if (!Number.isFinite(outcome.entitled))
      throw new Error(`Property relief ${rule.program} returned a non-finite amount`);
    const entitled = Math.max(0, outcome.entitled);
    // A bill reflecting more than the model entitles is the household's own bill: nothing is clawed back.
    line.status = "modelled";
    line.entitled = entitled;
    line.remaining = money(Math.max(0, entitled - (reflected ?? 0)));
  }
  return {
    basis: bill.basis,
    defaultCityBill: bill.defaultCity,
    bill: bill.amount,
    grossLevy,
    applied,
    lines,
    credited: grossLevy === null ? null : lines.reduce((sum, l) => sum + (l.remaining ?? 0), 0),
    complete: lines.every(l => l.status === "modelled" || l.status === "city-bill-required"),
  };
}
