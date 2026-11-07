// Property-tax relief for Ontario and Quebec (#224, part of #22), 2026 only. The cases in
// tests/golden/features/property-relief-on-qc.json have hand-calculated expectations (the `calc` field of each case);
// there is no capture path. Derivations: docs/verification/22-property-tax-relief.md, "Slice 4 (#224)".
import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { loadYear } from "../src/data/load.ts";
import {
  blank,
  type Household,
  household as householdOf,
  type Person,
  type PropertyReliefFacts,
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
    facts?: PropertyReliefFacts;
    rate?: number;
    kids?: number;
    people?: Partial<Person>[];
  };
  /** program id -> [entitlement on the gross levy, remaining relief credited], or the status that carries no amount */
  expect: Record<string, [number, number] | "incomplete" | "city-bill-required">;
  burden?: number; // bill entered less the relief credited
  eligible?: Record<string, Record<string, number>>; // components a line must report
}
const fixture: { cases: Case[] } = JSON.parse(
  fs.readFileSync(new URL("./golden/features/property-relief-on-qc.json", import.meta.url), "utf8"),
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
  test(`ON/QC relief golden: ${c.id}`, () => {
    const result = householdOf(y, province(c.province), householdFor(c));
    const relief = result.breakdown.propertyRelief;
    assert.ok(relief, "relief was evaluated");
    for (const [id, want] of Object.entries(c.expect)) {
      const line: ReliefLine | undefined = relief.lines.find(l => l.program === id);
      assert.ok(line, `${id} line`);
      if (want === "incomplete" || want === "city-bill-required") {
        assert.deepEqual([line.status, line.entitled, line.remaining], [want, null, null], id);
      } else {
        assert.equal(line.status, "modelled", `${id}: ${line.reason ?? ""}`);
        near(line.entitled, want[0], `${id} entitlement`);
        assert.equal(line.remaining, Math.round(want[1] * 100) / 100, `${id} remaining`);
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
      if (l.status === "incomplete") assert.equal(result.credits.filter(([n]) => n === l.name).length, 0, l.name);
    }
    const names = result.credits.map(([n]) => n);
    assert.equal(new Set(names).size, names.length, "no credit appears twice");
  });

const OEPTC = "Ontario energy and property tax credit";
const GRANT = "ontario-senior-homeowners-property-grant";
const SENIOR = "ontario-energy-property-tax-credit-senior-overlap";
const TORONTO = "toronto-property-tax-increase-cancellation";
const creditOf = (r: ReturnType<typeof householdOf>, name: string) => r.credits.find(([n]) => n === name)?.[1];

test("Ontario 2026 declares the senior programs, Quebec its grant; 2025 has none anywhere", () => {
  assert.deepEqual(
    province("ON").propertyRelief?.map(r => r.program),
    [GRANT, SENIOR, TORONTO],
  );
  for (const p of loadYear(2025).provinces) assert.equal(p.propertyRelief, undefined, `2025 ${p.code}`);
});

test("a senior household has one OEPTC line (the senior schedule), never the ordinary and the senior credit", () => {
  const senior = householdFor({ province: "ON", hh: { bill: 4000, people: [{ oth: 35000, age: 65 }] } });
  const r = householdOf(y, province("ON"), senior);
  // The ordinary credit at 35,000 would be 290 + 473 - 0.02 x (35,000 - 29,047) = 643.94; the senior one is 1,307.
  // Both counted would make 1,950.94, and the household would show two credits with the same name.
  assert.deepEqual(
    r.credits.filter(([n]) => n === OEPTC),
    [[OEPTC, 1307]],
  );
  const ordinary = householdFor({ province: "ON", hh: { bill: 4000, people: [{ oth: 35000, age: 64 }] } });
  near(creditOf(householdOf(y, province("ON"), ordinary), OEPTC) ?? null, 643.94, "age 64 keeps the ordinary credit");
});

test("an ordinary household's OEPTC is unchanged from the whole credit it had before the senior programs", () => {
  // 4,000 bill, income 40,000, family of two adults: 290 + min(4000, 400 + 73) - 0.02 x (40,000 - 36,309) = 763 - 73.82
  const hh = householdFor({ province: "ON", hh: { bill: 4000, people: [{ oth: 20000 }, { oth: 20000 }] } });
  assert.equal(creditOf(householdOf(y, province("ON"), hh), OEPTC), 763 - 0.02 * Math.max(0, 40000 - 36309));
});

test("the evaluator refuses a senior credit when the ordinary one is also counted", () => {
  const rules = province("ON").propertyRelief;
  assert.ok(rules);
  const base = {
    bill: { amount: 4000, supplied: true, basis: "gross", applied: {}, defaultCity: false },
    people: [{ ...blank(0), age: 70 }],
    couple: false,
    kids: 0,
    famNet: 30000,
    provincialFamNet: 30000,
    federalNets: [30000],
    homeValue: 500000,
    rent: 0,
  } as const;
  const line = (existing: number) =>
    propertyReliefOf(rules, {
      ...base,
      existingCredits: { "ontario-energy-property-tax-credit": existing },
    }).lines.find(l => l.program === SENIOR);
  assert.equal(line(0)?.status, "modelled");
  assert.equal(line(763)?.status, "incomplete");
});

test("the grant and the credit are never on a tax bill: a net bill states 0, and a stated amount is refused", () => {
  const net = (applied: Record<string, number>) =>
    householdOf(
      y,
      province("ON"),
      householdFor({
        province: "ON",
        hh: { bill: 4000, basis: "net", applied, people: [{ oth: 35000, age: 65 }] },
      }),
    ).breakdown.propertyRelief;
  const zero = net({ [GRANT]: 0, [SENIOR]: 0 });
  assert.equal(zero?.grossLevy, 4000);
  assert.deepEqual(
    zero?.lines.map(l => [l.program, l.remaining]),
    [
      [GRANT, 500],
      [SENIOR, 1307],
      [TORONTO, null], // a custom bill is not the reference city's: no automatic award
    ],
  );
  // The same household as a gross bill ends at the same burden.
  const gross = householdOf(
    y,
    province("ON"),
    householdFor({ province: "ON", hh: { bill: 4000, people: [{ oth: 35000, age: 65 }] } }),
  ).breakdown.propertyRelief;
  assert.equal(gross?.credited, zero?.credited);
  // Omitting an amount leaves the gross levy, and so both lines, unknown; a non-zero amount is refused.
  assert.deepEqual(
    net({ [GRANT]: 0 })?.lines.map(l => l.status),
    ["incomplete", "incomplete", "city-bill-required"],
  );
  assert.deepEqual(
    net({ [GRANT]: 500, [SENIOR]: 0 })?.lines.map(l => l.status),
    ["incomplete", "incomplete", "city-bill-required"],
  );
});

test("the OSHPTG is a plain subtraction at the cutoff, not an extrapolated trickle (the wrong reading fails)", () => {
  const grant = (income: number) =>
    householdOf(
      y,
      province("ON"),
      householdFor({ province: "ON", hh: { bill: 4000, people: [{ oth: income, age: 70 }] } }),
    ).breakdown.propertyRelief?.lines.find(l => l.program === GRANT)?.entitled;
  // Formula alone: 500 - 0.0333 x 15,000 = 0.50 at 50,000. The program says nothing is paid from 50,000.
  assert.equal(grant(50000), 0);
  assert.ok((grant(49999) ?? 0) > 0.5);
});

test("the credits switch turns the Ontario relief off with the other credits", () => {
  const hh = {
    ...householdFor({ province: "ON", hh: { bill: 4000, people: [{ oth: 35000, age: 65 }] } }),
    useCredits: false,
  };
  const r = householdOf(y, province("ON"), hh);
  assert.equal(r.breakdown.propertyRelief, undefined);
  assert.deepEqual(r.credits, []);
});

const torontoLine = (over: Partial<Parameters<typeof propertyReliefOf>[1]> & { people: Person[] }) => {
  const rules = province("ON").propertyRelief;
  assert.ok(rules);
  return propertyReliefOf(rules, {
    bill: { amount: 3800, supplied: false, basis: "gross", applied: {}, defaultCity: true },
    couple: false,
    kids: 0,
    famNet: 30000,
    provincialFamNet: 30000,
    federalNets: [30000],
    totalIncomes: [30000],
    homeValue: 500000,
    rent: 0,
    existingCredits: {},
    ...over,
  }).lines.find(l => l.program === TORONTO);
};

test("Toronto tests gross income: a deduction that lowers net income does not bring a household under the limit", () => {
  const people = [{ ...blank(0), age: 70 }];
  assert.equal(torontoLine({ people, federalNets: [60000], totalIncomes: [70000] })?.entitled, 0);
  assert.ok((torontoLine({ people, federalNets: [60000], totalIncomes: [60000] })?.entitled ?? 0) > 0);
  // Total income is required: without it the line is incomplete, never silently net income.
  const unknown = torontoLine({ people, federalNets: [60000], totalIncomes: undefined });
  assert.deepEqual([unknown?.status, unknown?.entitled], ["incomplete", null]);
});

test("Toronto's 60-64 route needs an OAS Allowance; age alone or the Allowance under 60 does not qualify", () => {
  const entitled = (age: number, allowance?: boolean) =>
    torontoLine({ people: [{ ...blank(0), age, ...(allowance === undefined ? {} : { allowance }) }] })?.entitled;
  assert.ok((entitled(62, true) ?? 0) > 0);
  assert.ok((entitled(60, true) ?? 0) > 0);
  assert.equal(entitled(59, true), 0);
  assert.equal(entitled(62, false), 0);
  assert.equal(entitled(62), 0);
  assert.ok((entitled(65) ?? 0) > 0);
});

test("Toronto's cancellation is not a flat grant: it scales with the levy and needs a stated first-time basis", () => {
  const at = (amount: number) =>
    torontoLine({
      people: [{ ...blank(0), age: 70 }],
      bill: { amount, supplied: false, basis: "gross", applied: {}, defaultCity: true },
    })?.entitled ?? 0;
  assert.ok(Math.abs(at(2000) - (2000 * 0.022) / 1.022) < 1e-9);
  assert.ok(Math.abs(at(8000) - (8000 * 0.022) / 1.022) < 1e-9);
});

test("a custom net bill that already includes a Toronto cancellation states it once and reaches the gross burden", () => {
  const hh = (bill: number, basis: "gross" | "net", applied: Record<string, number>) =>
    householdFor({ province: "ON", hh: { bill, basis, applied, people: [{ oth: 30000, age: 64 }] } });
  const gross = householdOf(y, province("ON"), hh(3800, "gross", {})).breakdown.propertyRelief;
  const net = householdOf(y, province("ON"), hh(3700, "net", { [GRANT]: 0, [SENIOR]: 0, [TORONTO]: 100 })).breakdown
    .propertyRelief;
  // Neither is the reference city's bill, so the line is city-bill-required in both; the net bill's 100 is grossed up
  // into the levy and is not credited again.
  assert.equal(gross?.grossLevy, 3800);
  assert.equal(net?.grossLevy, 3800);
  assert.equal(net?.lines.find(l => l.program === TORONTO)?.status, "city-bill-required");
  assert.equal(net?.credited, gross?.credited);
});
