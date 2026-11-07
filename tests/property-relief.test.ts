// Property-tax relief, shared engine shape (#222, part of #22). No province has a real program yet, so the rules
// here are fixtures defined in this file and registered through the engine's scoped test seam; nothing in
// data/years/ carries one. The dollar figures follow the accounting example in
// docs/verification/22-property-tax-relief.md: a $4,000 gross bill and one home owner grant (the BC shape: $570
// ordinary, $845 for a senior, the senior total replacing the ordinary amount), which leave a $3,155 burden whether
// the bill is gross, net of the ordinary part, or fully net. One bill line is one program id.
import assert from "node:assert/strict";
import test from "node:test";
import { listYears, loadYear } from "../src/data/load.ts";
import { type Province, provinceSchema } from "../src/data/schema.ts";
import { scaleHousehold } from "../src/engine/history.ts";
import {
  blank,
  compute,
  type Household,
  household as householdOf,
  NOT_MODELLED,
  type Person,
  type PropertyBill,
  type PropertyReliefInput,
  propertyBillOf,
  propertyReliefOf,
  type ReliefContext,
  type ReliefHandler,
  type ReliefRule,
} from "../src/engine/index.ts";
import { existingCreditsOf, grossLevyOf, withPropertyReliefHandler } from "../src/engine/property-relief.ts";

const y = loadYear(2026);
const near = (actual: number, expected: number, message = "") =>
  assert.ok(Math.abs(actual - expected) < 1e-8, `${message}: ${actual} != ${expected}`);

const GRANT = "fixture-home-owner-grant";
const SHARE = "fixture-levy-share";
const AFTER = "fixture-after-grant";
const FLAT = "fixture-flat-grant";
const CITY = "fixture-city-rebate";
const NEEDS_AGE = "fixture-needs-age";
const grant: ReliefRule = {
  program: GRANT,
  scope: "provincial",
  name: "Fixture home owner grant",
  params: { ordinary: 570, senior: 845, minimumAge: 65 },
};
const share: ReliefRule = { program: SHARE, scope: "provincial", name: "Fixture levy share", params: { rate: 0.05 } };
const after: ReliefRule = { program: AFTER, scope: "provincial", name: "Fixture after grant", params: { rate: 0.1 } };
const flat: ReliefRule = { program: FLAT, scope: "provincial", name: "Fixture flat grant", params: { amount: 300 } };
const city: ReliefRule = { program: CITY, scope: "municipal", name: "Fixture city rebate", params: { rate: 0.05 } };
const unmodelled: ReliefRule = {
  program: NOT_MODELLED,
  scope: "provincial",
  name: "Fixture unmodelled relief",
  params: { reason: "award rule unresolved" },
};
const needsAge: ReliefRule = { program: NEEDS_AGE, scope: "provincial", name: "Fixture needs age", params: {} };

const asParams = <T>(rule: ReliefRule) => rule.params as T;
const fixtureHandlers: Record<string, ReliefHandler> = {
  // One bill line: the senior total replaces the ordinary amount inside the handler, so no second id can hold a share.
  [GRANT]: (rule, ctx) => {
    const q = asParams<{ ordinary: number; senior: number; minimumAge: number }>(rule);
    const senior = ctx.people.some(x => (x.age ?? 0) >= q.minimumAge);
    return { status: "modelled", entitled: ctx.owner ? Math.min(senior ? q.senior : q.ordinary, ctx.grossLevy) : 0 };
  },
  // Proportional to the levy, so it shows whether a net bill was grossed up before the entitlement was computed.
  [SHARE]: (rule, ctx) => ({
    status: "modelled",
    entitled: ctx.owner ? asParams<{ rate: number }>(rule).rate * ctx.grossLevy : 0,
  }),
  // Applies to the levy left after the grant, as a municipal-first or grant-first ordering would.
  [AFTER]: (rule, ctx) => {
    const given = ctx.earlier.find(l => l.program === GRANT)?.entitled ?? 0;
    return {
      status: "modelled",
      entitled: ctx.owner ? asParams<{ rate: number }>(rule).rate * (ctx.grossLevy - given) : 0,
    };
  },
  [FLAT]: (rule, ctx) => ({
    status: "modelled",
    entitled: ctx.owner ? Math.min(asParams<{ amount: number }>(rule).amount, ctx.grossLevy) : 0,
  }),
  [CITY]: (rule, ctx) => ({
    status: "modelled",
    entitled: ctx.owner ? asParams<{ rate: number }>(rule).rate * ctx.grossLevy : 0,
    eligible: { cityLevy: ctx.grossLevy },
  }),
  [NEEDS_AGE]: (_rule, ctx) =>
    ctx.people.some(x => x.age === undefined)
      ? { status: "incomplete", reason: "age is required", eligible: { levy: 1 } }
      : { status: "modelled", entitled: 1 },
};
/** Run with every fixture handler registered, then unregistered. */
const withFixtures = <T>(run: () => T): T =>
  Object.entries(fixtureHandlers).reduceRight<() => T>(
    (inner, [id, handler]) =>
      () =>
        withPropertyReliefHandler(id, handler, inner),
    run,
  )();

const person = (over: Partial<Person> = {}): Person => ({ ...blank(0), oth: 35000, age: 68, birthMonth: 6, ...over });
const bill = (over: Partial<PropertyBill> = {}): PropertyBill => ({
  amount: 4000,
  supplied: true,
  basis: "gross",
  applied: {},
  defaultCity: false,
  ...over,
});
const input = (b: Partial<PropertyBill> = {}, over: Partial<PropertyReliefInput> = {}): PropertyReliefInput => ({
  bill: bill(b),
  people: [person()],
  couple: false,
  kids: 0,
  famNet: 35000,
  provincialFamNet: 35000,
  federalNets: [35000],
  homeValue: 500000,
  rent: 0,
  existingCredits: {},
  ...over,
});
const household = (over: Partial<Household> = {}): Household => ({
  people: [person()],
  active: 0,
  spouse: false,
  adults: 1,
  kids: 0,
  under6: 0,
  useBpa: true,
  useCredits: true,
  whRate: 0,
  homeValue: 500000,
  rent: 0,
  monthlySpending: 0,
  ...over,
});
/** A real province's 2026 data with fixture relief rules. The rules are not schema members, so they cross the type
 *  boundary here. */
const provinceWith = (code: string, rules: ReliefRule[]): Province => {
  const p = y.provinces.find(p => p.code === code);
  assert.ok(p, code);
  return { ...p, propertyRelief: rules as unknown as Province["propertyRelief"] };
};
const bcWith = (rules: ReliefRule[]) => provinceWith("BC", rules);
const bcPlain = bcWith([]);
const fixtureCredits = (r: { credits: [string, number][] }) => r.credits.filter(([n]) => n.startsWith("Fixture"));
const otherCredits = (r: { credits: [string, number][] }) => r.credits.filter(([n]) => !n.startsWith("Fixture"));
const lineOf = (result: ReturnType<typeof propertyReliefOf>, program: string) => {
  const line = result.lines.find(l => l.program === program);
  assert.ok(line, program);
  return line;
};

// Three ways of entering the same $4,000 levy, whose final burden with the one grant is $3,155.
const GROSS = { amount: 4000 };
const ORDINARY_NET = { amount: 3430, basis: "net", applied: { [GRANT]: 570 } } as const;
const FULLY_NET = { amount: 3155, basis: "net", applied: { [GRANT]: 845 } } as const;

test("a gross, an ordinary-part-net and a fully-net bill give one entitlement and one final burden", () =>
  withFixtures(() => {
    for (const [label, b, remaining] of [
      ["gross", GROSS, 845],
      ["ordinary-part-net", ORDINARY_NET, 275],
      ["fully net", FULLY_NET, 0],
    ] as const) {
      const r = propertyReliefOf([grant], input(b));
      assert.equal(r.grossLevy, 4000, label);
      assert.equal(lineOf(r, GRANT).entitled, 845, label);
      assert.equal(lineOf(r, GRANT).remaining, remaining, label);
      assert.ok(r.complete, label);
      near(r.bill - (r.credited ?? NaN), 3155, `${label} burden`);
    }
    // Not a senior: the ordinary amount alone, and a bill already net of it has nothing left to credit.
    const young = { people: [person({ age: 50 })] };
    assert.equal(lineOf(propertyReliefOf([grant], input(GROSS, young)), GRANT).remaining, 570);
    assert.equal(lineOf(propertyReliefOf([grant], input(ORDINARY_NET, young)), GRANT).remaining, 0);
  }));

test("one bill line is one id: a grant stated as fully reflected leaves nothing, and unrelated relief is still due", () =>
  withFixtures(() => {
    // The whole $845 stated against the grant leaves nothing to credit: no second id exists to hold a leftover share.
    const full = propertyReliefOf([grant], input({ amount: 3155, basis: "net", applied: { [GRANT]: 845 } }));
    assert.equal(full.credited, 0);
    near(full.bill - (full.credited ?? NaN), 3155);
    // A different bill line is separate: the grant being applied does not hide the levy share that is still due.
    const two = propertyReliefOf(
      [grant, share],
      input({ amount: 3155, basis: "net", applied: { [GRANT]: 845, [SHARE]: 0 } }),
    );
    assert.deepEqual(
      two.lines.map(l => [l.program, l.remaining]),
      [
        [GRANT, 0],
        [SHARE, 200],
      ],
    );
  }));

test("entitlement is computed on the gross levy, never on the net bill that was entered", () =>
  withFixtures(() => {
    // 5% of $4,000 whichever way the same levy is entered; the net $3,155 taken as the levy would give $157.75.
    const bases = [
      GROSS,
      { amount: 3430, basis: "net", applied: { [GRANT]: 570, [SHARE]: 0 } },
      { amount: 2955, basis: "net", applied: { [GRANT]: 845, [SHARE]: 200 } },
    ] as const;
    for (const b of bases) {
      const r = propertyReliefOf([grant, share], input(b));
      assert.equal(r.grossLevy, 4000);
      assert.equal(lineOf(r, SHARE).entitled, 200);
      assert.deepEqual(lineOf(r, SHARE).eligible, { levy: 4000 });
      near(r.bill - (r.credited ?? NaN), 2955);
    }
    assert.equal(lineOf(propertyReliefOf([grant, share], input(bases[1])), SHARE).remaining, 200);
  }));

test("the household total is identical for the three bills, and relief is never counted twice", () =>
  withFixtures(() => {
    const p = bcWith([grant, share]);
    const hh = (bill: number, extra: Partial<Household> = {}) =>
      household({ propertyTaxBills: { BC: bill }, ...extra });
    const net = (bill: number, applied: Record<string, number>) =>
      hh(bill, { propertyBillBasis: { BC: "net" }, propertyReliefApplied: { BC: applied } });
    const gross = compute(y, p, hh(4000));
    const mid = compute(y, p, net(3430, { [GRANT]: 570, [SHARE]: 0 }));
    const full = compute(y, p, net(2955, { [GRANT]: 845, [SHARE]: 200 }));
    for (const r of [gross, mid, full]) {
      const relief = fixtureCredits(r).reduce((s, [, v]) => s + v, 0);
      near(r.property - relief, 2955, "final property burden");
      near(r.total, gross.total, "total tax after benefits");
    }
    assert.deepEqual(fixtureCredits(gross), [
      ["Fixture home owner grant", 845],
      ["Fixture levy share", 200],
    ]);
    assert.deepEqual(fixtureCredits(mid), [
      ["Fixture home owner grant", 275],
      ["Fixture levy share", 200],
    ]);
    assert.deepEqual(fixtureCredits(full), []);
    // The entered bill is the household's own: only the property line differs between bases, by what the bill reflects.
    near(gross.property - mid.property, 570);
    near(gross.property - full.property, 1045);
    near(gross.gross - full.gross, 1045);
    assert.equal(full.breakdown.propertyRelief?.grossLevy, 4000);
  }));

test("the existing property credits read the gross levy, so every province gives one result per levy", () =>
  withFixtures(() => {
    // Ontario's property credit and Manitoba's homeowner credit both read the bill. The bills straddle their caps
    // (Manitoba's is the lesser of a fixed maximum and the bill) and the last is fully covered by the $300 grant.
    for (const p0 of y.provinces) {
      const p = provinceWith(p0.code, [flat]);
      for (const levy of [300, 500, 1600, 4000]) {
        const credit = Math.min(300, levy);
        const entered = (b: number, extra: Partial<Household>) =>
          compute(y, p, household({ propertyTaxBills: { [p.code]: b }, ...extra }));
        const gross = entered(levy, {});
        const net = entered(levy - credit, {
          propertyBillBasis: { [p.code]: "net" },
          propertyReliefApplied: { [p.code]: { [FLAT]: credit } },
        });
        const label = `${p.code} levy ${levy}`;
        near(net.total, gross.total, label);
        assert.deepEqual(otherCredits(net), otherCredits(gross), label);
        assert.deepEqual(fixtureCredits(net), [], label);
        near(net.property + credit, gross.property, label);
      }
    }
    // The comparison has teeth: these credits do depend on the levy, so reading the net bill would have changed them.
    const creditNamed = (code: string, name: string, levy: number) =>
      compute(y, provinceWith(code, []), household({ propertyTaxBills: { [code]: levy } })).credits.find(
        ([n]) => n === name,
      )?.[1];
    const ontario = (levy: number) => creditNamed("ON", "Ontario energy and property tax credit", levy);
    // 2026 Manitoba's credit is a relief line, so its whole-bill predecessor is taken from 2025 data.
    const y25 = loadYear(2025);
    const mb25 = y25.provinces.find(p => p.code === "MB");
    assert.ok(mb25);
    const manitoba = (levy: number) =>
      compute(y25, mb25, household({ propertyTaxBills: { MB: levy } })).credits.find(
        ([n]) => n === "Homeowners affordability tax credit",
      )?.[1];
    assert.notEqual(ontario(4000), ontario(3700));
    assert.notEqual(manitoba(1600), manitoba(1300));
  }));

test("a net bill with an amount missing is incomplete: existing credits read the entered bill, nothing is credited", () =>
  withFixtures(() => {
    const p = provinceWith("MB", [flat, share]);
    const r = compute(
      y,
      p,
      household({
        propertyTaxBills: { MB: 1300 },
        propertyBillBasis: { MB: "net" },
        propertyReliefApplied: { MB: { [FLAT]: 300 } },
      }),
    );
    const plain = compute(y, provinceWith("MB", []), household({ propertyTaxBills: { MB: 1300 } }));
    assert.deepEqual(r.credits, plain.credits);
    assert.equal(r.breakdown.propertyRelief?.grossLevy, null);
    assert.equal(r.breakdown.propertyRelief?.credited, null);
  }));

test("a plausible wrong reading fails: a net bill taken as gross, or relief subtracted from it again, double counts", () =>
  withFixtures(() => {
    const p = bcWith([grant]);
    const base = household();
    const correct = compute(y, p, {
      ...base,
      propertyTaxBills: { BC: 3155 },
      propertyBillBasis: { BC: "net" },
      propertyReliefApplied: { BC: FULLY_NET.applied },
    });
    // Old inputs have no basis, so the same $3,155 reads as a gross bill and receives the whole $845 again.
    const noBasis = compute(y, p, { ...base, propertyTaxBills: { BC: 3155 } });
    near(correct.total - noBasis.total, 845, "no basis means gross");
    near(noBasis.refund - correct.refund, 845);
    // Reflected amounts do nothing on a gross bill (a reading that always subtracts them would remove relief twice).
    const grossWithAmounts = compute(y, p, {
      ...base,
      propertyTaxBills: { BC: 4000 },
      propertyReliefApplied: { BC: FULLY_NET.applied },
    });
    near(grossWithAmounts.total, compute(y, p, { ...base, propertyTaxBills: { BC: 4000 } }).total);
    assert.equal(grossWithAmounts.breakdown.propertyRelief?.applied, 0);
  }));

test("a net bill with a program's amount missing is incomplete: unknown amounts, never $0", () =>
  withFixtures(() => {
    const r = propertyReliefOf([grant, share], input({ amount: 3430, basis: "net", applied: { [GRANT]: 570 } }));
    assert.equal(r.grossLevy, null);
    assert.equal(r.applied, null);
    assert.equal(r.credited, null);
    for (const l of r.lines) {
      assert.equal(l.status, "incomplete");
      assert.equal(l.entitled, null);
      assert.equal(l.remaining, null);
      assert.deepEqual(l.eligible, { levy: null });
    }
    assert.match(lineOf(r, GRANT).reason ?? "", /fixture-levy-share/);
    assert.equal(lineOf(r, GRANT).applied, 570); // what the household did state is kept
    assert.equal(lineOf(r, SHARE).applied, null);
    assert.equal(r.complete, false);
    // Invalid amounts are unknown, not zero.
    for (const bad of [Number.NaN, -1, Number.POSITIVE_INFINITY, "570" as unknown as number]) {
      const hh = { propertyBillBasis: { BC: "net" }, propertyReliefApplied: { BC: { [GRANT]: bad } } } as const;
      assert.deepEqual(propertyBillOf("BC", hh, 3430, true).applied, {});
    }
    // The levy helper agrees, and names what is missing.
    assert.deepEqual(grossLevyOf([grant, share], bill({ amount: 3430, basis: "net", applied: { [GRANT]: 570 } })), {
      grossLevy: null,
      applied: null,
      missing: [SHARE],
    });
    assert.deepEqual(grossLevyOf([grant], bill(GROSS)), { grossLevy: 4000, applied: 0, missing: [] });
  }));

test("an explicit zero reflected amount is a statement, not an omission", () =>
  withFixtures(() => {
    const r = propertyReliefOf(
      [grant, share],
      input({ amount: 4000, basis: "net", applied: { [GRANT]: 0, [SHARE]: 0 } }),
    );
    assert.equal(r.grossLevy, 4000);
    assert.ok(r.complete);
    assert.deepEqual(
      r.lines.map(l => [l.applied, l.remaining]),
      [
        [0, 845],
        [0, 200],
      ],
    );
  }));

test("an explicit zero bill keeps its meaning: a zero levy, owner eligibility, no fall back to value × rate", () =>
  withFixtures(() => {
    const zero = propertyReliefOf([grant, share], input({ amount: 0 }));
    assert.equal(zero.grossLevy, 0);
    assert.deepEqual(
      zero.lines.map(l => [l.status, l.entitled, l.remaining]),
      [
        ["modelled", 0, 0],
        ["modelled", 0, 0],
      ],
    );
    const p = bcWith([grant, share]);
    const hh = household({ propertyTaxBills: { BC: 0 } });
    const r = compute(y, p, hh);
    assert.equal(r.property, 0);
    assert.equal(r.breakdown.propertyRelief?.grossLevy, 0);
    assert.deepEqual(fixtureCredits(r), []);
    // A zero home value with a supplied bill is still an owner.
    const owner = compute(y, p, { ...hh, homeValue: 0, propertyTaxBills: { BC: 4000 } });
    assert.equal(owner.breakdown.propertyRelief?.lines[0].remaining, 845);
    // A zero home value with no bill is not.
    const none = compute(y, p, { ...hh, homeValue: 0, propertyTaxBills: undefined });
    assert.equal(none.breakdown.propertyRelief?.lines[0].entitled, 0);
  }));

test("a municipal program applies only to the default reference-city bill", () =>
  withFixtures(() => {
    const onDefault = propertyReliefOf([grant, city], input({ defaultCity: true, supplied: false }));
    assert.equal(lineOf(onDefault, CITY).status, "modelled");
    near(lineOf(onDefault, CITY).entitled ?? Number.NaN, 200);
    assert.deepEqual(lineOf(onDefault, CITY).eligible, { cityLevy: 4000, levy: 4000 });

    const custom = propertyReliefOf([grant, city], input({ defaultCity: false }));
    const gated = lineOf(custom, CITY);
    assert.deepEqual([gated.status, gated.entitled, gated.remaining], ["city-bill-required", null, null]);
    assert.equal(lineOf(custom, GRANT).remaining, 845); // provincial relief still applies
    assert.ok(custom.complete); // out of scope for this bill, not an unfinished calculation

    // The gate is the rule's scope, not the handler's: a gated handler is never called.
    const calls: string[] = [];
    const spy: ReliefHandler = rule => {
      calls.push(rule.program);
      return { status: "modelled", entitled: 1 };
    };
    const spyRule: ReliefRule = { program: "fixture-spy", scope: "municipal" };
    withPropertyReliefHandler("fixture-spy", spy, () => propertyReliefOf([spyRule], input({ defaultCity: false })));
    assert.deepEqual(calls, []);
    withPropertyReliefHandler("fixture-spy", spy, () => propertyReliefOf([spyRule], input({ defaultCity: true })));
    assert.deepEqual(calls, ["fixture-spy"]);

    // Relief a custom net bill reflects still grosses it up, though no city award is modelled for it.
    const netCustom = propertyReliefOf(
      [grant, city],
      input({ amount: 3200, basis: "net", applied: { [GRANT]: 600, [CITY]: 200 } }),
    );
    assert.equal(netCustom.grossLevy, 4000);
    assert.equal(lineOf(netCustom, CITY).applied, 200);
    // ...but its amount is not required when the city program cannot run.
    const netCustomOmitted = propertyReliefOf(
      [grant, city],
      input({ amount: 3400, basis: "net", applied: { [GRANT]: 600 } }),
    );
    assert.equal(netCustomOmitted.grossLevy, 4000);
    assert.ok(netCustomOmitted.complete);
  }));

test("the default-city gate follows the supplied bill and the rate override", () =>
  withFixtures(() => {
    const p = bcWith([city]);
    const hh = household();
    const credit = (over: Partial<Household>) =>
      compute(y, p, { ...hh, ...over }).credits.find(([n]) => n === "Fixture city rebate")?.[1];
    near(credit({}) ?? Number.NaN, 0.05 * 500000 * p.propertyTax.rate, "the reference city's own estimate");
    assert.equal(credit({ propertyTaxBills: { BC: 4000 } }), undefined);
    assert.equal(credit({ propertyRates: { BC: 0.01 } }), undefined);
    // Another province's bill or rate says nothing about this one.
    near(
      credit({ propertyTaxBills: { ON: 4000 }, propertyRates: { ON: 0.01 } }) ?? Number.NaN,
      0.05 * 500000 * p.propertyTax.rate,
    );
    assert.equal(
      compute(y, p, { ...hh, propertyTaxBills: { BC: 4000 } }).breakdown.propertyRelief?.defaultCityBill,
      false,
    );
  }));

test("a program declared not modelled reports its reason with null amounts and credits nothing", () =>
  withFixtures(() => {
    const r = propertyReliefOf([unmodelled, grant], input());
    const line = lineOf(r, NOT_MODELLED);
    assert.deepEqual(
      [line.status, line.reason, line.entitled, line.applied, line.remaining],
      ["not-modelled", "award rule unresolved", null, 0, null],
    );
    assert.equal(lineOf(r, GRANT).remaining, 845); // the rest still computes
    assert.equal(r.credited, 845);
    assert.equal(r.complete, false);
    // It needs no handler, and a net bill need not state an amount for it.
    const net = propertyReliefOf([unmodelled, grant], input(FULLY_NET));
    assert.equal(net.grossLevy, 4000);
    assert.equal(net.credited, 0);
    assert.equal(lineOf(net, NOT_MODELLED).applied, null);

    const hh = household();
    const result = compute(y, bcWith([unmodelled]), hh);
    const plain = compute(y, bcPlain, hh);
    assert.equal(result.total, plain.total);
    assert.deepEqual(result.credits, plain.credits);
    assert.equal(result.breakdown.propertyRelief?.lines[0].status, "not-modelled");
    assert.equal(result.breakdown.propertyRelief?.complete, false);
  }));

test("a handler can report an incomplete input, and a bill that reflects more than the entitlement claws nothing back", () =>
  withFixtures(() => {
    const r = propertyReliefOf([needsAge], input({}, { people: [person({ age: undefined })] }));
    const line = lineOf(r, NEEDS_AGE);
    assert.deepEqual(
      [line.status, line.reason, line.entitled, line.remaining],
      ["incomplete", "age is required", null, null],
    );
    assert.deepEqual(line.eligible, { levy: 4000 }); // the engine's levy wins over a handler's key
    assert.equal(r.complete, false);

    const over = propertyReliefOf([grant], input({ amount: 2900, basis: "net", applied: { [GRANT]: 1100 } }));
    assert.equal(over.grossLevy, 4000);
    assert.deepEqual([lineOf(over, GRANT).entitled, lineOf(over, GRANT).remaining], [845, 0]);
  }));

test("an entitlement below zero is none, and remaining relief is rounded to cents", () => {
  const only = (id: string, entitled: number, b: Partial<PropertyBill> = {}) =>
    withPropertyReliefHandler(
      id,
      () => ({ status: "modelled", entitled }),
      () => lineOf(propertyReliefOf([{ program: id, scope: "provincial" }], input(b)), id),
    );
  const negative = only("fixture-negative", -50);
  assert.deepEqual([negative.entitled, negative.remaining], [0, 0]);
  const noisy = only("fixture-noisy", 0.1 + 0.2); // 0.30000000000000004
  assert.equal(noisy.entitled, 0.1 + 0.2);
  assert.equal(noisy.remaining, 0.3);
  const sub = only("fixture-sub", 100.004);
  assert.equal(sub.remaining, 100);
  // The reflected amount is subtracted before rounding, so cents cannot drift across bases.
  const net = only("fixture-net", 100.1, { amount: 3000, basis: "net", applied: { "fixture-net": 0.7 } });
  assert.equal(net.remaining, 99.4);
});

test("handlers see the lines evaluated before them, in data order", () =>
  withFixtures(() => {
    // 10% of what is left after the $845 grant, against 10% of the whole levy when the grant has not run first.
    near(lineOf(propertyReliefOf([grant, after], input()), AFTER).entitled ?? Number.NaN, 315.5);
    assert.equal(lineOf(propertyReliefOf([after], input()), AFTER).entitled, 400);
    assert.equal(lineOf(propertyReliefOf([after, grant], input()), AFTER).entitled, 400);
  }));

test("handlers receive the whole household context", () =>
  withFixtures(() => {
    const seen: ReliefContext[] = [];
    const spyRule: ReliefRule = { program: "fixture-spy", scope: "provincial" };
    const spy: ReliefHandler = (_rule, ctx) => {
      seen.push(ctx);
      return { status: "modelled", entitled: 0 };
    };
    const run = (code: string, hh: Household) => {
      seen.length = 0;
      const result = withPropertyReliefHandler("fixture-spy", spy, () =>
        householdOf(y, provinceWith(code, [spyRule]), hh),
      );
      assert.equal(seen.length, 1);
      return { result, ctx: seen[0] };
    };

    // An owner with a supplied net bill, a couple with children, in Quebec where the family income bases differ.
    const people = [person({ ord: 50000, oth: 0, age: 70 }), person({ ord: 20000, oth: 0, age: 66, birthMonth: 2 })];
    const owner = run(
      "QC",
      household({
        people,
        spouse: true,
        adults: 2,
        kids: 2,
        under6: 1,
        homeValue: 450000,
        rent: 1000,
        propertyTaxBills: { QC: 3000 },
        propertyBillBasis: { QC: "net" },
        propertyReliefApplied: { QC: { "fixture-spy": 500 } },
      }),
    );
    const bases = owner.result.breakdown.incomeBases;
    assert.deepEqual(owner.ctx.people, people);
    assert.equal(owner.ctx.couple, true);
    assert.equal(owner.ctx.kids, 2);
    assert.equal(owner.ctx.famNet, owner.result.famNet);
    assert.equal(owner.ctx.provincialFamNet, bases.provincialFamily);
    assert.notEqual(owner.ctx.provincialFamNet, owner.ctx.famNet); // Quebec's line 275 base is not the federal one
    assert.deepEqual(owner.ctx.federalNets, bases.federal);
    assert.equal(owner.ctx.homeValue, 450000);
    assert.equal(owner.ctx.rent, 0); // an owner pays no rent here, whatever the rent input says
    assert.equal(owner.ctx.owner, true);
    assert.equal(owner.ctx.renter, false);
    assert.equal(owner.ctx.billAmount, 3000);
    assert.equal(owner.ctx.billSupplied, true);
    assert.equal(owner.ctx.defaultCity, false);
    assert.equal(owner.ctx.grossLevy, 3500);
    assert.deepEqual(owner.ctx.earlier, []);
    const solidarity = owner.result.credits.find(([n]) => n === "Solidarity tax credit")?.[1];
    assert.ok(solidarity && solidarity > 0);
    assert.equal(owner.ctx.existingCredits["quebec-solidarity-tax-credit"], solidarity);

    // A renter on the reference city: no owner, the annual rent, a zero estimated levy and the default city.
    const renter = run("BC", household({ homeValue: 0, rent: 1500 }));
    assert.equal(renter.ctx.owner, false);
    assert.equal(renter.ctx.renter, true);
    assert.equal(renter.ctx.rent, 18000);
    assert.equal(renter.ctx.homeValue, 0);
    assert.equal(renter.ctx.billAmount, 0);
    assert.equal(renter.ctx.billSupplied, false);
    assert.equal(renter.ctx.defaultCity, true);
    assert.equal(renter.ctx.grossLevy, 0);
    const bcRenters = renter.result.credits.find(([n]) => n === "B.C. renter's tax credit")?.[1];
    assert.ok(bcRenters && bcRenters > 0);
    assert.equal(renter.ctx.existingCredits["bc-renters-tax-credit"], bcRenters);

    // A supplied bill with a zero home value is an owner even while rent is entered: never both.
    const billOnly = run("BC", household({ homeValue: 0, rent: 1500, propertyTaxBills: { BC: 4000 } }));
    assert.equal(billOnly.ctx.owner, true);
    assert.equal(billOnly.ctx.renter, false);
    assert.equal(billOnly.ctx.rent, 18000);

    // An owner on the estimate: the levy is value × the reference rate; the Ontario credits are already counted.
    const estimate = run("ON", household({ homeValue: 400000 }));
    const rate = y.provinces.find(p => p.code === "ON")?.propertyTax.rate ?? Number.NaN;
    near(estimate.ctx.billAmount, 400000 * rate);
    assert.equal(estimate.ctx.billSupplied, false);
    assert.equal(estimate.ctx.defaultCity, true);
    const onCredit = (name: string) => estimate.result.credits.find(([n]) => n === name)?.[1];
    assert.ok(onCredit("Ontario energy and property tax credit"));
    assert.equal(
      estimate.ctx.existingCredits["ontario-energy-property-tax-credit"],
      onCredit("Ontario energy and property tax credit"),
    );
    assert.equal(estimate.ctx.existingCredits["ontario-sales-tax-credit"], onCredit("Ontario sales tax credit"));
  }));

test("existing credits are matched to their program on the province's own names", () => {
  const programs = [
    { program: "a", name: "Credit A" },
    { program: "b" },
    { program: "c", name: "Owners", nameRenter: "Renters" },
  ];
  const credits: [string, number][] = [
    ["Credit A", 10],
    ["b", 20],
    ["Renters", 30],
    ["Unrelated", 99],
  ];
  assert.deepEqual(existingCreditsOf(programs, credits), { a: 10, b: 20, c: 30 });
  assert.deepEqual(existingCreditsOf([], credits), {});
  assert.deepEqual(existingCreditsOf(programs, []), { a: 0, b: 0, c: 0 });
});

test("an unregistered program fails loudly, and the test seam registers only for the call", () => {
  assert.throws(
    () => propertyReliefOf([{ program: "no-such-program", scope: "provincial" }], input()),
    /No property relief handler/,
  );
  assert.throws(
    () =>
      withPropertyReliefHandler(GRANT, fixtureHandlers[GRANT], () => {
        withPropertyReliefHandler(GRANT, fixtureHandlers[GRANT], () => undefined);
      }),
    /already has a handler/,
  );
  assert.throws(() => propertyReliefOf([grant], input()), /No property relief handler/); // unregistered again
  assert.throws(
    () =>
      withPropertyReliefHandler(
        "fixture-bad",
        () => ({ status: "modelled", entitled: Number.NaN }),
        () => propertyReliefOf([{ program: "fixture-bad", scope: "provincial" }], input()),
      ),
    /non-finite/,
  );
  // Program ids that collide with Object.prototype names are ordinary ids.
  const r = propertyReliefOf([{ program: "toString", scope: "provincial" }], input({ amount: 100, basis: "net" }));
  assert.equal(r.lines[0].status, "incomplete");
});

test("bill facts: old inputs are gross, an estimate is gross, and a supplied bill or rate override is not the city's", () => {
  const net = { propertyBillBasis: { BC: "net" }, propertyReliefApplied: { BC: { a: 5 } } } as const;
  assert.deepEqual(propertyBillOf("BC", {}, 4000, true), {
    amount: 4000,
    supplied: true,
    basis: "gross",
    applied: {},
    defaultCity: false,
  });
  assert.equal(propertyBillOf("BC", {}, 4000, false).defaultCity, true);
  assert.equal(propertyBillOf("BC", { propertyRates: { BC: 0.01 } }, 4000, false).defaultCity, false);
  assert.equal(propertyBillOf("BC", { propertyRates: { ON: 0.01 } }, 4000, false).defaultCity, true);
  assert.deepEqual(propertyBillOf("BC", net, 4000, true).applied, { a: 5 });
  assert.equal(propertyBillOf("BC", net, 4000, true).basis, "net");
  // Reflected amounts need a supplied bill: an estimate has nothing to be net of.
  const estimate = propertyBillOf("BC", net, 4000, false);
  assert.deepEqual([estimate.basis, estimate.applied], ["gross", {}]);
  // Basis and amounts belong to one province.
  assert.deepEqual(propertyBillOf("ON", net, 4000, true).applied, {});
  assert.equal(propertyBillOf("BC", { propertyBillBasis: { BC: "other" as "net" } }, 4000, true).basis, "gross");
});

test("with the credits switch off, no property relief is evaluated or counted", () =>
  withFixtures(() => {
    const p = bcWith([grant, share]);
    const hh = household({ useCredits: false, propertyTaxBills: { BC: 4000 } });
    const off = compute(y, p, hh);
    assert.equal(off.breakdown.propertyRelief, undefined);
    assert.equal(off.refund, 0);
    near(off.total, compute(y, bcPlain, hh).total);
    assert.ok(compute(y, p, { ...hh, useCredits: true }).breakdown.propertyRelief);
  }));

test("real-dollar history scales the reflected amounts with the bill, keeping legacy inputs unchanged", () => {
  const hh = household({
    propertyTaxBills: { BC: 3155 },
    propertyBillBasis: { BC: "net" },
    propertyReliefApplied: { BC: { [GRANT]: 570, [SHARE]: 0 }, ON: { other: 100 } },
  });
  const scaled = scaleHousehold(hh, 0.5);
  assert.deepEqual(scaled.propertyReliefApplied, { BC: { [GRANT]: 285, [SHARE]: 0 }, ON: { other: 50 } });
  assert.deepEqual(scaled.propertyBillBasis, { BC: "net" });
  assert.equal(hh.propertyReliefApplied?.BC?.[GRANT], 570);
  assert.equal("propertyReliefApplied" in scaleHousehold(household(), 0.5), false);
});

test("provinces with no property relief program are unchanged, whatever the new inputs say", () => {
  // No age: retirement-age payroll is not modelled for the older years, and no program here reads it.
  const hh = household({ people: [blank(35000)], homeValue: 600000, monthlySpending: 2000 });
  for (const year of listYears()) {
    const data = loadYear(year);
    for (const p of data.provinces) {
      // Real programs arrive in 2026 data only (#22); every other year, and any province without one, must be inert.
      if (p.propertyRelief?.length) continue;
      const baseline = compute(data, p, hh);
      assert.equal(baseline.breakdown.propertyRelief, undefined);
      const withInputs = compute(data, p, {
        ...hh,
        propertyTaxBills: { [p.code]: 4200 },
        propertyBillBasis: { [p.code]: "net" },
        propertyReliefApplied: { [p.code]: { anything: 500 } },
      });
      const withBill = compute(data, p, { ...hh, propertyTaxBills: { [p.code]: 4200 } });
      assert.deepEqual(withInputs, withBill, `${year} ${p.code}`);
    }
  }
});

test("the schema accepts a not-modelled declaration and rejects malformed or duplicate programs", () => {
  const bc = y.provinces.find(p => p.code === "BC");
  assert.ok(bc);
  const rule = { program: NOT_MODELLED, scope: "provincial", params: { reason: "award rule unresolved" } };
  const parse = (propertyRelief: unknown) => provinceSchema.safeParse({ ...bc, propertyRelief }).success;
  assert.ok(parse(undefined));
  assert.ok(parse([]));
  assert.ok(parse([rule]));
  assert.ok(parse([{ ...rule, scope: "municipal", name: "Toronto", estimated: true }]));
  assert.ok(!parse([{ ...rule, scope: undefined }]), "scope is required");
  assert.ok(!parse([{ ...rule, scope: "city" }]));
  assert.ok(!parse([{ ...rule, params: { reason: "" } }]), "a reason is required");
  assert.ok(!parse([{ ...rule, program: "unknown-program" }]));
  assert.ok(!parse([rule, rule]), "program ids are unique within a province");
});
