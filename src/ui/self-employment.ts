import type { YearData } from "../data/schema.ts";
import type { Person } from "../engine/types.ts";
import { yearList } from "./retirement.ts";

/** Shared by saved state and the URL codec; absence and explicit zero remain distinct. */
export const validSelfEmployment = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= Number.MAX_SAFE_INTEGER;

/** undefined is an empty field; null is an invalid draft, which must not replace the last valid amount. */
export function parseSelfEmployment(text: string): number | null | undefined {
  if (!text.trim()) return undefined;
  if (!/^\s*\$?(?:\d+(?:,\d{3})*(?:\.\d{0,2})?|\.\d{1,2})\s*$/.test(text)) return null;
  const value = Number(text.replace(/[$,\s]/g, ""));
  return validSelfEmployment(value) ? value : null;
}

export const selfEmploymentYears = (years: YearData[]) =>
  years
    .filter(y => y.federal.payroll.selfEmployment)
    .map(y => y.year)
    .sort((a, b) => a - b);

export const unsupportedBusinessElection = (person: Person) =>
  (person.selfEmployment ?? 0) > 0 && person.ord === 0 && !!person.employeePayroll?.cppElection;

/** Keep drafts intact while applying only supported inputs, as the retirement section does. */
export function withSelfEmployment(person: Person, data: YearData): Person {
  if (person.selfEmployment === undefined) return person;
  if (!data.federal.payroll.selfEmployment) {
    const { selfEmployment: _profit, ...ordinary } = person;
    return ordinary;
  }
  if (unsupportedBusinessElection(person) && person.employeePayroll) {
    const { cppElection: _election, ...employeePayroll } = person.employeePayroll;
    return { ...person, employeePayroll };
  }
  return person;
}

export function selfEmploymentGate(people: Person[], data: YearData, supported: number[]) {
  if (people.some(p => p.selfEmployment !== undefined) && !data.federal.payroll.selfEmployment)
    return `Self-employment is modelled for ${yearList(supported)} only, so these ${data.year} results exclude the entered business profit.`;
  const names = people.flatMap((p, i) => (unsupportedBusinessElection(p) ? [i ? "your partner" : "you"] : []));
  return names.length
    ? `The employee CPP election isn't applied for ${names.join(" or ")}: self-employed-only elections aren't modelled. Business profit uses ordinary CPP contributions, subject to age limits.`
    : "";
}

/** The page's existing eligible-earnings default, extended with net business profit. */
export const childcareEarnings = (person: Person) => person.ord + (person.oth ?? 0) + (person.selfEmployment ?? 0);
