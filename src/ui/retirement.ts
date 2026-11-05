// Retirement-age employee CPP/QPP inputs: what the page keeps for each person and how it reaches the engine.
// Nothing here computes tax. The page keeps a birth year rather than an age, because Person.age means the age at the
// end of one tax year and the selected year and every history row need their own. Absent or incomplete inputs leave
// the person exactly as entered, so the engine's legacy payroll path stays untouched. No DOM access, so tests run it.

import type { CpiData } from "../data/cpi.ts";
import type { YearData } from "../data/schema.ts";
import { type HistoryMode, historyComparison } from "../engine/history.ts";
import type { RetirementPayroll } from "../engine/payroll.ts";
import type { EmployeePayrollInput, Household, PayrollMonth, Person } from "../engine/types.ts";

/** A month entered in two boxes: either can be blank, and it reaches the engine only once both are set. */
export interface MonthDraft {
  year: number | null;
  month: number | null;
}
export const RETIREMENT_DATES = ["pensionSince", "cppStop", "cppRestart", "qppStop", "qppRestart"] as const;
type DateKey = (typeof RETIREMENT_DATES)[number];

/** One person's inputs. Election dates are the months a completed form reached the employer, not effective months. */
export type Retirement = Record<DateKey, MonthDraft> & {
  birthYear: number | null;
  birthMonth: number | null;
  /** Twelve relative monthly amounts, January first; null is equal monthly pay. They divide employment income. */
  weights: number[] | null;
};

const MIN_YEAR = 1900;
const MAX_YEAR = 2100;
const MAX_WEIGHT = 1000000;
const MONTHS_IN_YEAR = 12;

const validYear = (v: unknown): v is number =>
  typeof v === "number" && Number.isInteger(v) && v >= MIN_YEAR && v <= MAX_YEAR;
const validMonth = (v: unknown): v is number =>
  typeof v === "number" && Number.isInteger(v) && v >= 1 && v <= MONTHS_IN_YEAR;
const validWeight = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= MAX_WEIGHT;
const record = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

export const emptyRetirement = (): Retirement => ({
  birthYear: null,
  birthMonth: null,
  pensionSince: { year: null, month: null },
  cppStop: { year: null, month: null },
  cppRestart: { year: null, month: null },
  qppStop: { year: null, month: null },
  qppRestart: { year: null, month: null },
  weights: null,
});

/** A saved entry, keeping only known fields and valid values. null: nothing usable, so this person is unaffected. */
export function normalizeRetirement(value: unknown): Retirement | null {
  if (!record(value)) return null;
  const result = emptyRetirement();
  if (validYear(value.birthYear)) result.birthYear = value.birthYear;
  if (validMonth(value.birthMonth)) result.birthMonth = value.birthMonth;
  for (const key of RETIREMENT_DATES) {
    const saved = value[key];
    if (!record(saved)) continue;
    if (validYear(saved.year)) result[key].year = saved.year;
    if (validMonth(saved.month)) result[key].month = saved.month;
  }
  const weights = value.weights;
  if (Array.isArray(weights) && weights.length === MONTHS_IN_YEAR && weights.every(validWeight))
    result.weights = weights;
  return JSON.stringify(result) === JSON.stringify(emptyRetirement()) ? null : result;
}

/** One entry per person at most, without trailing empty entries, so an unused section adds nothing to a link. */
export function normalizeRetirements(value: unknown, people: number): (Retirement | null)[] {
  if (!Array.isArray(value)) return [];
  const list = Array.from(value.slice(0, people), normalizeRetirement);
  while (list.length && list[list.length - 1] === null) list.pop();
  return list;
}

/** A shorter form for links: blank fields are left out, and normalizeRetirement fills them back in. */
export const compactRetirements = (list: (Retirement | null)[]) =>
  list.map(
    entry =>
      entry &&
      Object.fromEntries(
        Object.entries(entry)
          .filter(([, field]) => field !== null && JSON.stringify(field) !== '{"year":null,"month":null}')
          .map(([key, field]) =>
            RETIREMENT_DATES.some(date => date === key)
              ? [key, Object.fromEntries(Object.entries(field as MonthDraft).filter(([, part]) => part !== null))]
              : [key, field],
          ),
      ),
  );

/** Both parts of the birth date: the engine needs age and birth month together, or neither. */
export const retirementActive = (
  entry: Retirement | null,
): entry is Retirement & { birthYear: number; birthMonth: number } =>
  entry?.birthYear != null && entry.birthMonth != null;
export const retirementStarted = (entry: Retirement | null) => entry !== null && !retirementActive(entry);

const whole = (d: MonthDraft): PayrollMonth | undefined =>
  d.year !== null && d.month !== null ? { year: d.year, month: d.month } : undefined;
export const payHasTotal = (weights: number[] | null) => weights?.some(weight => weight > 0) ?? false;

const election = (stop: MonthDraft, restart: MonthDraft) => {
  const from = whole(stop);
  if (!from) return undefined;
  const to = whole(restart);
  return to ? { stop: from, restart: to } : { stop: from };
};

/** Only what was set: a blank field reaching the engine would be a malformed input rather than an absent one. */
function employeePayroll(entry: Retirement): EmployeePayrollInput | undefined {
  const retirementPensionSince = whole(entry.pensionSince);
  const cppElection = election(entry.cppStop, entry.cppRestart);
  const qppElection = election(entry.qppStop, entry.qppRestart);
  const result: EmployeePayrollInput = {
    ...(retirementPensionSince && { retirementPensionSince }),
    ...(cppElection && { cppElection }),
    ...(qppElection && { qppElection }),
    ...(entry.weights && payHasTotal(entry.weights) && { monthlyEarningsWeights: [...entry.weights] }),
  };
  return Object.keys(result).length ? result : undefined;
}

/** inactive: nothing to apply. no-data: the year has no retirement payroll rules. young: the engine doesn't cover
 *  the year contributions first start or earlier. The higher start age covers every province the chart compares. */
export type RetirementCoverage = "inactive" | "applied" | "no-data" | "young";

export function retirementCoverage(entry: Retirement | null, data: YearData): RetirementCoverage {
  if (!retirementActive(entry)) return "inactive";
  const rules = data.federal.payroll.employeeRetirement;
  if (!rules) return "no-data";
  const start = Math.max(rules.cpp.params.contributionStartAge, rules.qpp.params.contributionStartAge);
  return data.year - entry.birthYear <= start ? "young" : "applied";
}

/** The person for one tax year: the age follows the year, and the calendar dates stay as entered. */
export function withRetirement(person: Person, entry: Retirement | null, data: YearData): Person {
  if (retirementCoverage(entry, data) !== "applied" || !retirementActive(entry)) return person;
  const payroll = employeePayroll(entry);
  return {
    ...person,
    age: data.year - entry.birthYear,
    birthMonth: entry.birthMonth,
    ...(payroll && { employeePayroll: payroll }),
  };
}

export const retirementYears = (years: YearData[]) =>
  years
    .filter(y => y.federal.payroll.employeeRetirement)
    .map(y => y.year)
    .sort((a, b) => a - b);

/** "2025", "2025 and 2026", "2019–2024" */
export function yearList(list: number[]) {
  const consecutive = list.every((year, i) => i === 0 || year === list[i - 1] + 1);
  if (list.length > 2 && consecutive) return `${list[0]}–${list[list.length - 1]}`;
  return list.length < 2 ? list.join("") : `${list.slice(0, -1).join(", ")} and ${list[list.length - 1]}`;
}

/** The selected year's results without some of what was entered: said beside them, not left to look complete. */
export function retirementGate(entries: (Retirement | null)[], data: YearData, supported: number[], names: string[]) {
  const coverage = entries.map(entry => retirementCoverage(entry, data));
  if (coverage.includes("no-data"))
    return `Retirement-age CPP/QPP is modelled for ${yearList(supported)} only, so these ${data.year} results use ordinary CPP/QPP.`;
  const young = entries.flatMap((entry, i) => {
    if (coverage[i] !== "young" || !retirementActive(entry)) return [];
    const age = data.year - entry.birthYear;
    return [age < 0 ? names[i] : `${names[i]} (age ${age})`];
  });
  return young.length
    ? `Retirement-age CPP/QPP isn't modelled for ${young.join(" or ")} in ${data.year}, so ordinary CPP/QPP applies.`
    : "";
}

/** What the selected year's person looks like, for the section's collapsed summary. */
export function retirementSummary(entry: Retirement | null, data: YearData) {
  const coverage = retirementCoverage(entry, data);
  if (coverage === "applied" && retirementActive(entry)) return `age ${data.year - entry.birthYear} in ${data.year}`;
  if (coverage === "no-data" || coverage === "young") return `not applied in ${data.year}`;
  return retirementStarted(entry) ? "incomplete" : "not set";
}

const ELECTION_TEXT: Record<RetirementPayroll["election"], string> = {
  none: "",
  stopped: "the stop election is valid",
  restarted: "the stop and restart are valid",
  "ineligible-stop": "the stop election isn't valid at that date, so it has no effect",
  "ineligible-restart": "the restart isn't valid at that date, so the stop stays in force",
};

/** One plan's outcome in the selected year. An election the engine rejected has no effect, so it has to be said. */
export function retirementResult(result: RetirementPayroll, plan: string, money: (n: number) => string) {
  const months = result.contributoryMonths.length;
  const election = ELECTION_TEXT[result.election];
  const parts = [
    `${plan} applies to ${months} of ${MONTHS_IN_YEAR} months, on ${money(result.pensionableEarnings)} of employment income${election ? `; ${election}` : ""}.`,
  ];
  if (result.overpayment > 0.5)
    parts.push(
      `${money(result.overpayment)} withheld above the annual requirement comes back at filing, so it isn't counted.`,
    );
  return parts.join(" ");
}

/** The section's status line for the selected person, in the home province's plan. */
export function retirementStatus(
  entry: Retirement | null,
  data: YearData,
  result: RetirementPayroll | undefined,
  plan: string,
  money: (n: number) => string,
) {
  if (retirementStarted(entry)) return "Enter both the birth year and month to apply these inputs.";
  const coverage = retirementCoverage(entry, data);
  if (coverage === "no-data") return `Not applied: ${data.year} has no retirement-age payroll rules.`;
  if (coverage === "young") return `Not applied in ${data.year}: this age isn't modelled.`;
  return result ? retirementResult(result, plan, money) : "";
}

type Comparison = ReturnType<typeof historyComparison>;
export interface RetirementHistory extends Comparison {
  noSelfEmploymentData: number[];
  noData: number[]; // years left out: no retirement payroll rules
  young: number[]; // years left out: a person is too young for the retirement payroll rules
}

/**
 * historyComparison holds one household for every row, but a person's age differs by row, so each year is its own
 * call. Years that can't take the entered inputs are left out first: computing them would throw and lose every row.
 */
export function retirementHistory(
  years: YearData[],
  cpi: CpiData,
  entries: (Retirement | null)[],
  inputFor: (data: YearData) => Household,
  home: string,
  mode: HistoryMode,
  selfEmployment = false,
  seniorIncome = false,
  publicPensions = false,
): RetirementHistory {
  const sorted = [...years].sort((a, b) => a.year - b.year);
  const covered = (data: YearData) =>
    (!seniorIncome || !!data.federal.seniorCredits) &&
    (!publicPensions || !!data.federal.publicPensions) &&
    (!selfEmployment || !!data.federal.payroll.selfEmployment) &&
    entries.every(entry => ["inactive", "applied"].includes(retirementCoverage(entry, data)));
  const left = (reason: RetirementCoverage) =>
    sorted.filter(data => entries.some(entry => retirementCoverage(entry, data) === reason)).map(data => data.year);
  const parts = sorted.filter(covered).map(data => historyComparison([data], cpi, inputFor(data), [home], mode));
  return {
    baseYear: historyComparison([], cpi, inputFor(sorted[0]), [home], mode).baseYear,
    omittedYears: parts.flatMap(part => part.omittedYears),
    rows: parts.flatMap(part => part.rows),
    noData: left("no-data"),
    young: left("young"),
    noSelfEmploymentData: sorted
      .filter(data => selfEmployment && !data.federal.payroll.selfEmployment)
      .map(data => data.year),
  };
}

/** The history tooltip's account of the years left out. */
export function historyRetirementNote({ noData, young }: RetirementHistory, supported: number[]) {
  const notes = [];
  if (noData.length)
    notes.push(
      `Retirement-age CPP/QPP is modelled only for ${yearList(supported)}, so ${yearList(noData)} are left out.`,
    );
  if (young.length)
    notes.push(`${yearList(young)} left out: retirement-age CPP/QPP isn't modelled for an age that young.`);
  return notes.length ? ` ${notes.join(" ")}` : "";
}

/** A typed four-digit year, or null while it's blank, unfinished or out of range. */
export function parseYear(text: string): number | null {
  const value = /^\s*(\d{4})\s*$/.exec(text)?.[1];
  return value !== undefined && validYear(Number(value)) ? Number(value) : null;
}

/** A typed relative monthly amount. A cleared box is 0; anything else unreadable is null, and the box keeps its value. */
export function parseWeight(text: string): number | null {
  if (text.trim() === "") return 0;
  const match = /^\s*\$?(\d+(?:\.\d*)?|\.\d+)\s*$/.exec(text.replace(/,/g, ""));
  if (!match) return null;
  const value = Number(match[1]);
  return validWeight(value) ? value : null;
}
