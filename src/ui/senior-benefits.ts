import type { YearData } from "../data/schema.ts";
import type { Person } from "../engine/types.ts";
import { yearList } from "./retirement.ts";

export const hasSeniorBenefits = (person: Person) => person.gis !== undefined || person.allowance !== undefined;
export const seniorBenefitYears = (years: YearData[]) =>
  years
    .filter(y => y.federal.gisAllowance)
    .map(y => y.year)
    .sort((a, b) => a - b);
const missingDate = (person: Person) => person.age === undefined || person.birthMonth === undefined;

/** Both persistence paths preserve omission and explicit false; age never implies an application. */
export function normalizeSeniorBenefits(value: {
  gis?: unknown;
  allowance?: unknown;
}): Pick<Person, "gis" | "allowance"> {
  return {
    ...(typeof value.gis === "boolean" ? { gis: value.gis } : {}),
    ...(typeof value.allowance === "boolean" ? { allowance: value.allowance } : {}),
  };
}

export function withSeniorBenefits(person: Person, data: YearData): Person {
  const { gis, allowance, ...other } = person;
  return {
    ...other,
    ...(data.federal.gisAllowance
      ? {
          ...(gis !== undefined && (!gis || !missingDate(person)) ? { gis } : {}),
          ...(allowance !== undefined && (!allowance || !missingDate(person)) ? { allowance } : {}),
        }
      : {}),
  };
}

export function seniorBenefitGate(people: Person[], data: YearData, supported: number[]) {
  if (!data.federal.gisAllowance && people.some(hasSeniorBenefits))
    return `GIS and the Allowance are modelled for ${yearList(supported)} only. These ${data.year} results exclude these inputs; inputs are retained.`;
  if (people.some(p => (p.gis || p.allowance) && missingDate(p)))
    return "Enter both birth year and month under Age and CPP/QPP to apply GIS or the Allowance. Results exclude the incomplete adult's opt-ins until then; inputs are retained.";
  return "";
}

export function seniorBenefitTooltips(years: YearData[]): Record<string, string> {
  const rules = [...years].sort((a, b) => b.year - a.year).find(y => y.federal.gisAllowance)?.federal
    .gisAllowance?.params;
  return {
    seniorBenefits: `GIS and the Allowance are modelled for ${yearList(seniorBenefitYears(years))} only. Opt in separately for each adult; age alone never enables a benefit. GIS requires Full resident OAS to be entered and pays only in months with OAS receipts. The spouse/common-law switch chooses married/common-law rates; without it, each adult uses the single category, including separated, divorced and widowed pensioners. A spouse receiving OAS, the Allowance or neither changes the GIS category. The Allowance requires a GIS recipient spouse; Allowance for the Survivor is not modelled. Full Canadian residence, legal eligibility, qualifying entitlement and timely application are assumed; partial residency, sponsorship bars, residence abroad, incarceration, involuntary separation and marital-status changes are not modelled.`,
    seniorBenefitTiming: `GIS and the Allowance: ${yearList(seniorBenefitYears(years))} only. GIS requires Full resident OAS to be entered and pays only in months with OAS receipts. Real GIS uses prior-year income: the calendar year before the July–June payment period begins. Entered selected-year income and payroll stand in for both historical income years, held constant across quarters; this income-year proxy is not a first-year retirement award forecast. The engine applies the separate GIS income test, earnings exemptions and supported deductions, excluding OAS and supplements. Birth year and month supply age on December 31. Allowance begins the month after the ${rules?.allowanceMinimumAge}th birthday and continues through the ${rules?.allowanceEndAge}th birthday month. OAS and GIS can begin the following month if opted in. A December birthday takes effect the following year; no day-of-month exceptions are modelled. Annual benefits sum monthly receipts at each quarter's published rates.`,
    seniorBenefitTax:
      "GIS and the Allowance are gross cash benefits, netted off household tax once, even with refundable credits or personal credits disabled. They are excluded from the chart's income denominator: cash left is income less net tax, which already includes these benefits. They enter federal and Quebec net income for income-tested programs; the other-payments deduction removes them from taxable income after any supplement recovery. Recovery is deducted from net income and added once to federal tax; it is not a second cash subtraction or withholding estimate. Do not also enter these benefits in Other income or retirement receipts. Provincial seniors' supplements are not modelled.",
  };
}
