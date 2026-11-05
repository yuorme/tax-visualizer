import type { Federal } from "../data/schema.ts";
import type { Person } from "./types.ts";

export class UnsupportedPublicPensionsError extends Error {
  readonly year: number;
  constructor(year: number) {
    super(`OAS and CPP/QPP retirement income are not supported by the ${year} data`);
    this.name = "UnsupportedPublicPensionsError";
    this.year = year;
  }
}

/** Opt-in full resident pension starting after age 65, without deferral, residency proration or arrears.
 * The same birthday month used by payroll determines the first receipt and the 75+ increase. */
export function publicPensionReceipts(fed: Federal, x: Person) {
  const active = x.oas !== undefined || x.cppQpp !== undefined;
  if (active && !fed.publicPensions) throw new UnsupportedPublicPensionsError(fed.year);
  if (x.oas !== undefined && typeof x.oas !== "boolean") throw new RangeError("OAS must be a boolean opt-in");
  if (x.cppQpp !== undefined && (!Number.isFinite(x.cppQpp) || x.cppQpp < 0))
    throw new RangeError("CPP/QPP retirement income must be finite and nonnegative");
  const monthly = Array<number>(12).fill(0);
  if (x.oas && fed.publicPensions) {
    if (x.age === undefined || !Number.isSafeInteger(x.age) || x.age < 0)
      throw new RangeError("OAS requires a whole, nonnegative year-end age");
    if (x.birthMonth === undefined || !Number.isInteger(x.birthMonth) || x.birthMonth < 1 || x.birthMonth > 12)
      throw new RangeError("OAS requires birthMonth from 1 to 12");
    const q = fed.publicPensions.params;
    const { age, birthMonth } = x;
    const eligible = (boundary: number, month: number) =>
      age > boundary || (age === boundary && month >= birthMonth + q.effectiveMonthOffset);
    for (let month = 1; month <= 12; month++) {
      if (eligible(q.minimumAge, month))
        monthly[month - 1] = q.quarterlyMonthly[Math.floor((month - 1) / 3)][eligible(q.increasedAge, month) ? 1 : 0];
    }
  }
  // Sum cents so published monthly receipt rounding is retained in the annual total.
  const oas = monthly.reduce((sum, amount) => sum + Math.round(amount * 100), 0) / 100;
  return { oas, cppQpp: x.cppQpp ?? 0, monthly };
}

/** T1 worksheet line 23500 / 42200: income BEFORE this deduction, capped at gross OAS receipts.
 * Withholding based on earlier returns is a payment on account, not this year's liability. */
export function oasRecoveryTax(fed: Federal, gross: number, incomeBeforeRecovery: number): number {
  const q = fed.publicPensions?.params;
  return q ? Math.min(gross, q.recoveryRate * Math.max(0, incomeBeforeRecovery - q.recoveryThreshold)) : 0;
}
