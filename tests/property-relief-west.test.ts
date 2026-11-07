// Property-tax relief for BC and Manitoba (#223, part of #22), 2026 only. The cases in
// tests/golden/features/property-relief-west.json have hand-calculated expectations (the `calc` field of each case);
// there is no capture path. Derivations: docs/verification/22-property-tax-relief.md, "Slice 2 (#223)".
import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { loadYear } from "../src/data/load.ts";
import { scaleHousehold } from "../src/engine/history.ts";
import {
  blank,
  type Household,
  household as householdOf,
  type Person,
  propertyReliefOf,
  type ReliefLine,
} from "../src/engine/index.ts";

const y = loadYear(2026);
const province = (code: string, year = y) => {
  const p = year.provinces.find(p => p.code === code);
  assert.ok(p, code);
  return p;
};

interface Case {
  id: string;
  province: string;
  calc: string;
  hh: {
    homeValue?: number;
    rent?: number; // monthly
    bill?: number;
    basis?: "gross" | "net";
    applied?: Record<string, number>;
    facts?: { bcNorthernRural?: boolean; schoolTax?: number };
    rate?: number;
    kids?: number;
    people?: Partial<Person>[];
  };
  /** program id -> [entitlement on the gross levy, remaining relief credited], or the status that carries no amount */
  expect: Record<string, [number, number] | "incomplete">;
  burden?: number; // bill entered less the relief credited
  eligible?: Record<string, Record<string, number>>; // components a line must report
}
const fixture: { cases: Case[] } = JSON.parse(
  fs.readFileSync(new URL("./golden/features/property-relief-west.json", import.meta.url), "utf8"),
);

const near = (actual: number | null, expected: number, message: string) =>
  assert.ok(actual !== null && Math.abs(actual - expected) < 1e-6, `${message}: ${actual} != ${expected}`);

const householdFor = (c: Pick<Case, "province" | "hh">): Household => {
  const h = c.hh;
  const people = (h.people ?? [{ oth: 50000 }]).map(x => ({
    ...blank(0),
    ...(x.age === undefined ? {} : { birthMonth: 6 }),
    ...x,
  }));
  return {
    people,
    active: 0,
    spouse: people.length > 1,
    adults: people.length,
    kids: h.kids ?? 0,
    under6: 0,
    useBpa: true,
    useCredits: true,
    whRate: 0,
    homeValue: h.homeValue ?? 500000,
    rent: h.rent ?? 0,
    monthlySpending: 0,
    ...(h.bill === undefined ? {} : { propertyTaxBills: { [c.province]: h.bill } }),
    ...(h.rate === undefined ? {} : { propertyRates: { [c.province]: h.rate } }),
    ...(h.basis === undefined ? {} : { propertyBillBasis: { [c.province]: h.basis } }),
    ...(h.applied === undefined ? {} : { propertyReliefApplied: { [c.province]: h.applied } }),
    ...(h.facts === undefined ? {} : { propertyReliefFacts: { [c.province]: h.facts } }),
  };
};

for (const c of fixture.cases)
  test(`west relief golden: ${c.id}`, () => {
    const result = householdOf(y, province(c.province), householdFor(c));
    const relief = result.breakdown.propertyRelief;
    assert.ok(relief, "relief was evaluated");
    for (const [id, want] of Object.entries(c.expect)) {
      const line: ReliefLine | undefined = relief.lines.find(l => l.program === id);
      assert.ok(line, `${id} line`);
      if (want === "incomplete") {
        assert.deepEqual([line.status, line.entitled, line.remaining], ["incomplete", null, null], id);
      } else {
        assert.equal(line.status, "modelled", `${id}: ${line.reason ?? ""}`);
        near(line.entitled, want[0], `${id} entitlement`);
        assert.equal(line.remaining, want[1], `${id} remaining`);
      }
    }
    for (const [id, parts] of Object.entries(c.eligible ?? {}))
      for (const [key, want] of Object.entries(parts))
        near(relief.lines.find(l => l.program === id)?.eligible[key] ?? null, want, `${id} ${key}`);
    if (c.burden !== undefined)
      near(relief.bill - relief.lines.reduce((sum, l) => sum + (l.remaining ?? 0), 0), c.burden, "final burden");
    // Each relief line reaches the household's credits once, by its own amount; none repeats an existing credit.
    for (const l of relief.lines) {
      if (l.remaining)
        assert.equal(result.credits.filter(([n, v]) => n === l.name && v === l.remaining).length, 1, l.name);
      // An incomplete line is not credited at all.
      if (l.status === "incomplete") assert.equal(result.credits.filter(([n]) => n === l.name).length, 0, l.name);
    }
    const names = result.credits.map(([n]) => n);
    assert.equal(new Set(names).size, names.length, "no credit appears twice");
  });

test("BC and Manitoba 2026 declare the programs; Alberta and Saskatchewan have none, and 2025 has none anywhere", () => {
  assert.deepEqual(
    province("BC").propertyRelief?.map(r => r.program),
    ["bc-home-owner-grant", "bc-low-income-grant-supplement"],
  );
  assert.deepEqual(
    province("MB").propertyRelief?.map(r => r.program),
    ["mb-homeowners-school-tax-credit", "mb-senior-school-tax-rebate", "mb-renters-affordability-senior"],
  );
  for (const code of ["AB", "SK"]) assert.equal(province(code).propertyRelief, undefined, code);
  for (const p of loadYear(2025).provinces) assert.equal(p.propertyRelief, undefined, `2025 ${p.code}`);
});

test("the credits switch turns the western relief off with the other credits", () => {
  for (const [code, homeValue] of [
    ["BC", 1000000],
    ["MB", 500000],
  ] as const) {
    const hh = { ...householdFor({ province: code, hh: { homeValue } }), useCredits: false };
    const r = householdOf(y, province(code), hh);
    assert.equal(r.breakdown.propertyRelief, undefined, code);
    assert.deepEqual(r.credits, [], code);
  }
});

test("Manitoba's old whole credit is replaced, not added to: one homeowners credit, never 2 x $1,600", () => {
  const hh = householdFor({ province: "MB", hh: { homeValue: 600000 } });
  const credits = householdOf(y, province("MB"), hh).credits.filter(([n]) => /affordability/.test(n));
  assert.deepEqual(credits, [["Homeowners affordability tax credit", 1600]]); // 600,000 x 0.45 x 15.994 / 1,000 = 4,318.38
  const renter = householdFor({ province: "MB", hh: { homeValue: 0, rent: 1000 } });
  assert.deepEqual(
    householdOf(y, province("MB"), renter).credits.filter(([n]) => /affordability/.test(n)),
    [["Renters affordability tax credit", 625]],
  );
});

test("a senior renter's amount falls as family income rises from zero, and never below the ordinary amount", () => {
  const credit = (income: number) => {
    const hh = householdFor({
      province: "MB",
      hh: { homeValue: 0, rent: 2000, people: [{ oth: income, age: 70 }] },
    });
    return householdOf(y, province("MB"), hh).credits.find(([n]) => n === "Renters affordability tax credit")?.[1];
  };
  // 982.14 - 0.008929 x income, the reduction capped at 357.14: 982.14, 892.85 (10,000), 803.56 (20,000), 625 from 40,000.
  assert.deepEqual([0, 10000, 20000, 40000, 60000].map(credit), [982.14, 892.85, 803.56, 625, 625]);
});

test("the western relief reads each person's income floored at zero, then sums the household", () => {
  // BC adjusted income (regulation s.11) and Manitoba family income (MB479 line 6) floor each person at zero.
  const rules = province("BC").propertyRelief;
  assert.ok(rules);
  const base = {
    bill: { amount: 4000, supplied: true, basis: "gross", applied: {}, defaultCity: false },
    people: [
      { ...blank(0), age: 70 },
      { ...blank(0), age: 68 },
    ],
    couple: true,
    kids: 0,
    famNet: 0,
    provincialFamNet: 0,
    homeValue: 2275000, // reduction 1,000 exhausts the $845 senior grant
    rent: 0,
    existingCredits: {},
  } as const;
  const supplement = (nets: number[]) =>
    propertyReliefOf(rules, { ...base, federalNets: nets }).lines.find(
      l => l.program === "bc-low-income-grant-supplement",
    )?.entitled;
  // The spouse's -20,000 counts as 0: 41,000 - 9,000 = 32,000, half of 845. Summed unfloored it would be 12,000: all of it.
  assert.equal(supplement([41000, -20000]), 422.5);
  assert.equal(supplement([42000, 0]), 0); // 42,000 - 9,000 = 33,000 is over 32,000
});

test("Manitoba's rebate and renter amounts floor each person's income at zero, then sum", () => {
  const rules = province("MB").propertyRelief;
  assert.ok(rules);
  const base = {
    couple: true,
    kids: 0,
    famNet: 0,
    provincialFamNet: 0,
    existingCredits: {},
  } as const;
  const people = [
    { ...blank(0), age: 70 },
    { ...blank(0), age: 68 },
  ];
  const line = (r: ReturnType<typeof propertyReliefOf>, id: string) => r.lines.find(l => l.program === id)?.entitled;
  // Rebate: 50,000 + (-20,000 floored to 0) = 50,000: 235 - 0.01 x 10,000 = 135. Summed unfloored: 30,000, so 235.
  const owner = propertyReliefOf(rules, {
    ...base,
    people,
    federalNets: [50000, -20000],
    bill: { amount: 6000, supplied: true, basis: "gross", applied: {}, defaultCity: false },
    homeValue: 500000,
    rent: 0,
    facts: { schoolTax: 3000 },
  });
  near(line(owner, "mb-senior-school-tax-rebate") ?? null, 135, "rebate");
  // Renter: 20,000 + (-10,000 floored to 0) = 20,000: 982.14 - 0.008929 x 20,000 = 803.56. Unfloored: 10,000, so 892.85.
  const renter = propertyReliefOf(rules, {
    ...base,
    people,
    federalNets: [20000, -10000],
    bill: { amount: 0, supplied: false, basis: "gross", applied: {}, defaultCity: true },
    homeValue: 0,
    rent: 24000,
  });
  near(line(renter, "mb-renters-affordability-senior") ?? null, 803.56, "renter");
});

test("history scaling carries the school tax with the bill", () => {
  const hh = { ...householdFor({ province: "MB", hh: { bill: 4000 } }) };
  const scaled = scaleHousehold({ ...hh, propertyReliefFacts: { MB: { schoolTax: 1700 } } }, 0.5);
  assert.deepEqual(scaled.propertyReliefFacts, { MB: { schoolTax: 850 } });
});
