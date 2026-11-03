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
        ded: person.ded * factor,
        rrsp: (person.rrsp ?? 0) * factor,
        fhsa: (person.fhsa ?? 0) * factor,
      };
      for (const key of INCOME_KEYS) scaled[key] = person[key] * factor;
      return scaled;
    }),
    homeValue: input.homeValue * factor,
    rent: input.rent * factor,
    monthlySpending: input.monthlySpending * factor,
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
