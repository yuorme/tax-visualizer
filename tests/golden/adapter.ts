// Turns a stored scenario (the legacy app's state variables) into the engine's Household input.
import type { Household, Person } from "../../src/engine/index.ts";

export interface Scenario {
  id: number;
  people: Person[];
  active: number;
  spouse: boolean;
  adults: number;
  kids: number;
  under6: number;
  useBpa: boolean;
  whRate: number;
  useCredits: boolean;
  homeValue: number;
  rent: number;
  propOverride: number | null;
  home: string;
  spend: number;
  frug: number;
}

export const toHousehold = (s: Scenario): Household => ({
  people: s.people.map(x => ({ ...x })),
  active: s.active,
  spouse: s.spouse,
  adults: s.adults,
  kids: s.kids,
  under6: s.under6,
  useBpa: s.useBpa,
  whRate: s.whRate,
  useCredits: s.useCredits,
  homeValue: s.homeValue,
  rent: s.rent,
  monthlySpending: Math.round((s.spend * (1 + s.frug / 100)) / 10) * 10,
  propertyRates: s.propOverride != null ? { [s.home]: s.propOverride } : undefined,
});
