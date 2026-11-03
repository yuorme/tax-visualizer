import type { Province } from "../data/schema.ts";

/** Annual BC premiums for modeled adults under 65. Unrelated adults have separate premium assistance tests. */
export function householdPremiumOf(p: Province, nets: number[], couple: boolean, kids: number, childcare: number[]) {
  if (!p.householdPremium) return null;
  const q = p.householdPremium.params;
  const premium = (income: number, adults: number, children: number, deduction: number) => {
    const adjusted = Math.max(
      0,
      income - (adults > 1 ? q.spouseDeduction : 0) - children * q.childDeduction + deduction * q.childcareAddbackRate,
    );
    const perAdult = q.bands.find(([upper]) => adjusted <= upper)?.[1] ?? 0;
    return { adjusted, perAdult, adults, total: perAdult * adults };
  };
  const families = couple
    ? [
        premium(
          nets[0] + nets[1],
          2,
          kids,
          childcare.reduce((a, b) => a + b, 0),
        ),
      ]
    : nets.map((net, i) => premium(net, 1, i === 0 ? kids : 0, childcare[i] ?? 0));
  return { families, total: families.reduce((sum, f) => sum + f.total, 0) };
}
