import type { Federal, Province } from "../data/schema.ts";
import type { PersonResult } from "./personal.ts";
import { type Person, retirementCashOf } from "./types.ts";

export class UnsupportedSeniorCreditsError extends Error {
  readonly year: number;
  constructor(year: number) {
    super(`Age and pension credits are not supported by the ${year} data`);
    this.name = "UnsupportedSeniorCreditsError";
    this.year = year;
  }
}

export const hasSeniorInputs = (x: Person) => x.age !== undefined || x.retirementIncome !== undefined;

/** Validate even when personal credits are disabled: receipts must never disappear from income. */
export function validateSeniorInputs(fed: Federal, x: Person, p?: Province | null) {
  if (!hasSeniorInputs(x)) return;
  if (!fed.seniorCredits || (p && !p.seniorCredits)) throw new UnsupportedSeniorCreditsError(fed.year);
  if (x.age !== undefined && (!Number.isSafeInteger(x.age) || x.age < 0))
    throw new RangeError("Age must be a whole, nonnegative year-end age");
  if (x.retirementIncome !== undefined && !Array.isArray(x.retirementIncome))
    throw new RangeError("Retirement income must be a list of typed receipts");
  for (const r of x.retirementIncome ?? []) {
    if (
      !r ||
      !["rppLifetime", "rrif", "rrspAnnuity", "rrspWithdrawal"].includes(r.type) ||
      !Number.isFinite(r.amount) ||
      r.amount < 0
    )
      throw new RangeError("Unsupported retirement receipt or invalid amount");
    if (
      "survivorEligible" in r &&
      (typeof r.survivorEligible !== "boolean" || !["rrif", "rrspAnnuity"].includes(r.type))
    )
      throw new RangeError("Survivor eligibility is supported only for RRIF and RRSP annuity receipts");
    if ((r.type === "rrif" || r.type === "rrspAnnuity") && x.age === undefined && !r.survivorEligible)
      throw new RangeError("RRIF and RRSP annuity eligibility requires age or eligible survivor status");
  }
  if (!Number.isFinite(retirementCashOf(x))) throw new RangeError("Retirement income total must be finite");
}

export function seniorBases(fed: Federal, p: Province, x: Person, net: number, enabled: boolean) {
  validateSeniorInputs(fed, x, p);
  const f = fed.seniorCredits;
  const q = p.seniorCredits;
  const ageBase = (rule: NonNullable<Federal["seniorCredits"]>["age"]) => {
    const a = rule.params;
    return x.age !== undefined && x.age >= a.minimumAge
      ? Math.max(0, a.maximum - a.reductionRate * Math.max(0, net - a.threshold))
      : 0;
  };
  const eligible = f
    ? (x.retirementIncome ?? []).reduce(
        (sum, r) =>
          sum +
          (r.type === "rppLifetime" ||
          ((r.type === "rrif" || r.type === "rrspAnnuity") &&
            ((x.age !== undefined && x.age >= f.pension.params.minimumRrifAge) || r.survivorEligible))
            ? r.amount
            : 0),
        0,
      )
    : 0;
  const federalAge = enabled && f ? ageBase(f.age) : 0;
  const federalPension = enabled && f ? Math.min(f.pension.params.maximum, eligible) : 0;
  const cra = q && !("program" in q) ? q : undefined;
  const provincialAge = enabled && cra ? (cra.age.program === "federal-age-copy" ? federalAge : ageBase(cra.age)) : 0;
  const provincialPension = enabled && cra ? Math.min(cra.pension.params.maximum, federalPension) : 0;
  const supplement = cra?.supplementary?.params;
  const supplementary =
    enabled && supplement && x.age !== undefined && x.age >= supplement.minimumAge ? supplement.amount : 0;
  return {
    federalAge,
    federalPension,
    provincialAge,
    provincialPension,
    supplementary,
    eligibleFederal: eligible,
    eligibleQuebec: retirementCashOf(x),
  };
}

/** S2's designated prior subtotal excludes spouse amounts, dividends, family benefits and incoming transfers.
 * NL's line 35 includes its childcare base; Yukon's employment amount is included in pEmpFull. */
export function seniorTransfer(donor: PersonResult, p: Province, federalRate: number) {
  const b = donor.breakdown.seniorCredits;
  const federalEquivalent = donor.ti <= donor.f.lines[0].hi ? donor.ti : donor.f.tax / federalRate;
  const federalCapacity = Math.max(0, federalEquivalent - donor.fAmt - donor.fEmpFull / federalRate);
  const provincialRate = p.brackets[0][1];
  const provincialEquivalent = donor.tiP <= p.brackets[0][0] ? donor.tiP : donor.pr.tax / provincialRate;
  const provincialCapacity = Math.max(
    0,
    provincialEquivalent - donor.pAmt - (donor.pEmpFull + donor.breakdown.childcareCredit.calculated) / provincialRate,
  );
  const child = p.claimants?.childAmount?.transfer === "schedule-2" ? donor.kidAmt : 0;
  const senior = b.provincialAge + b.provincialPension + b.supplementary;
  // Personal calculation consumes child bases before senior bases. Partition the ONE unused pool accordingly.
  const childUnused = Math.max(0, child - provincialCapacity);
  const provincialUnused = Math.max(0, child + senior - provincialCapacity);
  return {
    federal: Math.max(0, b.federalAge + b.federalPension - federalCapacity),
    provincial: provincialUnused - childUnused,
    child: childUnused,
    spouseAge: b.provincialAge > provincialCapacity && provincialUnused > 0,
    federalCapacity,
    provincialCapacity,
  };
}

export function quebecSeniorPool(p: Province, people: Person[], nets: number[], livingAlone: boolean) {
  const rule = p.seniorCredits;
  if (!rule || !("program" in rule)) return 0;
  const q = rule.params;
  const base =
    (livingAlone ? q.livingAlone : 0) +
    people.reduce(
      (sum, x) =>
        sum +
        (x.age !== undefined && x.age >= q.minimumAge ? q.ageAmount : 0) +
        Math.min(q.retirementMaximum, q.retirementMultiplier * retirementCashOf(x)),
      0,
    );
  return Math.max(0, base - q.reductionRate * Math.max(0, nets.reduce((sum, n) => sum + n, 0) - q.familyThreshold));
}
