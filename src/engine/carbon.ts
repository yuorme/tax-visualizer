// Direct household carbon costs and cash rebates. Embedded costs in goods and electricity are excluded.
import type { Province } from "../data/schema.ts";
import { yearAverage } from "./fuel.ts";
import type { Credit, Driving } from "./types.ts";

/** One modeled tax family, following the household's existing refundable-credit convention. */
export function carbonRebatesOf(p: Province, income: number, couple: boolean, kids: number): Credit[] {
  const parent = !couple && kids > 0;
  return (p.carbon?.rebates ?? []).map(rebate => {
    const amount = rebate.params.payments.reduce((sum, payment) => {
      const maximum =
        payment.adult +
        (couple ? payment.spouse : parent ? payment.firstChild : 0) +
        payment.child * (parent ? kids - 1 : kids);
      const threshold = payment.threshold[couple || parent ? 1 : 0];
      return sum + Math.max(0, maximum - payment.rate * Math.max(0, income - threshold));
    }, 0);
    return [rebate.name ?? p.carbon?.name ?? rebate.program, amount];
  });
}

/** Carbon costs are independent of income; gasoline follows driving while heating uses an explicit estimate. */
export function carbonCostsOf(year: number, p: Province, driving?: Driving) {
  const rule = p.carbon;
  if (!rule) return null;
  const litres = driving ? (Math.max(0, driving.km) * Math.max(0, driving.lPer100km)) / 100 : 0;
  const perLitre = yearAverage(rule.gasoline, year);
  const gasoline = litres * perLitre;
  const heating = rule.heating.amount;
  return { litres, perLitre, gasoline, heating, total: gasoline + heating };
}
