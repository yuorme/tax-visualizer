// Versioned scenario fragments. Fragments stay on the device; no server or account stores the inputs.
import type { PortfolioAssumptions } from "../data/schema.ts";
import { blank, type Person } from "../engine/types.ts";
import { ChildcareModel } from "./childcare.ts";
import { DEFAULT_INCOME, spendEst } from "./defaults.ts";
import { normalizePortfolios } from "./portfolio.ts";
import { compactRetirements, normalizeRetirements, type Retirement } from "./retirement.ts";
import { validSelfEmployment } from "./self-employment.ts";
import { normalizeSeniorBenefits } from "./senior-benefits.ts";
import { normalizePublicPensions, normalizeReceipts } from "./senior-income.ts";

export interface ScenarioContext {
  years: number[];
  provinces: string[];
  treatyRate: (year: number) => number;
  portfolioDefaults: PortfolioAssumptions;
}
type State = Record<string, unknown>;
const record = (value: unknown): value is State => value !== null && typeof value === "object" && !Array.isArray(value);
const finite = (value: unknown, min = 0, max = Number.MAX_SAFE_INTEGER): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= min && value <= max;
const latest = (context: ScenarioContext) => Math.max(...context.years);

/** Defaults are a versioned contract; the year is always retained so new data years cannot change a shared result. */
export function scenarioDefaults(context: ScenarioContext, year = latest(context)): State {
  return {
    v: 3,
    year,
    historyOpen: false,
    historyMode: "real",
    people: [blank(DEFAULT_INCOME)],
    // Per person, by index; absent means the manual view, so every scenario from before this field keeps its results.
    // A used entry is written in full, so a later change to the starting assumptions can't change a shared result.
    portfolios: [],
    // The same way: absent leaves each person's payroll exactly as it was before this field.
    retirement: [],
    active: 0,
    spouse: true,
    sort: "rate",
    home: "ON",
    dest: "AB",
    view: "home",
    useBpa: true,
    whRate: context.treatyRate(year),
    adults: 1,
    kids: 0,
    under6: 0,
    spend: spendEst(1),
    spendingAdjustment: 0,
    childcare: new ChildcareModel().state,
    metric: "pct",
    homeValue: 0,
    propOverride: null,
    propertyTaxBill: null,
    // Property-tax relief (#227). Absent in saves from before: a gross bill with nothing reflected.
    propertyBillBasis: "gross",
    propertyReliefApplied: {},
    schoolTax: null,
    bcNorthernRural: false,
    // Toronto and Quebec relief facts (#224); null is not stated.
    torontoPriorLevy: null,
    torontoCarryover: null,
    qcOwnershipYears: null,
    qcPotentialGrant: null,
    qcPrecedingGrant: null,
    qcOtherClaims: null,
    rent: 0,
    tenure: "own",
    useCredits: true,
    tab: null,
    km: null,
    eff: null,
    drivingUnits: "metric",
  };
}

function person(value: unknown, index: number): Person {
  const result = blank(index === 0 ? DEFAULT_INCOME : 0);
  if (record(value))
    for (const key of ["ord", "oth", "cg", "ed", "nd", "fd", "ded", "rrsp", "fhsa"] as const)
      if (
        finite(value[key], key === "cg" ? -Number.MAX_SAFE_INTEGER : 0) &&
        !(value[key] === 0 && ["rrsp", "fhsa"].includes(key))
      )
        result[key] = value[key];
  if (record(value) && validSelfEmployment(value.selfEmployment)) result.selfEmployment = value.selfEmployment;
  const receipts = record(value) ? normalizeReceipts(value.retirementIncome) : undefined;
  if (receipts) result.retirementIncome = receipts;
  if (record(value)) Object.assign(result, normalizePublicPensions(value), normalizeSeniorBenefits(value));
  return result;
}

/** Bound untrusted draft structures before the childcare model normalizes its own known fields. */
function draft(value: unknown, depth = 0): unknown {
  if (depth > 4) return null;
  if (value === null || typeof value === "boolean") return value;
  if (typeof value === "number") return finite(value) ? value : null;
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.slice(0, 64).map(v => draft(v, depth + 1));
  if (record(value))
    return Object.fromEntries(
      Object.entries(value)
        .slice(0, 64)
        .map(([key, v]) => [key, draft(v, depth + 1)]),
    );
  return null;
}

/** Keep only supported fields and their valid values. Missing/invalid values never inherit recipient storage. */
export function normalizeScenario(value: unknown, context: ScenarioContext): State {
  const input = record(value) ? value : {};
  const year = typeof input.year === "number" && context.years.includes(input.year) ? input.year : latest(context);
  const result = scenarioDefaults(context, year);
  const enums: Record<string, readonly unknown[]> = {
    historyMode: ["real", "nominal"],
    sort: ["rate", "geo"],
    view: ["home", "dest"],
    metric: ["pct", "usd"],
    tenure: ["own", "rent"],
    propertyBillBasis: ["gross", "net"],
    tab: [null, "income", "home", "credits", "driving"],
    drivingUnits: ["metric", "us"],
    home: context.provinces,
    dest: context.provinces,
  };
  for (const [key, values] of Object.entries(enums)) if (values.includes(input[key])) result[key] = input[key];
  for (const key of ["historyOpen", "spouse", "useBpa", "useCredits", "bcNorthernRural"])
    if (typeof input[key] === "boolean") result[key] = input[key];
  for (const key of [
    "homeValue",
    "propertyTaxBill",
    "schoolTax",
    "torontoPriorLevy",
    "torontoCarryover",
    "qcOwnershipYears",
    "qcPotentialGrant",
    "qcPrecedingGrant",
    "qcOtherClaims",
    "rent",
    "spend",
    "km",
    "eff",
  ])
    if (finite(input[key])) result[key] = input[key];
  if (record(input.propertyReliefApplied)) {
    // Amounts the bill already reflects, by program id: bounded, and only valid amounts survive.
    const applied: Record<string, number> = {};
    for (const [id, v] of Object.entries(input.propertyReliefApplied).slice(0, 8))
      if (/^[a-z0-9-]{1,64}$/.test(id) && finite(v)) applied[id] = v;
    result.propertyReliefApplied = applied;
  }
  if (finite(input.propOverride, 0, 0.1)) result.propOverride = input.propOverride;
  if (finite(input.whRate, 0, 1)) result.whRate = input.whRate;
  if (finite(input.spendingAdjustment, -100, 1000000)) result.spendingAdjustment = input.spendingAdjustment;
  const people =
    Array.isArray(input.people) && input.people.length ? input.people.slice(0, 2).map(person) : [blank(DEFAULT_INCOME)];
  result.people = people;
  result.portfolios = normalizePortfolios(input.portfolios, people.length, context.portfolioDefaults);
  result.retirement = normalizeRetirements(input.retirement, people.length);
  result.active = input.active === 1 && people.length === 2 ? 1 : 0;
  result.adults =
    finite(input.adults, 1, 4) && Number.isInteger(input.adults)
      ? Math.max(people.length, input.adults)
      : people.length;
  result.kids = finite(input.kids, 0, 6) && Number.isInteger(input.kids) ? input.kids : 0;
  result.under6 = finite(input.under6, 0, result.kids as number) && Number.isInteger(input.under6) ? input.under6 : 0;
  if (!finite(input.spend)) result.spend = spendEst((result.adults as number) + (result.kids as number));
  const care = new ChildcareModel();
  const childDraft = draft(input.childcare);
  care.restore(record(childDraft) ? { ...care.state, ...childDraft } : undefined);
  result.childcare = care.state;
  if (result.dest === result.home) result.dest = result.home === "AB" ? "BC" : "AB";
  return result;
}

/** null means ordinary navigation (use local storage); a malformed scenario means clean defaults. */
export function readScenario(hash: string, context: ScenarioContext): State | null {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  if (!params.has("s")) return null;
  if (params.get("s") !== "1" || params.getAll("s").length !== 1 || hash.length > 50000)
    return scenarioDefaults(context);
  const input: State = {};
  const keys = Object.keys(scenarioDefaults(context)).filter(key => key !== "v");
  for (const key of keys) {
    const values = params.getAll(key);
    if (values.length !== 1) continue;
    try {
      input[key] = JSON.parse(values[0]);
    } catch {
      /* A malformed field uses its default. */
    }
  }
  return normalizeScenario(input, context);
}

export function scenarioHash(value: unknown, context: ScenarioContext): string {
  const state = normalizeScenario(value, context);
  const defaults = scenarioDefaults(context, state.year as number);
  defaults.spend = spendEst((state.adults as number) + (state.kids as number));
  const params = new URLSearchParams({ s: "1", year: String(state.year) });
  for (const [key, field] of Object.entries(state)) {
    if (key === "year" || key === "v" || JSON.stringify(field) === JSON.stringify(defaults[key])) continue;
    if (key === "people") {
      params.set(
        key,
        JSON.stringify(
          (field as Person[]).map((p, i) => {
            const base = blank(i === 0 ? DEFAULT_INCOME : 0);
            return Object.fromEntries(
              Object.entries(p).filter(
                ([k, v]) => v !== (base as unknown as State)[k] && !(v === 0 && ["rrsp", "fhsa"].includes(k)),
              ),
            );
          }),
        ),
      );
    } else if (key === "childcare") {
      const base = new ChildcareModel().state as unknown as State;
      const compact = Object.fromEntries(
        Object.entries(field as State).filter(([k, v]) => JSON.stringify(v) !== JSON.stringify(base[k])),
      );
      if (Array.isArray(compact.children))
        compact.children = compact.children.map(c =>
          Object.fromEntries(Object.entries(c).filter(([, v]) => v !== null && v !== false)),
        );
      params.set(key, JSON.stringify(compact));
    } else if (key === "retirement") {
      params.set(key, JSON.stringify(compactRetirements(field as (Retirement | null)[])));
    } else params.set(key, JSON.stringify(field));
  }
  return `#${params}`;
}
