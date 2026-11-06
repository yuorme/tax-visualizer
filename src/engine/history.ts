import type { CpiData } from "../data/cpi.ts";
import { compute } from "./index.ts";
import { type Household, INCOME_KEYS, type YearData } from "./types.ts";

export type HistoryMode = "real" | "nominal";

/** Hold household composition, rates and driving fixed; scale monetary inputs together. */
export function scaleHousehold(input: Household, factor: number): Household {
  if (!Number.isFinite(factor) || factor <= 0) throw new Error("Income scale must be positive and finite");
  return {
    ...input,
    people: input.people.map(person => {
      const scaled = {
        ...person,
        ...(person.cppQpp !== undefined ? { cppQpp: person.cppQpp * factor } : {}),
        ...(person.retirementIncome !== undefined
          ? {
              retirementIncome: person.retirementIncome.map(r => ({ ...r, amount: r.amount * factor })),
            }
          : {}),
        ...(person.selfEmployment !== undefined ? { selfEmployment: person.selfEmployment * factor } : {}),
        ded: person.ded * factor,
        rrsp: (person.rrsp ?? 0) * factor,
        fhsa: (person.fhsa ?? 0) * factor,
      };
      for (const key of INCOME_KEYS) {
        const value = person[key];
        // Legacy inputs omit other income; keep that shape and never multiply undefined into NaN.
        if (value !== undefined) scaled[key] = value * factor;
      }
      return scaled;
    }),
    homeValue: input.homeValue * factor,
    propertyTaxBills:
      input.propertyTaxBills &&
      Object.fromEntries(
        Object.entries(input.propertyTaxBills).map(([code, bill]) => [
          code,
          bill === undefined ? undefined : bill * factor,
        ]),
      ),
    // Reflected relief is part of the bill's dollars. Legacy inputs omit it; keep that shape.
    ...(input.propertyReliefApplied
      ? {
          propertyReliefApplied: Object.fromEntries(
            Object.entries(input.propertyReliefApplied).map(([code, byProgram]) => [
              code,
              byProgram &&
                Object.fromEntries(
                  Object.entries(byProgram).map(([id, amount]) => [
                    id,
                    amount === undefined ? undefined : amount * factor,
                  ]),
                ),
            ]),
          ),
        }
      : {}),
    rent: input.rent * factor,
    monthlySpending: input.monthlySpending * factor,
    childcare: input.childcare && {
      ...input.childcare,
      children: input.childcare.children?.map(child => ({
        ...child,
        expenses: child.expenses * factor,
        qcEligibleExpenses: child.qcEligibleExpenses === undefined ? undefined : child.qcEligibleExpenses * factor,
      })),
      earnedIncome: input.childcare.earnedIncome?.map(value => (value === null ? null : value * factor)),
      manualClaims: input.childcare.manualClaims?.map(value => value * factor),
      declaredAnnualExpenses:
        input.childcare.declaredAnnualExpenses === undefined
          ? undefined
          : input.childcare.declaredAnnualExpenses * factor,
    },
  };
}

/** Each input amount is in the latest completed CPI year's dollars in real mode. Tax rules stay unscaled. */
export function historyComparison(
  years: YearData[],
  cpi: CpiData,
  input: Household,
  codes: string[],
  mode: HistoryMode,
) {
  const baseYear = Math.max(...Object.keys(cpi.values).map(Number));
  const baseIndex = cpi.values[baseYear];
  const omittedYears: number[] = [];
  const rows = [...years]
    .sort((a, b) => a.year - b.year)
    .flatMap(year => {
      const index = cpi.values[year.year];
      if (mode === "real" && index == null) {
        omittedYears.push(year.year);
        return [];
      }
      const factor = mode === "real" ? index / baseIndex : 1;
      const household = scaleHousehold(input, factor);
      const provinces = codes.map(code => {
        const province = year.provinces.find(p => p.code === code);
        if (!province) throw new Error(`No ${code} data for ${year.year}`);
        const result = compute(year, province, household);
        return {
          code,
          name: province.name,
          income: result.cash / factor,
          tax: result.total / factor,
          rate: result.avg,
        };
      });
      return [{ year: year.year, factor, provinces }];
    });
  return { baseYear, omittedYears, rows };
}
