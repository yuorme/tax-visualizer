// Property-tax relief (#22): grants, rebates and credits against the annual property tax bill.
//
// Accounting contract. Every program is evaluated on the GROSS levy and the household counts each entitlement once:
//   gross levy      = bill entered + relief that bill already reflects (net bills only)
//   remaining relief = entitlement on the gross levy − the amount the bill already reflects, never below zero
//   final burden    = bill entered − remaining relief = gross levy − entitlement
// so a gross bill, an ordinary-grant-net bill and a fully-net bill reach the same burden. Reflected amounts are kept
// by program id, because one grant being applied must not hide a different grant that is still due.
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
import type { Household, Person } from "./types.ts";

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
  homeValue: number;
  rent: number; // annual, zero for an owner
}

/** What a handler sees: the household, the gross levy and the lines already evaluated (the rules' data order). */
export interface ReliefContext extends Omit<PropertyReliefInput, "bill"> {
  owner: boolean; // owns a home, or supplied an owner bill even with a zero home value
  renter: boolean;
  billAmount: number;
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
  applied: number; // reflected amounts counted into grossLevy
  lines: ReliefLine[];
  /** Added to the household's credits: the sum of modelled lines' remaining relief. A lower bound unless `complete`. */
  credited: number;
  complete: boolean; // no line is incomplete or not modelled (a city-gated line is out of scope, not incomplete)
}

const money = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
const validAmount = (n: unknown): n is number => typeof n === "number" && Number.isFinite(n) && n >= 0;
const reflectedOf = (applied: Readonly<Record<string, number>>, id: string): number | undefined =>
  Object.hasOwn(applied, id) ? applied[id] : undefined;

/** Programs with a handler. TypeScript requires an entry for every schema program id except the not-modelled one. */
type BuiltIn = {
  [K in Exclude<SchemaRule["program"], typeof NOT_MODELLED>]: ReliefHandler<Extract<SchemaRule, { program: K }>>;
};
const BUILT_IN: BuiltIn = {};

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

/** Entitlement, reflected amount and remaining relief for each program, on the gross levy. Pure: the same rules and
 *  input give the same result, and nothing here knows an amount, a rate or a threshold. */
export function propertyReliefOf(rules: readonly ReliefRule[], input: PropertyReliefInput): PropertyReliefResult {
  const { bill } = input;
  const net = bill.basis === "net";
  const kindOf = (rule: ReliefRule) =>
    rule.program === NOT_MODELLED ? "not-modelled" : rule.scope === "municipal" && !bill.defaultCity ? "gated" : "run";
  // A net bill is grossed up by every amount it reflects. Each program that will run must state its amount
  // (zero included); one that is not stated leaves the gross levy, and so every entitlement, unknown.
  const missing = net
    ? rules.filter(r => kindOf(r) === "run" && reflectedOf(bill.applied, r.program) === undefined)
    : [];
  const applied = net ? rules.reduce((sum, r) => sum + (reflectedOf(bill.applied, r.program) ?? 0), 0) : 0;
  const grossLevy = missing.length ? null : bill.amount + applied;
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
    const kind = kindOf(rule);
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
      line.reason = `the bill is net of relief, but the amount already applied is not given for ${missing.map(r => r.program).join(", ")}`;
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
      homeValue: input.homeValue,
      rent: input.rent,
      owner,
      renter: !owner && input.rent > 0,
      billAmount: bill.amount,
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
    credited: lines.reduce((sum, l) => sum + (l.remaining ?? 0), 0),
    complete: lines.every(l => l.status === "modelled" || l.status === "city-bill-required"),
  };
}
