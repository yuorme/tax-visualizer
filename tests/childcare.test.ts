import assert from "node:assert/strict";
import test from "node:test";
import { loadYear } from "../src/data/load.ts";
import { blank, type ChildcareInput, childcareOf, compute, type Household, type Person } from "../src/engine/index.ts";
import { snapshot } from "./golden/snapshot.mjs";

const hh = (people: Person[], childcare?: ChildcareInput, over: Partial<Household> = {}): Household => ({
  people,
  active: 0,
  adults: people.length,
  spouse: true,
  kids: 2,
  under6: 1,
  useBpa: true,
  useCredits: true,
  whRate: 0,
  homeValue: 0,
  rent: 1500,
  monthlySpending: 2000,
  childcare,
  ...over,
});
const auto = (expenses = 10_000, age = 3, earnedIncome: (number | null)[] = [60_000]): ChildcareInput => ({
  mode: "automatic",
  children: [{ age, expenses }],
  earnedIncome,
});

for (const year of [2025, 2026]) {
  const y = loadYear(year);
  const province = (code: string) => {
    const p = y.provinces.find(p => p.code === code);
    assert.ok(p);
    return p;
  };
  const result = (h: Household) => childcareOf(y.federal, h, h.people);
  test(`${year}: CRA published $19,000 example uses aggregate limits for three young children`, () => {
    // Folio S1-F3-C1 paragraph 1.42: expenses19k, earned30k, child pool24k, earnings cap20k ->19k.
    const h = hh([blank(30_000), blank(60_000)], {
      mode: "automatic",
      earnedIncome: [30_000, 60_000],
      children: [
        { age: 2, expenses: 19_000 },
        { age: 4, expenses: 0 },
        { age: 6, expenses: 0 },
      ],
    });
    const r = result(h);
    assert.equal(r.status, "complete");
    assert.equal(r.annualLimit, 24_000);
    assert.equal(r.earnedIncomeLimit, 20_000);
    assert.deepEqual(r.claims, [19_000, 0]);
    assert.deepEqual(r.childCounts, { kids: 3, under6: 2 });
  });

  test(`${year}: no-expense children still contribute to the annual pool`, () => {
    const h = hh([blank(60_000)], {
      ...auto(),
      children: [
        { age: 3, expenses: 10_000 },
        { age: 10, expenses: 0 },
      ],
    });
    assert.equal(result(h).annualLimit, 13_000);
    assert.deepEqual(result(h).claims, [10_000]); // Per-child min(expense,cap) would incorrectly give8k.
  });

  test(`${year}: year-end age, infirmity and DTC have distinct limits and benefit counts`, () => {
    for (const [age, infirm, disabilityTaxCredit, expected] of [
      [6, false, false, 8000],
      [7, false, false, 5000],
      [16, false, false, 5000],
      [17, false, false, 0],
      [17, true, false, 5000],
      [20, false, true, 11000],
    ] as const) {
      const r = result(
        hh([blank(60_000)], { ...auto(20_000), children: [{ age, expenses: 20_000, infirm, disabilityTaxCredit }] }),
      );
      assert.equal(r.claims[0], expected, `age${age}, infirm${infirm}, DTC${disabilityTaxCredit}`);
      assert.equal(r.childCounts?.kids, age < 18 ? 1 : 0);
      assert.equal(r.childCounts?.under6, 0);
    }
    assert.deepEqual(result(hh([blank(60_000)], auto(5000, 5))).childCounts, { kids: 1, under6: 1 });
  });

  test(`${year}: all three ordinary limits apply, including explicit zero earnings`, () => {
    assert.equal(result(hh([blank(60_000)], auto(3000))).claims[0], 3000);
    assert.equal(result(hh([blank(60_000)], auto(10_000))).claims[0], 8000);
    const capped = result(hh([blank(60_000)], auto(10_000, 3, [9000])));
    assert.equal(capped.claims[0], 6000);
    assert.ok(capped.reasons.includes("earned-income-limit"));
    const zero = result(hh([blank(60_000)], auto(10_000, 3, [0])));
    assert.equal(zero.status, "complete");
    assert.equal(zero.claims[0], 0);
  });

  test(`${year}: missing or invalid form input is reported and never applied as a completed claim`, () => {
    for (const input of [
      { mode: "automatic" },
      { ...auto(), earnedIncome: undefined },
      auto(10_000, 3, [null]),
    ] as ChildcareInput[]) {
      const r = result(hh([blank(60_000)], input));
      assert.equal(r.status, "incomplete");
      assert.deepEqual(r.claims, [0]);
    }
    for (const input of [
      auto(-1),
      auto(Number.NaN),
      auto(100, -1),
      auto(100, 2.5),
      auto(100, 3, [-1]),
      auto(100, 3, [Infinity]),
      auto(100, 3, Array(1)),
      { ...auto(), children: Array(1) },
    ]) {
      assert.ok(["invalid", "incomplete"].includes(result(hh([blank(60_000)], input)).status));
    }
  });

  test(`${year}: RRSP/FHSA change the lower-income claimant; equal income elects first adult`, () => {
    const original = [blank(70_000), blank(60_000)];
    const care = auto(10_000, 3, [70_000, 60_000]);
    assert.deepEqual(result(hh(original, care)).claims, [0, 8000]);
    assert.deepEqual(result(hh([{ ...original[0], rrsp: 10_000, fhsa: 10_000 }, original[1]], care)).claims, [8000, 0]);
    const tie = result(hh([blank(60_000), blank(60_000)], care));
    assert.deepEqual(tie.claims, [8000, 0]);
    assert.ok(tie.reasons.includes("equal-income-election-first-adult"));
  });

  test(`${year}: zero-income spouse remains claimant, including an implicit second adult`, () => {
    const care = auto(10_000, 3, [60_000, 0]);
    const explicit = compute(y, province("ON"), hh([blank(60_000), blank(0)], care));
    const implicit = compute(y, province("ON"), hh([blank(60_000)], care, { adults: 2 }));
    assert.deepEqual(explicit.childcare.claims, [0, 0]);
    assert.equal(explicit.childcare.claimant, 1);
    assert.deepEqual(implicit.childcare, explicit.childcare);
    assert.equal(implicit.total, explicit.total);
    assert.equal(compute(y, province("ON"), hh([blank(60_000)], auto(), { adults: 2 })).childcare.status, "incomplete");
  });

  test(`${year}: unsupported supporting-person situations require deliberate manual mode`, () => {
    assert.equal(result(hh([blank(60_000), blank(30_000)], auto(), { spouse: false })).status, "manual-required");
    assert.equal(result(hh([blank(60_000)], auto(), { adults: 3 })).status, "manual-required");
    const manual = hh(
      [blank(60_000), blank(0)],
      { mode: "manual", children: [{ age: 17, expenses: 10_000 }], manualClaims: [6000, 4000] },
      { spouse: false },
    );
    assert.equal(result(manual).status, "complete");
    assert.deepEqual(result(manual).claims, [6000, 4000]); // Verified exception replaces ordinary age/earnings rules.
    assert.ok(manual.childcare);
    for (const manualClaims of [[10_001, 0], [-1, 0], [NaN, 0], Array(2)])
      assert.equal(result({ ...manual, childcare: { ...manual.childcare, manualClaims } }).status, "invalid");
  });

  test(`${year}: deductions flow through tax/benefits without mutating the original claims or cash`, () => {
    const h = hh([{ ...blank(60_000), ded: 2000, rrsp: 3000, fhsa: 4000 }], auto(9000), { kids: 1, under6: 1 });
    const original = structuredClone(h);
    for (const p of y.provinces) {
      const r = compute(y, p, h);
      const no = compute(y, p, { ...h, childcare: undefined });
      assert.equal(r.cash, no.cash);
      assert.deepEqual(r.me.pay, no.me.pay); // Ontario's income-based health premium can change separately.
      assert.equal(r.me.breakdown.netIncome.ded, 17_000);
      assert.equal(r.me.ti, no.me.ti - 8000);
      assert.ok(r.ccb > no.ccb);
      if (p.code !== "QC") {
        // Isolate federal/provincial deduction plumbing from dedicated provincial childcare credits.
        const withoutCredit = { ...p, childcareCredit: undefined };
        const legacy = compute(y, withoutCredit, {
          ...h,
          childcare: undefined,
          people: [{ ...h.people[0], ded: 10_000 }],
        });
        assert.deepEqual(snapshot(compute(y, withoutCredit, h)), snapshot(legacy));
      }
    }
    assert.deepEqual(h, original);
  });

  test(`${year}: Quebec provincial tax and existing provincial benefits do not deduct federal childcare`, () => {
    const h = hh([blank(60_000)], auto(9000), { kids: 1, under6: 1 });
    const r = compute(y, province("QC"), h);
    const no = compute(y, province("QC"), { ...h, childcare: undefined });
    assert.equal(r.me.ti, no.me.ti - 8000);
    assert.equal(r.me.tiP, no.me.tiP);
    assert.equal(r.prov, no.prov);
    assert.equal(r.provBen, no.provBen);
    const qcCredits = (r: ReturnType<typeof compute>) => r.credits.filter(([name]) => /solidarity|premium/i.test(name));
    assert.deepEqual(qcCredits(r), qcCredits(no));
    assert.equal(r.breakdown.incomeBases.provincialFamily, r.me.tiP);
    assert.ok(r.breakdown.incomeBases.provincialFamily < no.famNet); // Worker deduction enters Quebec benefit bases.
  });

  test(`${year}: excessive deductions floor federal and provincial bases independently`, () => {
    const h = hh([{ ...blank(2000), rrsp: 3000 }], {
      mode: "manual",
      children: [{ age: 4, expenses: 2000 }],
      manualClaims: [2000],
    });
    const r = compute(y, province("QC"), h);
    assert.equal(r.me.ti, 0);
    assert.equal(r.me.tiP, 0); // Never add childcare back to a floored federal zero.
    assert.equal(r.breakdown.incomeBases.beforeChildcare[0], -1000);
  });

  test(`${year}: Quebec spouse transfers keep the provincial claimant when manual federal claims reverse incomes`, () => {
    const h = hh(
      [blank(18_000), blank(16_000)],
      {
        mode: "manual",
        children: [{ age: 3, expenses: 10_000 }],
        manualClaims: [10_000, 0],
      },
      { kids: 1, under6: 1 },
    );
    const r = compute(y, province("QC"), h);
    const no = compute(y, province("QC"), { ...h, childcare: undefined });
    assert.equal(r.claim?.c, 1);
    assert.equal(r.claim?.provincialClaimant, 0);
    assert.equal(r.prov, no.prov);
    assert.deepEqual(
      r.list.map(x => x.pSp),
      no.list.map(x => x.pSp),
    );
  });

  test(`${year}: unsupported years, empty profiles and very large finite earnings are explicit and finite`, () => {
    const h = hh([blank(60_000)], auto(10_000, 3, [Number.MAX_VALUE]));
    assert.equal(result(h).claims[0], 8000);
    assert.ok(Number.isFinite(result(h).earnedIncomeLimit));
    assert.equal(childcareOf({ ...y.federal, childcare: undefined }, h, h.people).status, "unsupported");
    const empty = result(hh([blank(60_000)], { mode: "automatic", children: [] }));
    assert.equal(empty.status, "complete");
    assert.deepEqual(empty.childCounts, { kids: 0, under6: 0 });
    assert.deepEqual(empty.claims, [0]);
  });

  test(`${year}: detailed ages override legacy benefit counts while absent details preserve them`, () => {
    const h = hh(
      [blank(60_000)],
      {
        mode: "automatic",
        children: [
          { age: 3, expenses: 0 },
          { age: 10, expenses: 0 },
          { age: 20, expenses: 0, infirm: true },
        ],
      },
      { kids: 6, under6: 6 },
    );
    const expected = { ...h, childcare: undefined, kids: 2, under6: 1 };
    for (const p of y.provinces) assert.deepEqual(snapshot(compute(y, p, h)), snapshot(compute(y, p, expected)));
  });

  test(`${year}: marginal and investment counterfactuals reselect claimant but keep explicit earnings fixed`, () => {
    const h = hh([blank(30_000), { ...blank(30_050), fd: 2000 }], auto(10_000, 3, [9000, 30_050]));
    const r = compute(y, province("ON"), h);
    for (const key of ["ord", "fd"] as const) {
      const more = { ...h, people: [{ ...h.people[0], [key]: h.people[0][key] + 100 }, h.people[1]] };
      const next = compute(y, province("ON"), more);
      assert.equal(r.margBy[key], (next.netTotal - r.netTotal) / 100);
      assert.equal(next.childcare.earnedIncomeLimit, 6000);
    }
    const crossing = { ...h, people: [h.people[0], blank(30_050)] };
    assert.equal(compute(y, province("ON"), crossing).childcare.claimant, 0);
    const raised = { ...crossing, people: [blank(30_100), crossing.people[1]] };
    assert.equal(compute(y, province("ON"), raised).childcare.claimant, 1);
  });
}
