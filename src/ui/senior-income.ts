import type { YearData } from "../data/schema.ts";
import type { Person, RetirementReceipt } from "../engine/types.ts";
import { yearList } from "./retirement.ts";
import { validSelfEmployment } from "./self-employment.ts";

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

/** Retain drafts, but never send unsupported or incomplete receipts to the engine. */
export function withSeniorIncome(person: Person, data: YearData): Person {
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
  return {
    seniorIncome: `Age and pension credits are modelled for ${yearList(seniorYears(years))} only. Enter additional retained, taxable domestic receipts after rollovers. Move any amounts already in Other income here; copying them counts the income twice. Workplace lifetime pensions, RRIF/LIF receipts, RRSP annuities and ordinary RRSP withdrawals have different eligibility; the engine applies each jurisdiction's rules, income phase-outs and permitted unused spouse credit transfers. Ordinary RRSP withdrawals do not qualify for the federal pension credit, but Quebec treats them differently. Birth year and month under Age and CPP/QPP provide age on December 31 of each tax year; age credits apply for the full year of reaching the qualifying age. RRIF minimums, OAS/CPP deferral and residency rules are not modelled. Neither are pension splitting, foreign/special slips, Schedule B transfer deductions or OAS/GIS/CPP benefit entitlements. These receipts are subject to Quebec's Health Services Fund; unclassified Other income still cannot exclude OAS or identify special deductions.`,
    seniorSurvivor:
      "Select only for an RRIF/LIF or RRSP annuity receipt eligible because of the death of a spouse or common-law partner. This is an eligibility assertion for this receipt, not a switch for every inherited withdrawal. Otherwise leave it unchecked and enter birth year and month so age-based eligibility can be determined.",
  };
}
