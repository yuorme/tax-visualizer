import type { YearData } from "../data/schema.ts";
import type { Person, RetirementReceipt } from "../engine/types.ts";
import { yearList } from "./retirement.ts";
import { validSelfEmployment } from "./self-employment.ts";
import { seniorBenefitTooltips, withSeniorBenefits } from "./senior-benefits.ts";

export const RECEIPT_TYPES = {
  rppLifetime: "Workplace lifetime pension",
  rrif: "RRIF / LIF receipt",
  rrspAnnuity: "RRSP annuity",
  rrspWithdrawal: "Ordinary RRSP withdrawal",
} as const;
export const survivorType = (type: RetirementReceipt["type"]) => type === "rrif" || type === "rrspAnnuity";
export const eligibleSurvivor = (receipt: RetirementReceipt) =>
  "survivorEligible" in receipt && receipt.survivorEligible === true;

/** Shared URL/storage migration: omission stays omission; never reinterpret legacy Other income. */
export function normalizeReceipts(value: unknown): RetirementReceipt[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const receipts: RetirementReceipt[] = [];
  for (const item of value.slice(0, 64)) {
    if (!item || typeof item !== "object" || typeof item.type !== "string" || !Object.hasOwn(RECEIPT_TYPES, item.type))
      continue;
    if (!validSelfEmployment(item.amount)) continue;
    const type = item.type as RetirementReceipt["type"];
    receipts.push({
      type,
      amount: item.amount,
      ...(survivorType(type) && typeof item.survivorEligible === "boolean"
        ? { survivorEligible: item.survivorEligible }
        : {}),
    });
  }
  return receipts.length ? receipts : undefined;
}

export const seniorYears = (years: YearData[]) =>
  years
    .filter(y => y.federal.seniorCredits)
    .map(y => y.year)
    .sort((a, b) => a - b);
export const needsReceiptAge = (person: Person) =>
  person.age === undefined && person.retirementIncome?.some(r => survivorType(r.type) && !eligibleSurvivor(r));

export const hasPublicPensions = (person: Person) => person.oas !== undefined || person.cppQpp !== undefined;
export const publicPensionYears = (years: YearData[]) =>
  years
    .filter(y => y.federal.publicPensions)
    .map(y => y.year)
    .sort((a, b) => a - b);
const needsOasAge = (person: Person) => person.oas && (person.age === undefined || person.birthMonth === undefined);

/** Shared URL/storage migration; do not infer public pensions from age or Other income. */
export function normalizePublicPensions(value: { oas?: unknown; cppQpp?: unknown }): Pick<Person, "oas" | "cppQpp"> {
  return {
    ...(typeof value.oas === "boolean" ? { oas: value.oas } : {}),
    ...(validSelfEmployment(value.cppQpp) ? { cppQpp: value.cppQpp } : {}),
  };
}

export function publicPensionGate(people: Person[], data: YearData, supported: number[]) {
  if (!data.federal.publicPensions && people.some(hasPublicPensions))
    return `OAS and CPP/QPP retirement income are modelled for ${yearList(supported)} only. These ${data.year} results exclude these inputs; inputs are retained.`;
  if (people.some(needsOasAge))
    return "Enter both birth year and month under Age and CPP/QPP to apply OAS. Results exclude OAS until then; entered CPP/QPP retirement income still applies.";
  return "";
}

/** Retain drafts, but never send unsupported or incomplete receipts to the engine. */
export function withSeniorIncome(person: Person, data: YearData): Person {
  person = withSeniorBenefits(person, data);
  const { oas, cppQpp, ...other } = person;
  person = {
    ...other,
    ...(data.federal.publicPensions
      ? {
          ...(oas !== undefined && !needsOasAge(person) ? { oas } : {}),
          ...(cppQpp !== undefined ? { cppQpp } : {}),
        }
      : {}),
  };
  if (!person.retirementIncome) return person;
  const { retirementIncome, ...ordinary } = person;
  if (!data.federal.seniorCredits) return ordinary;
  const applied = retirementIncome.filter(
    r => person.age !== undefined || !survivorType(r.type) || eligibleSurvivor(r),
  );
  return applied.length ? { ...ordinary, retirementIncome: applied } : ordinary;
}

export function seniorGate(people: Person[], data: YearData, supported: number[], hasAge: boolean) {
  if (!data.federal.seniorCredits && (hasAge || people.some(p => p.retirementIncome)))
    return `Age and pension credits are modelled for ${yearList(supported)} only. These ${data.year} results exclude typed retirement receipts and age/pension credits; inputs are retained.`;
  if (people.some(needsReceiptAge))
    return "Enter both birth year and month under Age and CPP/QPP to apply RRIF or RRSP annuity receipts without eligible-survivor status. Results exclude those receipts until then.";
  return "";
}

export function seniorTooltips(years: YearData[]): Record<string, string> {
  const rules = [...years].sort((a, b) => b.year - a.year).find(y => y.federal.publicPensions)?.federal
    .publicPensions?.params;
  return {
    ...seniorBenefitTooltips(years),
    publicPensions: `OAS and CPP/QPP retirement income are modelled for ${yearList(publicPensionYears(years))} only. Enable full resident OAS separately for each adult. Birth year and month under Age and CPP/QPP supply age on December 31. OAS begins the month after the ${rules?.minimumAge}th birthday; the higher ${rules?.increasedAge}+ amount begins the month after the ${rules?.increasedAge}th birthday. A December birthday takes effect the following year; no day-of-month exceptions are modelled. Calendar-year OAS sums the published monthly amounts for each quarter, not an annualized run rate. Recovery is current-year liability, not withholding based on the preceding return. Full entitlement, full-year residence and commencement at ${rules?.minimumAge} are assumed; OAS deferral and residency rules are not modelled. CPP/QPP is the annual gross retirement benefit you enter, not an entitlement estimate or a payroll stop election. Do not enter an amount here and in Other income or another retirement receipt: remove it from the old field first. Existing Other income is never moved automatically. Neither public pension qualifies for pension-income credits. OAS is excluded from Quebec's Health Services Fund base; CPP/QPP is included. GIS and the Allowance have separate opt-ins below; provincial seniors' supplements are described under GIS and Allowance.`,
    oasRecovery:
      "OAS recovery is current-year liability, not withholding based on the preceding return. The engine caps recovery at this year's modelled OAS plus GIS/Allowance receipts, deducts it from net income and adds it once to federal tax after credits and Quebec abatement. Quebec uses the same recovery deduction. The deduction is already included in total deductions; it is not another cash subtraction. Gross OAS is cash income, not a refundable credit. Withholding is unknown and is not charged again.",
    seniorIncome: `Age and pension credits are modelled for ${yearList(seniorYears(years))} only. Enter additional retained, taxable domestic receipts after rollovers. Move any amounts already in Other income here; copying them counts the income twice. Workplace lifetime pensions, RRIF/LIF receipts, RRSP annuities and ordinary RRSP withdrawals have different eligibility; the engine applies each jurisdiction's rules, income phase-outs and permitted unused spouse credit transfers. Ordinary RRSP withdrawals do not qualify for the federal pension credit, but Quebec treats them differently. Birth year and month under Age and CPP/QPP provide age on December 31 of each tax year; age credits apply for the full year of reaching the qualifying age. RRIF minimums, OAS/CPP deferral and residency rules are not modelled. Neither are pension splitting, foreign/special slips, Schedule B transfer deductions or CPP entitlement estimates; full resident OAS has its separate opt-in in this section. These receipts are subject to Quebec's Health Services Fund; unclassified Other income still cannot exclude OAS or identify special deductions.`,
    seniorSurvivor:
      "Select only for an RRIF/LIF or RRSP annuity receipt eligible because of the death of a spouse or common-law partner. This is an eligibility assertion for this receipt, not a switch for every inherited withdrawal. Otherwise leave it unchecked and enter birth year and month so age-based eligibility can be determined.",
  };
}
