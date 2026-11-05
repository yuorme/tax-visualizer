export { ccbOf, provincialChildBenefit } from "./benefits.ts";
export { type BracketLine, phased, walk } from "./brackets.ts";
export { carbonCostsOf, carbonRebatesOf } from "./carbon.ts";
export { type ChildcareChild, type ChildcareInput, type ChildcareResult, childcareOf } from "./childcare.ts";
export { type ChildcareCreditResult, childcareCreditOf } from "./childcare-credits.ts";
export { creditsOf } from "./credits.ts";
export { type FuelTax, fuelTaxOf, type RatePeriod, ratePeriods, yearAverage } from "./fuel.ts";
export { householdPremiumOf } from "./health-premiums.ts";
export { type Claim, compute, computeAll, hasInv, household, propertyRate, type Result } from "./household.ts";
export {
  deductionsOf,
  healthPremium,
  type NetIncomeParts,
  netIncomeParts,
  netOf,
  payrollDetailsOf,
  payrollOf,
  rrspRoom,
} from "./payroll.ts";
export { type PersonResult, personTax, provincialBpa } from "./personal.ts";
export { UnsupportedSelfEmploymentError } from "./self-employment.ts";
export { UnsupportedSeniorCreditsError } from "./senior-credits.ts";
export * from "./types.ts";
