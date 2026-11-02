// Fuel tax on gasoline: litres bought in a year (distance × fuel efficiency) times the federal excise tax, the
// provincial or territorial fuel tax and the reference city's regional transit tax. GST/HST and QST on gasoline
// aren't added here: gasoline is part of taxable spending, so the sales tax line already counts them.
import type { Driving, FuelRate, Province, YearData } from "./types.ts";

/** One stretch of the year at one rate: from and to are YYYY-MM-DD, `to` the day after the last day. */
export interface RatePeriod {
  from: string;
  to: string;
  rate: number;
  share: number; // share of the year's days
  note?: string;
}

const DAY = 86_400_000;
const days = (from: string, to: string) => (Date.parse(to) - Date.parse(from)) / DAY;

/** The year split into the stretches each rate applied (one stretch for a rate that never changed). */
export function ratePeriods(r: FuelRate, year: number): RatePeriod[] {
  const start = `${year}-01-01`,
    end = `${year + 1}-01-01`;
  const list = typeof r === "number" ? [{ from: start, rate: r }] : r;
  const total = days(start, end);
  return list.map((x, i) => {
    const to = list[i + 1]?.from ?? end;
    return { ...x, to, share: days(x.from, to) / total };
  });
}

/** The year's average rate per litre, each rate weighted by the days it applied: driving is taken to be spread
 *  evenly through the year. */
export const yearAverage = (r: FuelRate, year: number) =>
  ratePeriods(r, year).reduce((a, x) => a + x.rate * x.share, 0);

/** Fuel tax for one province: per-litre rates (year averages) and dollars a year. */
export interface FuelTax {
  litres: number;
  /** Year-average tax per litre by government, and their sum. */
  perLitre: { federal: number; provincial: number; regional: number; total: number };
  federal: number;
  provincial: number;
  regional: number;
  /** The regional transit authority (TransLink, ARTM), if the reference city has one. */
  regionalName: string | null;
  total: number;
}

/** Fuel tax in province p for the household's driving, or null when the year's data has no fuel taxes. No driving
 *  entered means no litres. */
export function fuelTaxOf(y: YearData, p: Province, driving?: Driving): FuelTax | null {
  const fed = y.federal.fuelTax,
    prov = p.fuelTax;
  if (!fed || !prov) return null;
  const litres = driving ? (Math.max(0, driving.km) * Math.max(0, driving.lPer100km)) / 100 : 0;
  const federal = yearAverage(fed.gasoline, y.year),
    provincial = yearAverage(prov.gasoline, y.year),
    regional = prov.regional ? yearAverage(prov.regional.gasoline, y.year) : 0;
  const perLitre = { federal, provincial, regional, total: federal + provincial + regional };
  return {
    litres,
    perLitre,
    federal: litres * federal,
    provincial: litres * provincial,
    regional: litres * regional,
    regionalName: prov.regional?.name ?? null,
    total: litres * perLitre.total,
  };
}
