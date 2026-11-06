// Property-tax relief, shared engine shape (#222, part of #22). No province has a real program yet, so the rules
// here are fixtures defined in this file and registered through the engine's scoped test seam; nothing in
// data/years/ carries one. The dollar figures follow the accounting example in
// docs/verification/22-property-tax-relief.md: a $4,000 gross bill, an ordinary grant of $570 and a senior total of $845
// (so a $275 increment), which leave a $3,155 burden whether the bill is gross, net of the ordinary grant or fully net.
import assert from "node:assert/strict";
import test from "node:test";
import { listYears, loadYear } from "../src/data/load.ts";
import { type Province, provinceSchema } from "../src/data/schema.ts";
import { scaleHousehold } from "../src/engine/history.ts";
import {
  blank,
  compute,
  type Household,
  NOT_MODELLED,
  type Person,
  type PropertyBill,
  type PropertyReliefInput,
  propertyBillOf,
  propertyReliefOf,
  type ReliefHandler,
  type ReliefRule,
  withPropertyReliefHandler,
} from "../src/engine/index.ts";

const y = loadYear(2026);
const near = (actual: number, expected: number, message = "") =>
  assert.ok(Math.abs(actual - expected) < 1e-8, `${message}: ${actual} != ${expected}`);

const ORDINARY = "fixture-ordinary-grant";
const SENIOR = "fixture-senior-grant";
const CITY = "fixture-city-rebate";
const NEEDS_AGE = "fixture-needs-age";
const SHARE = "fixture-levy-share";
const ordinary: ReliefRule = {
  program: ORDINARY,
  scope: "provincial",
  name: "Fixture ordinary grant",
  params: { amount: 570 },
};
const senior: ReliefRule = {
  program: SENIOR,
  scope: "provincial",
  name: "Fixture senior grant",
  params: { minimumAge: 65, total: 845 },
};
const city: ReliefRule = { program: CITY, scope: "municipal", name: "Fixture city rebate", params: { rate: 0.05 } };
const unmodelled: ReliefRule = {
  program: NOT_MODELLED,
  scope: "provincial",
  name: "Fixture unmodelled relief",
  params: { reason: "award rule unresolved" },
};
const share: ReliefRule = { program: SHARE, scope: "provincial", name: "Fixture levy share", params: { rate: 0.05 } };
const needsAge: ReliefRule = { program: NEEDS_AGE, scope: "provincial", name: "Fixture needs age", params: {} };

const asParams = <T>(rule: ReliefRule) => rule.params as T;
const fixtureHandlers: Record<string, ReliefHandler> = {
  [ORDINARY]: (rule, ctx) => ({
    status: "modelled",
    entitled: ctx.owner ? Math.min(asParams<{ amount: number }>(rule).amount, ctx.grossLevy) : 0,
  }),
  // The senior total replaces the ordinary grant, so this line is the increment over what ordinary already gave.
  [SENIOR]: (rule, ctx) => {
    const q = asParams<{ minimumAge: number; total: number }>(rule);
    const eligible = ctx.owner && ctx.people.some(x => (x.age ?? 0) >= q.minimumAge);
    const ordinaryGiven = ctx.earlier.find(l => l.program === ORDINARY)?.entitled ?? 0;
    return { status: "modelled", entitled: eligible ? Math.min(q.total, ctx.grossLevy) - ordinaryGiven : 0 };
  },
  // Proportional to the levy, so it shows whether a net bill was grossed up before the entitlement was computed.
  [SHARE]: (rule, ctx) => ({
    status: "modelled",
    entitled: ctx.owner ? asParams<{ rate: number }>(rule).rate * ctx.grossLevy : 0,
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
/** BC's real data with fixture relief rules. The rules are not schema members, so they cross the type boundary here. */
const bcWith = (rules: ReliefRule[]): Province => {
  const bc = y.provinces.find(p => p.code === "BC");
  assert.ok(bc);
  return { ...bc, propertyRelief: rules as unknown as Province["propertyRelief"] };
};
const bcPlain = bcWith([]);
const fixtureCredits = (r: { credits: [string, number][] }) => r.credits.filter(([n]) => n.startsWith("Fixture"));
const lineOf = (result: ReturnType<typeof propertyReliefOf>, program: string) => {
  const line = result.lines.find(l => l.program === program);
  assert.ok(line, program);
  return line;
};

// Three ways of entering the same $4,000 levy, whose final burden is $3,155.
const GROSS = { amount: 4000 };
const ORDINARY_NET = { amount: 3430, basis: "net", applied: { [ORDINARY]: 570, [SENIOR]: 0 } } as const;
const ORDINARY_NET_SHARE = { amount: 3430, basis: "net", applied: { [ORDINARY]: 570, [SHARE]: 0 } } as const;
const FULLY_NET_SHARE = { amount: 3230, basis: "net", applied: { [ORDINARY]: 570, [SHARE]: 200 } } as const;
const FULLY_NET = { amount: 3155, basis: "net", applied: { [ORDINARY]: 570, [SENIOR]: 275 } } as const;

test("a gross, an ordinary-grant-net and a fully-net bill give one entitlement and one final burden", () =>
  withFixtures(() => {
    for (const [label, b] of [
      ["gross", GROSS],
      ["ordinary-grant-net", ORDINARY_NET],
      ["fully net", FULLY_NET],
    ] as const) {
      const r = propertyReliefOf([ordinary, senior], input(b));
      assert.equal(r.grossLevy, 4000, label);
      assert.equal(lineOf(r, ORDINARY).entitled, 570, label);
      assert.equal(lineOf(r, SENIOR).entitled, 275, label);
      assert.ok(r.complete, label);
      near(r.bill - r.credited, 3155, `${label} burden`);
    }
    const remaining = (b: object) => propertyReliefOf([ordinary, senior], input(b)).lines.map(l => l.remaining);
    assert.deepEqual(remaining(GROSS), [570, 275]);
    assert.deepEqual(remaining(ORDINARY_NET), [0, 275]); // the senior increment is still due
    assert.deepEqual(remaining(FULLY_NET), [0, 0]); // nothing is applied twice
  }));

test("entitlement is computed on the gross levy, never on the net bill that was entered", () =>
  withFixtures(() => {
    // 5% of $4,000, whichever way the same levy is entered; a net $3,430 taken as the levy would give $171.50.
    for (const b of [GROSS, ORDINARY_NET_SHARE, FULLY_NET_SHARE]) {
      const r = propertyReliefOf([ordinary, share], input(b));
      assert.equal(r.grossLevy, 4000);
      assert.equal(lineOf(r, SHARE).entitled, 200);
      assert.deepEqual(lineOf(r, SHARE).eligible, { levy: 4000 });
    }
    assert.equal(lineOf(propertyReliefOf([ordinary, share], input(ORDINARY_NET_SHARE)), SHARE).remaining, 200);
    // Program ids that collide with Object.prototype names are ordinary ids.
    const r = propertyReliefOf([{ program: "toString", scope: "provincial" }], input({ amount: 100, basis: "net" }));
    assert.equal(r.lines[0].status, "incomplete");
  }));

test("the household total is identical for the three bills, and relief is never counted twice", () =>
  withFixtures(() => {
    const p = bcWith([ordinary, senior]);
    const hh = (bill: number, extra: Partial<Household> = {}) =>
      household({ propertyTaxBills: { BC: bill }, ...extra });
    const gross = compute(y, p, hh(4000));
    const mid = compute(
      y,
      p,
      hh(3430, { propertyBillBasis: { BC: "net" }, propertyReliefApplied: { BC: ORDINARY_NET.applied } }),
    );
    const full = compute(
      y,
      p,
      hh(3155, { propertyBillBasis: { BC: "net" }, propertyReliefApplied: { BC: FULLY_NET.applied } }),
    );
    for (const r of [gross, mid, full]) {
      const reliefCredit = fixtureCredits(r).reduce((s, [, v]) => s + v, 0);
      near(r.property - reliefCredit, 3155, "final property burden");
      near(r.total, gross.total, "total tax after benefits");
    }
    assert.deepEqual(fixtureCredits(gross), [
      ["Fixture ordinary grant", 570],
      ["Fixture senior grant", 275],
    ]);
    assert.deepEqual(fixtureCredits(mid), [["Fixture senior grant", 275]]);
    assert.deepEqual(fixtureCredits(full), []);
    // The entered bill is the household's own: only the property line differs between bases, by what the bill reflects.
    near(gross.property - mid.property, 570);
    near(gross.property - full.property, 845);
    near(gross.gross - full.gross, 845);
    assert.equal(full.breakdown.propertyRelief?.grossLevy, 4000);
  }));

test("a plausible wrong reading fails: a net bill taken as gross, or relief subtracted from it again, double counts", () =>
  withFixtures(() => {
    const p = bcWith([ordinary, senior]);
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
    // Not stating one program's amount must not be read as "none applied" and credit it in full.
    const unstated = propertyReliefOf(
      [ordinary, senior],
      input({ amount: 3155, basis: "net", applied: { [ORDINARY]: 570 } }),
    );
    assert.deepEqual(
      unstated.lines.map(l => l.remaining),
      [null, null],
    );
    assert.equal(unstated.credited, 0);
    assert.equal(unstated.complete, false);
  }));

test("a net bill with a program's amount missing is incomplete: unknown amounts, never $0", () =>
  withFixtures(() => {
    const r = propertyReliefOf([ordinary, senior], input({ amount: 3430, basis: "net", applied: { [ORDINARY]: 570 } }));
    assert.equal(r.grossLevy, null);
    for (const l of r.lines) {
      assert.equal(l.status, "incomplete");
      assert.equal(l.entitled, null);
      assert.equal(l.remaining, null);
      assert.deepEqual(l.eligible, { levy: null });
    }
    assert.match(lineOf(r, ORDINARY).reason ?? "", /fixture-senior-grant/);
    assert.equal(lineOf(r, ORDINARY).applied, 570); // what the household did state is kept
    assert.equal(lineOf(r, SENIOR).applied, null);
    assert.equal(r.complete, false);
    // Invalid amounts are unknown, not zero.
    for (const bad of [Number.NaN, -1, Number.POSITIVE_INFINITY, "570" as unknown as number]) {
      const p = propertyBillOf(
        "BC",
        { propertyBillBasis: { BC: "net" }, propertyReliefApplied: { BC: { [ORDINARY]: bad } } },
        3430,
        true,
      );
      assert.deepEqual(p.applied, {});
    }
  }));

test("an explicit zero reflected amount is a statement, not an omission", () =>
  withFixtures(() => {
    const r = propertyReliefOf(
      [ordinary, senior],
      input({ amount: 4000, basis: "net", applied: { [ORDINARY]: 0, [SENIOR]: 0 } }),
    );
    assert.equal(r.grossLevy, 4000);
    assert.ok(r.complete);
    assert.deepEqual(
      r.lines.map(l => [l.applied, l.remaining]),
      [
        [0, 570],
        [0, 275],
      ],
    );
  }));

test("an explicit zero bill keeps its meaning: a zero levy, owner eligibility, no fall back to value × rate", () =>
  withFixtures(() => {
    const zero = propertyReliefOf([ordinary, senior], input({ amount: 0 }));
    assert.equal(zero.grossLevy, 0);
    assert.deepEqual(
      zero.lines.map(l => [l.status, l.entitled, l.remaining]),
      [
        ["modelled", 0, 0],
        ["modelled", 0, 0],
      ],
    );
    const p = bcWith([ordinary, senior]);
    const hh = household({ propertyTaxBills: { BC: 0 } });
    const r = compute(y, p, hh);
    assert.equal(r.property, 0);
    assert.equal(r.breakdown.propertyRelief?.grossLevy, 0);
    assert.deepEqual(fixtureCredits(r), []);
    // A zero home value with a supplied bill is still an owner.
    const owner = compute(y, p, { ...hh, homeValue: 0, propertyTaxBills: { BC: 4000 } });
    assert.equal(owner.breakdown.propertyRelief?.lines[0].remaining, 570);
    // A zero home value with no bill is not.
    const none = compute(y, p, { ...hh, homeValue: 0, propertyTaxBills: undefined });
    assert.equal(none.breakdown.propertyRelief?.lines[0].entitled, 0);
  }));

test("a municipal program applies only to the default reference-city bill", () =>
  withFixtures(() => {
    const onDefault = propertyReliefOf([ordinary, city], input({ defaultCity: true, supplied: false }));
    assert.equal(lineOf(onDefault, CITY).status, "modelled");
    near(lineOf(onDefault, CITY).entitled ?? NaN, 200);
    assert.deepEqual(lineOf(onDefault, CITY).eligible, { cityLevy: 4000, levy: 4000 });

    const custom = propertyReliefOf([ordinary, city], input({ defaultCity: false }));
    const gated = lineOf(custom, CITY);
    assert.deepEqual([gated.status, gated.entitled, gated.remaining], ["city-bill-required", null, null]);
    assert.equal(lineOf(custom, ORDINARY).remaining, 570); // provincial relief still applies
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
      [ordinary, senior, city],
      input({ amount: 3800, basis: "net", applied: { [ORDINARY]: 0, [SENIOR]: 0, [CITY]: 200 } }),
    );
    assert.equal(netCustom.grossLevy, 4000);
    assert.equal(lineOf(netCustom, CITY).applied, 200);
    // ...but its amount is not required when the city program cannot run.
    const netCustomOmitted = propertyReliefOf(
      [ordinary, senior, city],
      input({ amount: 4000, basis: "net", applied: { [ORDINARY]: 0, [SENIOR]: 0 } }),
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
    near(credit({}) ?? NaN, 0.05 * 500000 * p.propertyTax.rate, "the reference city's own estimate");
    assert.equal(credit({ propertyTaxBills: { BC: 4000 } }), undefined);
    assert.equal(credit({ propertyRates: { BC: 0.01 } }), undefined);
    // Another province's bill or rate says nothing about this one.
    near(
      credit({ propertyTaxBills: { ON: 4000 }, propertyRates: { ON: 0.01 } }) ?? NaN,
      0.05 * 500000 * p.propertyTax.rate,
    );
    assert.equal(
      compute(y, p, { ...hh, propertyTaxBills: { BC: 4000 } }).breakdown.propertyRelief?.defaultCityBill,
      false,
    );
  }));

test("a program declared not modelled reports its reason with null amounts and credits nothing", () =>
  withFixtures(() => {
    const r = propertyReliefOf([unmodelled, ordinary], input());
    const line = lineOf(r, NOT_MODELLED);
    assert.deepEqual(
      [line.status, line.reason, line.entitled, line.applied, line.remaining],
      ["not-modelled", "award rule unresolved", null, 0, null],
    );
    assert.equal(lineOf(r, ORDINARY).remaining, 570); // the rest still computes
    assert.equal(r.credited, 570);
    assert.equal(r.complete, false);
    // It needs no handler, and a net bill need not state an amount for it.
    const net = propertyReliefOf(
      [unmodelled, ordinary],
      input({ amount: 3430, basis: "net", applied: { [ORDINARY]: 570 } }),
    );
    assert.equal(net.grossLevy, 4000);
    assert.equal(net.credited, 0);
    assert.equal(lineOf(net, NOT_MODELLED).applied, null);

    const p = bcWith([unmodelled]);
    const hh = household();
    const result = compute(y, p, hh);
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

    const over = propertyReliefOf([ordinary], input({ amount: 3000, basis: "net", applied: { [ORDINARY]: 1000 } }));
    assert.equal(over.grossLevy, 4000);
    assert.deepEqual([lineOf(over, ORDINARY).entitled, lineOf(over, ORDINARY).remaining], [570, 0]);
  }));

test("handlers see the lines evaluated before them, in data order", () =>
  withFixtures(() => {
    assert.equal(lineOf(propertyReliefOf([ordinary, senior], input()), SENIOR).entitled, 275);
    assert.equal(lineOf(propertyReliefOf([senior], input()), SENIOR).entitled, 845);
  }));

test("an unregistered program fails loudly, and the test seam registers only for the call", () => {
  assert.throws(
    () => propertyReliefOf([{ program: "no-such-program", scope: "provincial" }], input()),
    /No property relief handler/,
  );
  assert.throws(
    () =>
      withPropertyReliefHandler(ORDINARY, fixtureHandlers[ORDINARY], () => {
        withPropertyReliefHandler(ORDINARY, fixtureHandlers[ORDINARY], () => undefined);
      }),
    /already has a handler/,
  );
  assert.throws(() => propertyReliefOf([ordinary], input()), /No property relief handler/); // unregistered again
  assert.throws(
    () =>
      withPropertyReliefHandler(
        "fixture-bad",
        () => ({ status: "modelled", entitled: Number.NaN }),
        () => propertyReliefOf([{ program: "fixture-bad", scope: "provincial" }], input()),
      ),
    /non-finite/,
  );
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
    const p = bcWith([ordinary, senior]);
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
    propertyReliefApplied: { BC: { [ORDINARY]: 570, [SENIOR]: 0 }, ON: { other: 100 } },
  });
  const scaled = scaleHousehold(hh, 0.5);
  assert.deepEqual(scaled.propertyReliefApplied, { BC: { [ORDINARY]: 285, [SENIOR]: 0 }, ON: { other: 50 } });
  assert.deepEqual(scaled.propertyBillBasis, { BC: "net" });
  assert.equal(hh.propertyReliefApplied?.BC?.[ORDINARY], 570);
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
